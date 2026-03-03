# TACAM Sistema Web

Aplicación TACAM con dos modos:
1. **Frontend estático (PWA)**
2. **API backend** para centralizar usuarios/clientes/citas

## Credenciales iniciales
- Usuario: `admin`
- Clave: `admin`

## Lo que incluye
- Login, roles, gestión de clientes, citas, visitas, perfil abogada, calendario admin.
- Recordatorios por WhatsApp/correo con membrete.
- Modo luz/nocturno.
- PWA (`manifest.webmanifest` + `sw.js`).
- Exportar/importar respaldo JSON en frontend.

## Backend API unificado
`backend/server.js` maneja autenticación, datos y notificaciones.

### Endpoints principales
- `POST /api/auth/login`
- `GET/POST/PATCH /api/users`
- `GET/POST/PUT /api/clients`
- `GET/POST/PUT /api/appointments`
- `GET /api/notifications/appointment/:id` (payload con WhatsApp + correo y enlaces)
- `POST /api/notifications/appointment/:id` (envío por canal, actualmente WhatsApp Cloud)
- `GET /api/public/visits/respond?...` (confirmar/rechazar visita desde enlace)

## Confirmar/rechazar visita por enlace
La API genera en el correo dos links firmados:
- Confirmar
- Rechazar

Al abrirlos, se actualiza el estado de la cita en backend (`Confirmada por cliente` / `Rechazada por cliente`).

## API de WhatsApp: ¿cómo entregarla?
Para habilitar envío real por Meta WhatsApp Cloud API, entrega estas variables en el servidor:

- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- (opcional) `WHATSAPP_VERSION` (default: `v21.0`)

También configurar:
- `APP_BASE_URL` (URL pública de tu API; ejemplo `https://api.tudominio.cl`)
- `API_SECRET` (firma de tokens/enlaces)

Sin estas variables, el endpoint de envío responde error controlado indicando configuración faltante.

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
Incluye pruebas de login, creación de cliente/cita y confirmación de visita por enlace.

## Un solo código Web + Android + iOS
La app sigue preparada como PWA. Para tiendas, empaqueta con Capacitor:
```bash
npm init @capacitor/app
npx cap add android
npx cap add ios
```
