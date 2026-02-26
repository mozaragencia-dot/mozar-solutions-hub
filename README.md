# TACAM Sistema Web (versión estática funcional)

Aplicación web funcional para gestión de clientes, agendamiento y control de visitas.

## Funcionalidades
- Ingreso de clientes con validación de RUT chileno.
- Clasificación automática entre **Contrató** y **No Contrató**.
- Gestión de lista de no contratados con acción para actualizar estado.
- Agendamiento de citas para clientes contratados.
- Vista de visitas y ranking simple por abogada.
- Persistencia local en el navegador mediante `localStorage`.

## Ejecutar localmente
Como no requiere build, basta con un servidor estático:

```bash
python3 -m http.server 4173
```

Luego abrir `http://localhost:4173`.

## Subir a Hostinger básico
1. Comprimir/subir estos archivos a `public_html`.
2. Verificar que `.htaccess` esté en la raíz publicada.
3. Abrir dominio y probar recarga en rutas internas.

> Nota: La base de datos actual es local del navegador (`localStorage`).
