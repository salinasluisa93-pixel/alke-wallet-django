from django import forms

from .models import Cuenta, Transaccion


class CuentaForm(forms.ModelForm):
    class Meta:
        model = Cuenta
        fields = ('tipo',)
        widgets = {'tipo': forms.Select(attrs={'class': 'input'})}


class TransaccionForm(forms.ModelForm):
    class Meta:
        model = Transaccion
        fields = ('tipo', 'cuenta_destino', 'monto', 'descripcion')
        widgets = {
            'tipo': forms.Select(attrs={'class': 'input'}),
            'cuenta_destino': forms.Select(attrs={'class': 'input'}),
            'monto': forms.NumberInput(attrs={'class': 'input', 'step': '0.01', 'min': '0.01'}),
            'descripcion': forms.TextInput(attrs={'class': 'input', 'placeholder': 'Ej. Pago de servicios'}),
        }

    def __init__(self, *args, cuenta_origen, **kwargs):
        super().__init__(*args, **kwargs)
        self.cuenta_origen = cuenta_origen
        self.fields['cuenta_destino'].queryset = Cuenta.objects.filter(cliente=cuenta_origen.cliente, activa=True).exclude(pk=cuenta_origen.pk)
        self.fields['cuenta_destino'].required = False

    def clean(self):
        cleaned_data = super().clean()
        tipo = cleaned_data.get('tipo')
        cuenta_destino = cleaned_data.get('cuenta_destino')
        monto = cleaned_data.get('monto')
        if tipo == Transaccion.Tipo.TRANSFERENCIA and not cuenta_destino:
            self.add_error('cuenta_destino', 'Selecciona una cuenta de destino.')
        if tipo == Transaccion.Tipo.RETIRO and monto and monto > self.cuenta_origen.saldo:
            self.add_error('monto', 'El monto supera el saldo disponible.')
        return cleaned_data
