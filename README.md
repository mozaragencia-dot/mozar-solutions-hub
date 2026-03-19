# TACAM · Sistema de Reserva de Personas (Oficina de Abogados)

Aplicación web unificada para gestionar reservas de atención jurídica.

## Funcionalidades
- Acceso de administradores con usuarios demo `admin/admin` y `admin2/admin2`.
- Registro de reserva con: nombre, teléfono, fecha, hora, tipo de gestión, abogado asignado, motivo y configuración de recordatorio.
- Gestión de reservas: confirmar, cancelar, reasignar abogado y notificar por WhatsApp.
- Agenda por abogado: filtro por profesional, visualización del tipo de gestión y opción para marcar cita como atendida.
- Panel de recordatorios y tareas internas para seguimiento operativo.
- Automatización para `Visita cartel`: al crear una reserva de ese tipo se genera una tarea interna `Agendar visita cartel`.
- Perfiles de abogados con foto, especialidad y WhatsApp.
- Persistencia local en navegador (`localStorage`) y soporte PWA.

## WhatsApp de notificación
- Número de referencia TACAM: **+56987591312**.
- Mensaje base: "Desde TACAM, informamos toda la información de su reserva..."

## Ejecutar localmente
```bash
python3 -m http.server 4173
```
Abrir: `http://localhost:4173`
