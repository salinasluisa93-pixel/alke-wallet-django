from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class Cliente(models.Model):
	usuario = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cliente')
	telefono = models.CharField(max_length=20, blank=True)
	documento = models.CharField(max_length=20, unique=True)
	creado_en = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['usuario__last_name', 'usuario__first_name']

	def __str__(self):
		return self.usuario.get_full_name() or self.usuario.username


class Cuenta(models.Model):
	class Tipo(models.TextChoices):
		CORRIENTE = 'CORRIENTE', 'Cuenta corriente'
		AHORRO = 'AHORRO', 'Cuenta de ahorro'

	cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='cuentas')
	numero = models.CharField(max_length=20, unique=True, editable=False)
	tipo = models.CharField(max_length=12, choices=Tipo.choices, default=Tipo.AHORRO)
	saldo = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'), validators=[MinValueValidator(Decimal('0.00'))])
	activa = models.BooleanField(default=True)
	creada_en = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['-creada_en']

	def save(self, *args, **kwargs):
		if not self.numero:
			self.numero = f'ALK{self.cliente_id or 0:04d}{Cuenta.objects.count() + 1:08d}'
		super().save(*args, **kwargs)

	def __str__(self):
		return f'{self.numero} - {self.get_tipo_display()}'


class Beneficiario(models.Model):
	nombre = models.CharField(max_length=120)
	cuenta = models.ForeignKey(Cuenta, on_delete=models.CASCADE, related_name='beneficiarios')
	cuentas_origen = models.ManyToManyField(Cuenta, related_name='beneficiarios_asignados', blank=True)

	def __str__(self):
		return self.nombre


class Transaccion(models.Model):
	class Tipo(models.TextChoices):
		DEPOSITO = 'DEPOSITO', 'Depósito'
		RETIRO = 'RETIRO', 'Retiro'
		TRANSFERENCIA = 'TRANSFERENCIA', 'Transferencia'

	cuenta = models.ForeignKey(Cuenta, on_delete=models.PROTECT, related_name='transacciones')
	cuenta_destino = models.ForeignKey(Cuenta, on_delete=models.PROTECT, null=True, blank=True, related_name='transferencias_recibidas')
	tipo = models.CharField(max_length=14, choices=Tipo.choices)
	monto = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
	descripcion = models.CharField(max_length=180, blank=True)
	creada_en = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['-creada_en']

	def __str__(self):
		return f'{self.get_tipo_display()} ${self.monto}'

# Create your models here.
