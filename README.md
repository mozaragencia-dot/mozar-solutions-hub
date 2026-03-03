# TACAM Sistema Web

Aplicación TACAM con dos modos:
1. **Frontend estático (PWA)**
2. **API backend opcional** para cubrir lo faltante de producción (usuarios/clientes/citas centralizados)

## Credenciales iniciales
- Usuario: `admin`
- Clave: `admin`

## Lo que ya incluye
- Login, roles, gestión de clientes, citas, visitas, perfil abogada, calendario admin.
- Recordatorios por WhatsApp/correo con membrete.
- Modo luz/nocturno.
- PWA (`manifest.webmanifest` + `sw.js`).
- Exportar/importar respaldo JSON en frontend.

## Nuevo: Backend API (cubre faltantes clave)
Se agregó `backend/server.js` con almacenamiento central en `backend/db.json`.

### Endpoints principales
- `POST /api/auth/login`
- `GET/POST/PATCH /api/users`
- `GET/POST/PUT /api/clients`
- `GET/POST/PUT /api/appointments`
- `GET /api/notifications/appointment/:id`

Con esto ya tienes una base real para dejar de depender solo de `localStorage`.

## Ejecutar frontend estático
```bash
python3 -m http.server 4173
```
Abrir `http://localhost:4173`.

## Ejecutar backend API
```bash
npm run start:api
```
API en `http://localhost:8787`.

## Testing
```bash
npm test
```
Incluye pruebas de login, creación de cliente/cita y plantillas de notificación.

## Un solo código Web + Android + iOS
La app sigue preparada como PWA. Para tiendas, empaqueta con Capacitor:
```bash
npm init @capacitor/app
npx cap add android
npx cap add ios
```
