# TACAM · Suite de 3 apps (frontend)

Ahora el sistema quedó separado en **3 aplicaciones** conectadas por `localStorage`:

1. **App Usuarios** (`usuarios-app.html`)
   - Crear pedidos
   - Revisar estado por teléfono

2. **App Repartidores** (`repartidores-app.html`)
   - Tomar pedidos
   - Cambiar estado: asignado → en camino → entregado

3. **App Recepción de Pedidos** (`recepcion-app.html`)
   - Ver todos los pedidos
   - Asignar repartidor

## Portal principal
- `index.html` actúa como portada para entrar a las 3 apps.

## Branding
- Se usan logos TACAM originales (`assets/logo-color.svg` y `assets/logo-white.svg`) en todas las vistas.
- Firma visible: **Desarrollo por Agencia Digital**.

## Ejecutar localmente
```bash
python3 -m http.server 4173
```
Abrir: `http://localhost:4173`


## Limpieza de estructura
- Se eliminó la app antigua monolítica para dejar únicamente las 3 apps de pedidos solicitadas.
