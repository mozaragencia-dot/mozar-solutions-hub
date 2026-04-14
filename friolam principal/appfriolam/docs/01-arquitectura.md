# 1) Arquitectura del sistema

> Esta implementación vive bajo el contenedor principal `appfriolam` en esta rama.

## Visión de alto nivel
- **Admin Web (Laravel Blade):** gestión operativa, filtros, asignación, reportes, PDF.
- **API REST (Laravel):** autenticación, servicios asignados, actualización técnica en terreno.
- **PWA técnico (React):** UI móvil rápida, offline cache de lectura, envío online.
- **DB MySQL/MariaDB:** núcleo transaccional de clientes/subclientes/servicios.
- **Storage:** evidencia fotográfica, firmas, archivos PDF generados.

## Capas backend
1. **Presentación**: Controllers Admin/API + Requests de validación.
2. **Aplicación**: Services (ServiceLifecycleService, PdfService, AssignmentService).
3. **Dominio**: Models + Policies + Enums de estados.
4. **Infraestructura**: Eloquent, Storage, colas, logging.

## Principios
- Modular por contexto: `clientes`, `subclientes`, `servicios`, `postmix`, `reportes`.
- Regla crítica: técnico sólo edita `telefono_cliente` y `nombre_fantasia`.
- Estado por transición controlada (`0..5`) con trazabilidad.
- Endpoints móviles sin dependencia de id en URL para cambio de estado.
