# TACAM Sistema Web (versión sin API, todo en frontend)

Aplicación TACAM funcionando 100% en frontend/PWA con almacenamiento local (`localStorage`).

## Credenciales iniciales
- Usuario: `admin`
- Clave: `admin`

## Funcionalidades
- Portada de sistema con logo TACAM.
- Login con roles (`admin`, `operador`, `consulta`).
- Recupera tu contraseña desde portada (prepara correo con membrete TACAM).
- Gestión de clientes y citas.
- Botones de mensajería por cita:
  - **Bienvenida**
  - **Asentamiento** (incluye enlace Google Maps)
- Los mensajes se preparan para:
  - cliente (WhatsApp + correo)
  - abogada asignada (WhatsApp + correo)
- Perfil de abogadas, calendario admin, exportar/importar respaldo JSON.
- Modo luz / nocturno y soporte PWA.

## Notas de envío de mensajes
El sistema abre enlaces de WhatsApp (`wa.me`) y correo (`mailto`) con texto ya armado y membrete.
Esto evita depender de un backend/API externa.

## Ejecutar localmente
```bash
python3 -m http.server 4173
```
Abrir: `http://localhost:4173`

## Subir por FTP (Hostinger básico)
Sube a `public_html`:
- `index.html`
- `app.js`
- `styles.css`
- `.htaccess`
- `manifest.webmanifest`
- `sw.js`
- carpeta `assets/`

No necesitas carpeta `backend` ni `tests`.
