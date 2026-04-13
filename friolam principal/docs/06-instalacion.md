# 6) Instalación rápida

## Backend (Laravel)
1. `cd "friolam principal/backend"`
2. `cp .env.example .env`
3. Configurar DB MySQL/MariaDB en `.env`
4. `composer install`
5. `php artisan key:generate`
6. `php artisan migrate --seed`
7. `php artisan serve`

## App PWA (React)
1. `cd "friolam principal/mobile-pwa"`
2. `npm install`
3. Crear `.env` con `VITE_API_URL=http://127.0.0.1:8000/api`
4. `npm run dev`
5. `npm run build` para validar PWA

## Validación E2E del flujo prioritario
1. Admin crea servicio y asigna técnico.
2. Técnico inicia sesión y visualiza tarea.
3. Técnico completa formulario + postmix + estado.
4. Admin revisa servicio actualizado en backend.
5. Admin abre `Services/view/{id}` y genera PDF.
