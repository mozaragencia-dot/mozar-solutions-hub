# TACAM Sistema Web (versión estática funcional)

Aplicación web funcional para gestión de clientes, agendamiento, visitas, estadísticas por abogada y control de usuarios.

## Credenciales iniciales
- Usuario: `admin`
- Clave: `admin`

## Módulos clave
- Login y sesión local.
- Ingreso y edición de fichas de cliente.
- Reagendamiento de reuniones.
- Perfil de abogada con estadísticas y listado de reuniones.
- Calendario de reservas para administradores (vista global por día).
- Integración con Google Calendar por enlace directo “Crear evento”.
- Usuarios y niveles de acceso (`Administrador`, `Operador`, `Consulta`).
- Respaldo y restauración de información por JSON (exportar/importar).

## Sobre Google Calendar
Esta versión estática abre enlaces para crear eventos en Google Calendar con los datos de la cita.
Para sincronización automática 100% bidireccional se requiere backend + OAuth de Google Workspace.

## ¿Cómo se guarda la información?
Actualmente se guarda en `localStorage` del navegador (mismo equipo/mismo navegador).
Para mitigar riesgo de pérdida:
- Usa **Exportar respaldo JSON** periódicamente.
- Puedes restaurar con **Importar respaldo**.

## Ejecutar localmente
```bash
python3 -m http.server 4173
```
Abrir: `http://localhost:4173`

## Subir a Hostinger básico
1. Subir archivos a `public_html`.
2. Mantener `.htaccess` en la raíz publicada.
3. Probar carga y navegación.
