from django.contrib import admin
from .models import Beneficiario, Cliente, Cuenta, Transaccion


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
	list_display = ('usuario', 'documento', 'telefono', 'creado_en')
	search_fields = ('usuario__username', 'usuario__first_name', 'usuario__last_name', 'documento')


@admin.register(Cuenta)
class CuentaAdmin(admin.ModelAdmin):
	list_display = ('numero', 'cliente', 'tipo', 'saldo', 'activa')
	list_filter = ('tipo', 'activa')
	search_fields = ('numero', 'cliente__usuario__username')


@admin.register(Transaccion)
class TransaccionAdmin(admin.ModelAdmin):
	list_display = ('cuenta', 'tipo', 'monto', 'creada_en')
	list_filter = ('tipo', 'creada_en')
	date_hierarchy = 'creada_en'


admin.site.register(Beneficiario)
