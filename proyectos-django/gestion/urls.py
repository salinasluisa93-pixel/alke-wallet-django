from django.urls import path

from . import views

app_name = 'gestion'

urlpatterns = [
    path('', views.DashboardView.as_view(), name='dashboard'),
    path('cuentas/', views.CuentaListView.as_view(), name='cuenta-list'),
    path('cuentas/nueva/', views.CuentaCreateView.as_view(), name='cuenta-create'),
    path('cuentas/<int:pk>/', views.CuentaDetailView.as_view(), name='cuenta-detail'),
    path('cuentas/<int:pk>/editar/', views.CuentaUpdateView.as_view(), name='cuenta-update'),
    path('cuentas/<int:pk>/eliminar/', views.CuentaDeleteView.as_view(), name='cuenta-delete'),
    path('cuentas/<int:pk>/transacciones/nueva/', views.TransaccionCreateView.as_view(), name='transaccion-create'),
]
