# Alke Wallet

Alke Wallet es una billetera digital educativa desarrollada con Django. Permite
administrar clientes, cuentas y movimientos financieros desde una interfaz web
con autenticación, panel administrativo y persistencia relacional.

## Arquitectura

El proyecto utiliza una arquitectura Django por capas:

```text
proyectos-django/
|-- manage.py                 # Punto de entrada de comandos Django
|-- mi_proyecto/
|   |-- settings.py           # Configuración de aplicaciones, BD y estáticos
|   |-- urls.py               # Rutas globales, admin y autenticación
|   |-- asgi.py               # Entrada para servidores ASGI
|   `-- wsgi.py               # Entrada para servidores WSGI
|-- gestion/
|   |-- models.py             # Modelo de dominio financiero
|   |-- views.py              # Vistas basadas en clases y reglas de acceso
|   |-- forms.py              # Formularios y validaciones de entrada
|   |-- urls.py               # Rutas de dashboard y operaciones CRUD
|   |-- admin.py              # Registro y configuración del admin
|   |-- tests.py              # Pruebas de autenticación y movimientos
|   `-- migrations/           # Historial versionado del esquema
|-- templates/
|   |-- base.html             # Plantilla común y navegación
|   |-- gestion/              # Dashboard, cuentas y transacciones
|   `-- registration/         # Plantilla de inicio de sesión
|-- static/css/app.css        # Estilos de la interfaz
|-- .env.example              # Variables de entorno de referencia
|-- requirements.txt          # Dependencias Python
`-- README.md                 # Documentación técnica
```

La aplicación principal es `gestion`. Django aporta las aplicaciones
preinstaladas `admin`, `auth`, `contenttypes`, `sessions` y `staticfiles`.

### Modelo de datos

- `Cliente` tiene una relación uno a uno con el usuario de Django.
- `Cuenta` pertenece a un cliente mediante una relación muchos a uno.
- `Transaccion` pertenece a una cuenta y puede tener una cuenta de destino.
- `Beneficiario` se relaciona con cuentas mediante una relación muchos a muchos.
- `Cuenta.saldo` usa `DecimalField` y valida valores no negativos.
- `Transaccion.monto` valida valores positivos.

## Configuración realizada

### Base de datos

El entorno local utiliza SQLite y crea `db.sqlite3` en la raíz del proyecto.
Para producción se puede definir `DATABASE_URL` con una conexión PostgreSQL:

```text
DATABASE_URL=postgresql://usuario:contraseña@host:5432/alke_wallet
```

La configuración se encuentra en `mi_proyecto/settings.py` y usa
`dj-database-url` para interpretar la URL de PostgreSQL.

### Variables de entorno

Copia `.env.example` como referencia y configura las variables en el entorno
del sistema. No subas un archivo `.env` real al repositorio.

```text
DJANGO_SECRET_KEY=una-clave-larga-y-aleatoria
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgresql://usuario:contraseña@host:5432/alke_wallet
```

`DJANGO_DEBUG=True` es apropiado únicamente para desarrollo. En producción se
debe usar una clave secreta real, `DJANGO_DEBUG=False`, HTTPS y hosts explícitos.

### Archivos estáticos y autenticación

- Los archivos estáticos se sirven desde `static/` durante el desarrollo.
- El CSS principal está en `static/css/app.css`.
- El login está disponible en `/login/`.
- El logout utiliza un formulario `POST` protegido con CSRF.
- El panel administrativo está disponible en `/admin/`.
- Las vistas del wallet requieren un usuario autenticado.

## Instalación local en Windows

Abre PowerShell en la carpeta del proyecto:

```powershell
cd C:\proyectos\proyectos-django
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Si PowerShell bloquea la activación del entorno, puede usarse directamente el
ejecutable de `.venv` o habilitar la política de ejecución para el usuario:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

## Crear y sincronizar la base de datos

Genera migraciones después de modificar modelos y aplícalas con `migrate`:

```powershell
python manage.py makemigrations
python manage.py migrate
```

Para crear un usuario administrador:

```powershell
python manage.py createsuperuser
```

## Ejecutar la aplicación

```powershell
python manage.py runserver
```

Abre <http://127.0.0.1:8000/> e inicia sesión. El administrador se encuentra
en <http://127.0.0.1:8000/admin/>.

## Funcionalidades principales

- Dashboard con saldo total, cuentas activas y movimientos recientes.
- Crear, consultar, editar y eliminar cuentas propias.
- Registrar depósitos, retiros y transferencias.
- Consultar el historial de movimientos de cada cuenta.
- Consultas ORM con `filter`, `exclude`, `select_related`, `aggregate`,
  `annotate`, `Count` y `Sum`.
- Administración de modelos mediante Django Admin.
- Formularios protegidos con tokens CSRF.

## Pruebas y comprobaciones

Ejecuta estos comandos antes de entregar cambios:

```powershell
python manage.py check
python manage.py test
python manage.py showmigrations
```

El proyecto incluye pruebas para el acceso autenticado al dashboard y para
verificar que un depósito actualiza el saldo de la cuenta.

## Flujo de trabajo recomendado

1. Crear o actualizar modelos en `gestion/models.py`.
2. Ejecutar `python manage.py makemigrations`.
3. Revisar la migración generada.
4. Ejecutar `python manage.py migrate`.
5. Implementar formularios, vistas y plantillas.
6. Ejecutar `check` y `test`.
7. Crear un commit descriptivo y subirlo a GitHub.

## Dependencias

- Python 3.14 o compatible con las dependencias instaladas.
- Django 5.2.
- `psycopg` para PostgreSQL.
- `dj-database-url` para configurar la base de datos mediante URL.

## Repositorio

El código fuente está publicado en:

<https://github.com/salinasluisa93-pixel/alke-wallet-django>
