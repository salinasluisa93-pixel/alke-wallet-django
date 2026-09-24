# Alke Wallet

Billetera digital educativa construida con Django, SQLite para desarrollo y PostgreSQL para producción.

## Puesta en marcha

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Visita `http://127.0.0.1:8000/`. El panel requiere iniciar sesión. La administración está disponible en `/admin/`.

## Funcionalidades

- Modelos `Cliente`, `Cuenta`, `Transaccion` y `Beneficiario` con relaciones uno a uno, muchos a uno y muchos a muchos.
- CRUD de cuentas con vistas basadas en clases y formularios protegidos por CSRF.
- Registro de depósitos, retiros y transferencias con actualización de saldos.
- Consultas ORM con `filter`, `select_related`, `aggregate`, `annotate` y `Count`.
- PostgreSQL activable mediante `DATABASE_URL`; SQLite es el valor por defecto.
- Admin, autenticación, archivos estáticos y pruebas automatizadas.

## Comandos útiles

```powershell
python manage.py makemigrations
python manage.py migrate
python manage.py test
python manage.py check
```
