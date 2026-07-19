/* ==========================================================================
   Billetera digital — app.js
   --------------------------------------------------------------------------
   Estado persistente con Local Storage. Ahora soporta MÚLTIPLES usuarios:
   cada uno tiene su propia sesión, su propio saldo, contactos e historial.
   Todo vive dentro del objeto `Wallet`, para no ensuciar el `window` global.
   ========================================================================== */
const Wallet = {
  usersKey: 'billeteraDigitalUsuarios',
  sessionKey: 'billeteraDigitalSesion',
  stateKeyPrefix: 'billeteraDigitalEstado_',

  /* ---------------------------------------------------------------- *
   * Datos iniciales de demostración (se crean una sola vez)
   * ---------------------------------------------------------------- */
  seed() {
    if (localStorage.getItem(this.usersKey)) return; // ya sembrado

    const users = [{ email: 'admin@wallet.com', password: '12345', fullName: 'Usuario Demo' }];
    localStorage.setItem(this.usersKey, JSON.stringify(users));

    const demoState = {
      balance: 125000,
      contacts: [
        { id: 1, name: 'María López', alias: 'maria.lopez', cbu: '0000003100012345678901' },
        { id: 2, name: 'Juan Pérez', alias: 'juan.perez', cbu: '0000003100098765432109' }
      ],
      transactions: [
        { type: 'deposito', description: 'Carga inicial', amount: 125000, date: '13/07/2026' },
        { type: 'compra', description: 'Compra en Mercado', amount: -18450, date: '12/07/2026' },
        { type: 'transferencia_recibida', description: 'Transferencia de Ana', amount: 25000, date: '10/07/2026' }
      ]
    };
    localStorage.setItem(this.stateKeyPrefix + 'admin@wallet.com', JSON.stringify(demoState));
  },

  /* ---------------------------------------------------------------- *
   * Usuarios / autenticación
   * ---------------------------------------------------------------- */
  getUsers() { return JSON.parse(localStorage.getItem(this.usersKey) || '[]'); },
  saveUsers(users) { localStorage.setItem(this.usersKey, JSON.stringify(users)); },

  register({ fullName, email, password }) {
    const users = this.getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: 'Ya existe una cuenta con ese correo.' };
    }
    users.push({ fullName, email, password });
    this.saveUsers(users);
    // Usuario nuevo arranca en cero, sin contactos ni movimientos
    localStorage.setItem(this.stateKeyPrefix + email, JSON.stringify({ balance: 0, contacts: [], transactions: [] }));
    return { ok: true };
  },

  login(email, password) {
    const user = this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) return { ok: false, error: 'Credenciales inválidas.' };
    localStorage.setItem(this.sessionKey, email);
    return { ok: true, user };
  },

  logout() { localStorage.removeItem(this.sessionKey); },
  currentEmail() { return localStorage.getItem(this.sessionKey); },

  // Redirige a login.html si no hay sesión activa. Se llama al inicio de
  // cada pantalla interna (menu, deposit, sendmoney, transactions).
  requireAuth() {
    const email = this.currentEmail();
    if (!email) { window.location.href = 'login.html'; return null; }
    return email;
  },

  /* ---------------------------------------------------------------- *
   * Estado de la billetera del usuario actual
   * ---------------------------------------------------------------- */
  get() {
    const email = this.currentEmail();
    const saved = localStorage.getItem(this.stateKeyPrefix + email);
    return saved ? JSON.parse(saved) : { balance: 0, contacts: [], transactions: [] };
  },
  save(data) { localStorage.setItem(this.stateKeyPrefix + this.currentEmail(), JSON.stringify(data)); },

  money(value) {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
  },

  alert(target, type, message) {
    $(target).html(`<div class="alert alert-${type} alert-dismissible fade show" role="alert">${message}<button type="button" class="close" data-dismiss="alert"><span>&times;</span></button></div>`);
  },

  addTransaction(type, description, amount) {
    const data = this.get();
    data.transactions.unshift({ type, description, amount, date: new Date().toLocaleDateString('es-CL') });
    this.save(data);
  },

  deposit(amount) {
    const data = this.get();
    data.balance += amount;
    this.save(data);
    this.addTransaction('deposito', 'Depósito de dinero', amount);
    return data.balance;
  },

  withdraw(amount) {
    const data = this.get();
    if (amount > data.balance) return { ok: false, error: 'No tienes saldo suficiente para este retiro.' };
    data.balance -= amount;
    this.save(data);
    this.addTransaction('retiro', 'Retiro de fondos', -amount);
    return { ok: true, balance: data.balance };
  },

  sendMoney(contact, amount) {
    const data = this.get();
    if (amount > data.balance) return { ok: false, error: 'No tienes saldo suficiente para esta transferencia.' };
    data.balance -= amount;
    this.save(data);
    this.addTransaction('transferencia_enviada', `Transferencia a ${contact.name}`, -amount);
    return { ok: true, balance: data.balance };
  },

  receiveMoney(senderName, amount) {
    const data = this.get();
    data.balance += amount;
    this.save(data);
    this.addTransaction('transferencia_recibida', `Transferencia de ${senderName}`, amount);
    return data.balance;
  },

  addContact({ name, alias, cbu }) {
    const data = this.get();
    const contact = { id: Date.now(), name, alias, cbu };
    data.contacts.push(contact);
    this.save(data);
    return contact;
  }
};

Wallet.seed();

$(function () {
  /* ==================================================================== *
   * NAVBAR: resalta el link activo y engancha el botón de logout,
   * presente en todas las pantallas internas.
   * ==================================================================== */
  const currentPage = window.location.pathname.split('/').pop();
  $('.navbar-glam .nav-link').each(function () {
    if ($(this).attr('href') === currentPage) $(this).addClass('active');
  });
  $('#logoutBtn').on('click', function () {
    Wallet.logout();
    window.location.href = 'login.html';
  });

  /* ==================================================================== *
   * LOGIN + REGISTRO (login.html)
   * ==================================================================== */
  if ($('#loginForm').length) {
    // Si ya hay sesión activa, saltamos directo al menú
    if (Wallet.currentEmail()) { window.location.href = 'menu.html'; return; }

    // Toggle de pestañas
    $('#tabLogin').on('click', function () {
      $(this).addClass('active'); $('#tabRegister').removeClass('active');
      $('#loginForm').removeClass('d-none'); $('#registerForm').addClass('d-none');
    });
    $('#tabRegister').on('click', function () {
      $(this).addClass('active'); $('#tabLogin').removeClass('active');
      $('#registerForm').removeClass('d-none'); $('#loginForm').addClass('d-none');
    });

    $('#loginForm').on('submit', function (event) {
      event.preventDefault();
      const email = $('#email').val().trim();
      const password = $('#password').val();
      if (!email || !password) return Wallet.alert('#alert-container', 'warning', 'Completa tu correo y contraseña.');

      const result = Wallet.login(email, password);
      if (!result.ok) return Wallet.alert('#alert-container', 'danger', result.error + ' Prueba con admin@wallet.com y 12345.');

      Wallet.alert('#alert-container', 'success', '¡Inicio de sesión exitoso! Redirigiendo…');
      setTimeout(() => window.location.href = 'menu.html', 600);
    });

    $('#registerForm').on('submit', function (event) {
      event.preventDefault();
      const fullName = $('#regName').val().trim();
      const email = $('#regEmail').val().trim();
      const password = $('#regPassword').val();
      if (!fullName || !email || password.length < 5) {
        return Wallet.alert('#alert-container', 'warning', 'Completa nombre, correo y una contraseña de al menos 5 caracteres.');
      }
      const result = Wallet.register({ fullName, email, password });
      if (!result.ok) return Wallet.alert('#alert-container', 'danger', result.error);

      Wallet.login(email, password);
      Wallet.alert('#alert-container', 'success', '¡Cuenta creada! Redirigiendo a tu billetera…');
      setTimeout(() => window.location.href = 'menu.html', 600);
    });
  }

  /* ==================================================================== *
   * MENÚ PRINCIPAL (menu.html)
   * ==================================================================== */
  if ($('#menuBalance').length) {
    if (!Wallet.requireAuth()) return;
    const data = Wallet.get();

    // Animación de conteo del saldo (JS puro, sin jQuery) para dar
    // sensación de "carga" premium al entrar al dashboard.
    const target = data.balance;
    const start = performance.now();
    const duration = 800;
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      $('#menuBalance').text(Wallet.money(Math.round(target * eased)));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);

    // Transición suave de las tarjetas de acción al cargar la página
    $('.action-card').css('opacity', 0).each(function (i) {
      $(this).delay(i * 90).animate({ opacity: 1 }, 260);
    });

    $('.menu-action').on('click', function () {
      const screen = $(this).data('screen'), label = $(this).data('label');
      Wallet.alert('#menu-alert', 'info', `Redirigiendo a ${label}…`);
      setTimeout(() => window.location.href = screen, 500);
    });
  }

  /* ==================================================================== *
   * DEPÓSITO / RETIRO (deposit.html)
   * ==================================================================== */
  if ($('#currentBalance').length) {
    if (!Wallet.requireAuth()) return;
    let mode = 'deposito';

    function refreshBalance() { $('#currentBalance').text(Wallet.money(Wallet.get().balance)); }
    refreshBalance();

    $('#tabDeposit').on('click', function () {
      mode = 'deposito';
      $(this).addClass('active'); $('#tabWithdraw').removeClass('active');
      $('#fundsSubmit').text('Depositar');
    });
    $('#tabWithdraw').on('click', function () {
      mode = 'retiro';
      $(this).addClass('active'); $('#tabDeposit').removeClass('active');
      $('#fundsSubmit').text('Retirar');
    });

    $('#depositForm').on('submit', function (e) {
      e.preventDefault();
      const amount = Number($('#amount').val());
      if (!Number.isFinite(amount) || amount <= 0) return Wallet.alert('#alert-container', 'danger', 'Ingresa un monto positivo válido.');

      if (mode === 'deposito') {
        Wallet.deposit(amount);
        $('#deposit-legend').removeClass('d-none').text(`Depositaste ${Wallet.money(amount)}.`);
        Wallet.alert('#alert-container', 'success', '¡Depósito realizado con éxito! Volverás al menú en unos segundos.');
      } else {
        const result = Wallet.withdraw(amount);
        if (!result.ok) return Wallet.alert('#alert-container', 'danger', result.error);
        $('#deposit-legend').removeClass('d-none').text(`Retiraste ${Wallet.money(amount)}.`);
        Wallet.alert('#alert-container', 'success', '¡Retiro realizado con éxito! Volverás al menú en unos segundos.');
      }

      this.reset();
      refreshBalance();
      setTimeout(() => window.location.href = 'menu.html', 1800);
    });
  }

  /* ==================================================================== *
   * ENVIAR / RECIBIR DINERO (sendmoney.html)
   * ==================================================================== */
  if ($('#contactsList').length) {
    if (!Wallet.requireAuth()) return;
    let selected = null;

    // --- Toggle Enviar / Recibir --------------------------------------
    $('#tabSend').on('click', function () {
      $(this).addClass('active'); $('#tabReceive').removeClass('active');
      $('#sendSection').removeClass('d-none'); $('#receiveSection').addClass('d-none');
    });
    $('#tabReceive').on('click', function () {
      $(this).addClass('active'); $('#tabSend').removeClass('active');
      $('#receiveSection').removeClass('d-none'); $('#sendSection').addClass('d-none');
    });

    // --- Render de contactos --------------------------------------------
    const renderContacts = contacts => $('#contactsList').html(
      contacts.length
        ? contacts.map(c => `<button type="button" class="contact list-group-item list-group-item-action d-flex align-items-center" data-id="${c.id}"><span class="avatar mr-3">${c.name.charAt(0)}</span><span><strong>${c.name}</strong><br><small class="muted">${c.alias}</small></span></button>`).join('')
        : '<p class="muted text-center p-3">No hay contactos que coincidan.</p>'
    );
    renderContacts(Wallet.get().contacts);

    // --- Modal "Agregar contacto" (Bootstrap modal real) -----------------
    $('#contactForm').on('submit', function (e) {
      e.preventDefault();
      const name = $('#contactName').val().trim();
      const alias = $('#contactAlias').val().trim();
      const cbu = $('#contactCbu').val().trim();
      if (!name || !alias || !/^\d{22}$/.test(cbu)) {
        return Wallet.alert('#alert-container', 'danger', 'Completa nombre, alias y un CBU de 22 dígitos.');
      }
      Wallet.addContact({ name, alias, cbu });
      renderContacts(Wallet.get().contacts);
      this.reset();
      $('#contactModal').modal('hide');
      Wallet.alert('#alert-container', 'success', 'Contacto agregado a tu agenda.');
    });

    // --- Autocompletar EN TIEMPO REAL (Lección 6: jQuery) -----------------
    // A medida que el usuario escribe, filtramos los contactos y mostramos
    // coincidencias en un desplegable propio (sin necesidad de tocar "Buscar").
    const $search = $('#search');
    const $results = $('#autocompleteResults');

    $search.on('input', function () {
      const term = $(this).val().trim().toLowerCase();
      if (!term) { $results.hide().empty(); renderContacts(Wallet.get().contacts); return; }

      const matches = Wallet.get().contacts.filter(c =>
        c.name.toLowerCase().includes(term) || c.alias.toLowerCase().includes(term)
      );

      if (matches.length === 0) {
        $results.html('<div class="ac-item muted">Sin coincidencias</div>').show();
      } else {
        $results.html(matches.map(c =>
          `<div class="ac-item" data-id="${c.id}"><span class="avatar" style="width:28px;height:28px;font-size:.75rem;">${c.name.charAt(0)}</span><span><strong>${c.name}</strong><br><small class="muted">${c.alias}</small></span></div>`
        ).join('')).show();
      }
      // El listado de abajo también se filtra en vivo, para reforzar el autocompletar
      renderContacts(matches);
    });

    $results.on('click', '.ac-item', function () {
      const id = $(this).data('id');
      if (!id) return;
      const contact = Wallet.get().contacts.find(c => String(c.id) === String(id));
      if (!contact) return;
      $search.val(contact.name);
      $results.hide().empty();
      renderContacts([contact]);
    });

    $(document).on('click', function (e) {
      if (!$(e.target).closest('.autocomplete-wrap').length) $results.hide();
    });

    // --- Selección de contacto para enviar --------------------------------
    $('#contactsList').on('click', '.contact', function () {
      selected = Wallet.get().contacts.find(c => String(c.id) === String($(this).data('id')));
      $('.contact').removeClass('selected');
      $(this).addClass('selected');
      $('#selectedContact').text(`${selected.name} · ${selected.alias}`);
      $('#sendPanel').removeClass('d-none');
    });

    $('#sendForm').on('submit', function (e) {
      e.preventDefault();
      const amount = Number($('#sendAmount').val());
      if (!Number.isFinite(amount) || amount <= 0) return Wallet.alert('#alert-container', 'danger', 'Ingresa un monto válido.');
      if (!selected) return Wallet.alert('#alert-container', 'danger', 'Selecciona un contacto de la lista.');

      const result = Wallet.sendMoney(selected, amount);
      if (!result.ok) return Wallet.alert('#alert-container', 'danger', result.error);

      Wallet.alert('#alert-container', 'success', `Envío de ${Wallet.money(amount)} a ${selected.name} realizado con éxito.`);
      this.reset();
      $('#sendPanel').addClass('d-none');
      $('.contact').removeClass('selected');
      selected = null;
    });

    // --- Simular recepción de fondos ---------------------------------------
    $('#receiveForm').on('submit', function (e) {
      e.preventDefault();
      const sender = $('#senderName').val().trim();
      const amount = Number($('#receiveAmount').val());
      if (!sender) return Wallet.alert('#alert-container', 'danger', 'Ingresa el nombre de quien te envía el dinero.');
      if (!Number.isFinite(amount) || amount <= 0) return Wallet.alert('#alert-container', 'danger', 'Ingresa un monto válido.');

      const newBalance = Wallet.receiveMoney(sender, amount);
      Wallet.alert('#alert-container', 'success', `Recibiste ${Wallet.money(amount)} de ${sender}. Nuevo saldo: ${Wallet.money(newBalance)}.`);
      this.reset();
    });
  }

  /* ==================================================================== *
   * HISTORIAL DE MOVIMIENTOS (transactions.html)
   * ==================================================================== */
  if ($('#transactionsList').length) {
    if (!Wallet.requireAuth()) return;

    const label = {
      compra: 'Compra',
      deposito: 'Depósito',
      retiro: 'Retiro',
      transferencia_recibida: 'Transferencia recibida',
      transferencia_enviada: 'Transferencia enviada'
    };

    function render(filter = 'todos') {
      const list = Wallet.get().transactions.filter(t => filter === 'todos' || t.type === filter);
      $('#transactionsList').html(
        list.length
          ? list.map(t => `<li class="movement ${t.amount >= 0 ? 'in' : 'out'} list-group-item d-flex justify-content-between align-items-center px-2"><div><strong>${t.description}</strong><br><small class="muted">${label[t.type] || t.type} · ${t.date}</small></div><span class="text-mono ${t.amount >= 0 ? 'amount-positive' : 'amount-negative'}">${t.amount >= 0 ? '+' : ''}${Wallet.money(t.amount)}</span></li>`).join('')
          : '<li class="list-group-item text-center muted">No hay movimientos para este filtro.</li>'
      );
    }

    $('#transactionFilter').on('change', function () { render($(this).val()); });
    render();
  }
});
