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
- Usuarios y niveles de acceso (`Administrador`, `Operador`, `Consulta`) con **foto de perfil** por usuario.
- Avisos de reuniones por **WhatsApp** (enlace directo) y correo con **membrete TACAM**.
- Vista previa del formato de WhatsApp/correo antes de agendar.
- Botones de **modo luz / modo nocturno** para mejor visualización.
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


## Un solo código para Web + Android + iOS
Esta base ya quedó preparada como **PWA** (`manifest.webmanifest` + `sw.js`), lo que permite usar el mismo código para publicar en web y empaquetar móvil.

### Ruta recomendada para App Store y Google Play
1. Mantener esta web app como código único.
2. Empaquetar con **Capacitor**:
```bash
npm init @capacitor/app
npx cap add android
npx cap add ios
```
3. Apuntar Capacitor al mismo `index.html` y assets estáticos.
4. Compilar/publicar desde Android Studio y Xcode.

> Nota: para publicar en tiendas se requieren cuentas de desarrollador y revisión de políticas de Apple/Google.
