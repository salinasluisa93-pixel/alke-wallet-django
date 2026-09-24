from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from .models import Cliente, Cuenta, Transaccion


class WalletFlowTests(TestCase):
	def setUp(self):
		self.user = get_user_model().objects.create_user(username='ana', password='password-segura')
		self.cliente = Cliente.objects.create(usuario=self.user, documento='DOC-001')
		self.cuenta = Cuenta.objects.create(cliente=self.cliente, tipo=Cuenta.Tipo.AHORRO)
		self.client.login(username='ana', password='password-segura')

	def test_dashboard_requires_authentication(self):
		self.client.logout()
		response = self.client.get(reverse('gestion:dashboard'))
		self.assertRedirects(response, '/login/?next=/')

	def test_create_deposit_updates_balance(self):
		response = self.client.post(
			reverse('gestion:transaccion-create', kwargs={'pk': self.cuenta.pk}),
			{'tipo': Transaccion.Tipo.DEPOSITO, 'monto': '1250.00', 'descripcion': 'Ahorro mensual', 'cuenta_destino': ''},
		)
		self.assertRedirects(response, reverse('gestion:cuenta-detail', kwargs={'pk': self.cuenta.pk}))
		self.cuenta.refresh_from_db()
		self.assertEqual(self.cuenta.saldo, 1250)
