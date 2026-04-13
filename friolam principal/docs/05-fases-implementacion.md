# 5) Implementación por fases

## Fase 1 — Núcleo operacional
- Autenticación y roles (admin/supervisor/técnico).
- CRUD clientes/subclientes.
- Crear servicio + asignar técnico.
- Listado admin con filtros por estado/técnico/cliente/fecha.

## Fase 2 — Ejecución técnica en terreno
- App PWA técnico (listado + detalle + formulario).
- Persistencia mantención y postmix completo.
- Máquinas por servicio.
- Evidencias (fotos y firma).
- Cambio de estado por endpoint con body (`id_service`, `status`).

## Fase 3 — Cierre y control
- Vista PDF profesional de hoja de servicio.
- Reportes y exportación (PDF/Excel).
- Auditoría básica de cambios + logs de errores.
- Mejoras UX responsive y rendimiento.

## Fase 4 — Escalamiento opcional
- Cola para generación masiva de PDF/reportes.
- Offline write queue en app móvil.
- Integración WhatsApp/email de cierre automático.
