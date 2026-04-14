# 2) Modelo de base de datos

## Entidades principales
- `users` (roles: admin, technician, supervisor)
- `clients`
- `subclients`
- `services` (tabla central)
- `service_machines`
- `service_maintenance_forms`
- `service_postmix_forms`
- `service_photos`
- `service_signatures`
- `service_status_logs`

## Estados del servicio
- `0`: nuevo
- `1`: asignado
- `2`: en proceso
- `3`: pendiente de validación
- `4`: terminado parcial
- `5`: terminado final

## Reglas clave
- `services.technician_id` referencia `users.id` con rol técnico.
- `service_postmix_forms` 1:1 con `services` (si aplica).
- `service_machines` 1:N con `services`.
- Auditoría mínima en `service_status_logs` con usuario, estado anterior/nuevo, timestamp.

## Índices recomendados
- `services(status, scheduled_date)`
- `services(technician_id, status)`
- `services(client_id, subclient_id)`
- `service_status_logs(service_id, created_at)`
