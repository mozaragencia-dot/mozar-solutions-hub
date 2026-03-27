# FRIOLAM · Sistema de Reserva de Personas (Oficina de Abogados)

Aplicación web unificada para gestionar reservas de atención jurídica.

## Funcionalidades
- Registro de reserva con: nombre, teléfono, fecha, hora, abogado asignado y motivo de consulta.
- Gestión de reservas: confirmar, cancelar, reasignar abogado y notificar por WhatsApp.
- Agenda por abogado: filtro por profesional y opción para marcar cita como atendida.
- Perfiles de abogados con foto, especialidad y WhatsApp.
- Persistencia local en navegador (`localStorage`) y soporte PWA.

## WhatsApp de notificación
- Número de referencia FRIOLAM: **+56987591312**.
- Mensaje base: "Desde FRIOLAM, informamos toda la información de su reserva..."

## Dominio de producción
- Subdominio objetivo: `www.apolo.friolam.cl`.
- Recomendación: servir esta carpeta desde ese host y mantener el endpoint `brevo-email.php` en el mismo dominio para evitar CORS.

## Brevo (correo transaccional)
La app puede enviar correos mediante `brevo-email.php`, manteniendo la API key fuera del navegador.

### Variables necesarias en el servidor
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `BREVO_REPLY_TO_EMAIL` (opcional)
- `BREVO_REPLY_TO_NAME` (opcional)

### Cómo probar localmente con PHP
```bash
BREVO_API_KEY=tu_api_key \
BREVO_SENDER_EMAIL=friolam@agenciayousay.cl \
BREVO_SENDER_NAME="friolam" \
php -S 127.0.0.1:4173
```

Luego abre `http://127.0.0.1:4173` (en producción usar `https://www.apolo.friolam.cl`).

> Importante: el remitente configurado en Brevo debe estar verificado en tu cuenta.

## Instalar en servidor (Dashboard)

### Opción A: instalación desde panel (Dashboard de hosting)
1. Ejecuta el empaquetado local:
   ```bash
   ./package.sh
   ```
   Esto genera `dist/friolam-static-app.zip`.
2. Entra al Dashboard de tu hosting (cPanel/Plesk/Panel del proveedor).
3. Abre **Administrador de archivos** del dominio `www.apolo.friolam.cl`.
4. Sube el ZIP y descomprímelo en la carpeta pública del dominio (ejemplo: `public_html/` o `httpdocs/`).
5. Verifica que `index.html` y `brevo-email.php` queden en la raíz pública.
6. Configura variables de entorno en el panel del hosting (o en el vhost):
   - `BREVO_API_KEY`
   - `BREVO_SENDER_EMAIL`
   - `BREVO_SENDER_NAME`
   - `BREVO_REPLY_TO_EMAIL` (opcional)
   - `BREVO_REPLY_TO_NAME` (opcional)
7. Si tu panel tiene caché/CDN, purga caché para reflejar cambios.
8. Prueba en navegador:
   - Cargar `https://www.apolo.friolam.cl`
   - Crear una reserva con consentimiento
   - Validar apertura de WhatsApp y envío de correo vía `brevo-email.php`

### Opción B: instalación por terminal (SSH)
```bash
# 1) Subir código al servidor (ejemplo)
scp -r . usuario@tu-servidor:/var/www/friolam

# 2) En servidor, definir variables de entorno (ejemplo Bash)
export BREVO_API_KEY="..."
export BREVO_SENDER_EMAIL="friolam@agenciayousay.cl"
export BREVO_SENDER_NAME="FRIOLAM"

# 3) Levantar en Apache/Nginx apuntando DocumentRoot a /var/www/friolam
```

## Generar las aplicaciones

### 1) Generar paquete para distribución web
```bash
./package.sh
```
Salida: `dist/friolam-static-app.zip`.

### 2) Generar “app instalable” (PWA)
La plataforma ya está preparada como PWA con `manifest.webmanifest`, `sw.js` y `register-sw.js`.

- **Android (Chrome):** abrir `https://www.apolo.friolam.cl` → menú ⋮ → **Instalar aplicación**.
- **iPhone/iPad (Safari):** abrir URL → **Compartir** → **Agregar a pantalla de inicio**.
- **Desktop (Chrome/Edge):** abrir URL → ícono de instalación en barra de direcciones.

### 3) (Opcional) Empaquetar como APK/AAB o app store
Si quieres app de tienda (Play Store/App Store), usa un wrapper (Capacitor/Cordova o Trusted Web Activity) apuntando a la misma URL productiva.

## Ejecutar localmente (modo estático, sin Brevo)
```bash
python3 -m http.server 4173
```
Abrir: `http://localhost:4173`
