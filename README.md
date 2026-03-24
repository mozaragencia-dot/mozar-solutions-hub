# TACAM · Sistema de Reserva de Personas (Oficina de Abogados)

Aplicación web unificada para gestionar reservas de atención jurídica.

## Funcionalidades
- Registro de reserva con: nombre, teléfono, fecha, hora, abogado asignado y motivo de consulta.
- Gestión de reservas: confirmar, cancelar, reasignar abogado y notificar por WhatsApp.
- Agenda por abogado: filtro por profesional y opción para marcar cita como atendida.
- Perfiles de abogados con foto, especialidad y WhatsApp.
- Persistencia local en navegador (`localStorage`) y soporte PWA.

## WhatsApp de notificación
- Número de referencia TACAM: **+56987591312**.
- Mensaje base: "Desde TACAM, informamos toda la información de su reserva..."


## Brevo (correo transaccional)
La app ahora puede enviar correos mediante `brevo-email.php`, manteniendo la API key fuera del navegador.

### Variables necesarias en el servidor
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `BREVO_REPLY_TO_EMAIL` (opcional)
- `BREVO_REPLY_TO_NAME` (opcional)

### Cómo probar localmente con PHP
```bash
BREVO_API_KEY=tu_api_key \
BREVO_SENDER_EMAIL=no-reply@tudominio.cl \
BREVO_SENDER_NAME="TACAM" \
php -S 127.0.0.1:4173
```

Luego abre `http://127.0.0.1:4173`.

> Importante: el remitente configurado en Brevo debe estar verificado en tu cuenta.

## Empaquetar para envío
```bash
./package.sh
```
El paquete queda en `dist/tacam-static-app.zip`.

## Ejecutar localmente (modo estático, sin Brevo)
```bash
python3 -m http.server 4173
```
Abrir: `http://localhost:4173`
