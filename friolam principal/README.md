# FRIOLAM Principal

Base profesional para una webapp/PWA de gestión técnica en terreno para FRIOLAM.

## Nombre principal de la app en esta rama
El núcleo principal de esta rama queda identificado como **`appfriolam`**.

## Estructura
- `appfriolam/backend/`: panel admin, API REST, lógica de negocio, PDF y reportes.
- `appfriolam/mobile-pwa/`: app PWA para técnicos (celular/tablet).
- `appfriolam/docs/`: arquitectura, base de datos, endpoints, flujo y plan por fases.

## Stack propuesto
- **Backend Admin + API:** Laravel 11 (PHP 8.3), Sanctum, MySQL/MariaDB.
- **App técnico PWA:** React + Vite + TypeScript + Workbox.
- **PDF:** barryvdh/laravel-dompdf (plantilla HTML de hoja de servicio).
- **Archivos:** almacenamiento en disco/S3 para fotos y firmas.

## Flujo principal cubierto
1. Admin crea servicio.
2. Admin asigna técnico.
3. Técnico visualiza servicios asignados.
4. Técnico completa formulario (mantención/postmix/máquinas/fotos/firmas).
5. Técnico cambia estado.
6. Admin visualiza cambios por estado.
7. Admin genera/descarga PDF consolidado.

## Nota de compatibilidad
Se diseñó para integrar sin romper estructuras existentes (por ejemplo vistas tipo `admin/services/index.blade.php` y `admin/services/view.blade.php`) manteniendo rutas y responsabilidades separadas.
