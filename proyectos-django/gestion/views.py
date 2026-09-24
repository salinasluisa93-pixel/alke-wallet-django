from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Count, Sum
from django.db.models.functions import Coalesce
from django.urls import reverse, reverse_lazy
from django.views.generic import CreateView, DeleteView, DetailView, ListView, TemplateView, UpdateView

from .forms import CuentaForm, TransaccionForm
from .models import Cliente, Cuenta, Transaccion


class ClienteRequiredMixin(LoginRequiredMixin):
	def get_cliente(self):
		cliente, _ = Cliente.objects.get_or_create(
			usuario=self.request.user,
			defaults={'documento': f'USR-{self.request.user.pk}'},
		)
		return cliente


class DashboardView(ClienteRequiredMixin, TemplateView):
	template_name = 'gestion/dashboard.html'

	def get_context_data(self, **kwargs):
		context = super().get_context_data(**kwargs)
		cliente = self.get_cliente()
		cuentas = Cuenta.objects.filter(cliente=cliente, activa=True)
		context.update({
			'cliente': cliente,
			'cuentas': cuentas,
			'saldo_total': cuentas.aggregate(total=Coalesce(Sum('saldo'), 0))['total'],
			'movimientos': Transaccion.objects.filter(cuenta__cliente=cliente).select_related('cuenta')[:6],
			'cuentas_con_movimientos': cuentas.annotate(total_movimientos=Count('transacciones')),
		})
		return context


class CuentaOwnerMixin(ClienteRequiredMixin):
	def get_queryset(self):
		return Cuenta.objects.filter(cliente=self.get_cliente())


class CuentaListView(CuentaOwnerMixin, ListView):
	model = Cuenta
	template_name = 'gestion/cuenta_list.html'
	context_object_name = 'cuentas'


class CuentaCreateView(ClienteRequiredMixin, CreateView):
	model = Cuenta
	form_class = CuentaForm
	template_name = 'gestion/cuenta_form.html'
	success_url = reverse_lazy('gestion:cuenta-list')

	def form_valid(self, form):
		form.instance.cliente = self.get_cliente()
		return super().form_valid(form)


class CuentaDetailView(CuentaOwnerMixin, DetailView):
	model = Cuenta
	template_name = 'gestion/cuenta_detail.html'
	context_object_name = 'cuenta'

	def get_context_data(self, **kwargs):
		context = super().get_context_data(**kwargs)
		context['transacciones'] = self.object.transacciones.select_related('cuenta_destino')
		return context


class CuentaUpdateView(CuentaOwnerMixin, UpdateView):
	model = Cuenta
	form_class = CuentaForm
	template_name = 'gestion/cuenta_form.html'

	def get_success_url(self):
		return reverse('gestion:cuenta-detail', kwargs={'pk': self.object.pk})


class CuentaDeleteView(CuentaOwnerMixin, DeleteView):
	model = Cuenta
	template_name = 'gestion/cuenta_confirm_delete.html'
	success_url = reverse_lazy('gestion:cuenta-list')


class TransaccionCreateView(CuentaOwnerMixin, CreateView):
	model = Transaccion
	form_class = TransaccionForm
	template_name = 'gestion/transaccion_form.html'

	def get_cuenta(self):
		return self.get_queryset().get(pk=self.kwargs['pk'])

	def get_form_kwargs(self):
		kwargs = super().get_form_kwargs()
		kwargs['cuenta_origen'] = self.get_cuenta()
		return kwargs

	def form_valid(self, form):
		form.instance.cuenta = self.get_cuenta()
		response = super().form_valid(form)
		monto = form.instance.monto
		if form.instance.tipo == Transaccion.Tipo.DEPOSITO:
			form.instance.cuenta.saldo += monto
		elif form.instance.tipo == Transaccion.Tipo.RETIRO:
			form.instance.cuenta.saldo -= monto
		else:
			form.instance.cuenta.saldo -= monto
			if form.instance.cuenta_destino:
				form.instance.cuenta_destino.saldo += monto
				form.instance.cuenta_destino.save(update_fields=['saldo'])
		form.instance.cuenta.save(update_fields=['saldo'])
		return response

	def get_success_url(self):
		return reverse('gestion:cuenta-detail', kwargs={'pk': self.kwargs['pk']})

# Create your views here.
