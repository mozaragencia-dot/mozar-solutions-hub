# Sushi Daruma · Menú Digital + Pre-pedido por correo

Aplicación web estática para restaurantes de sushi que permite:

- Mostrar productos con foto y categorías.
- Marcar productos en una lista de pedido (carrito básico).
- Cargar un catálogo desde archivo JSON o CSV (incluye export de WooCommerce).
- Generar un correo listo para enviar con detalle del pedido y bloque HTML con estilo de marca.
- Guardar catálogo y selección en `localStorage`.
- Mostrar notificación de confirmación con botón **Aceptar** cuando se guarda información.
- Administrador separado para inventario interno (usuario `admin`, clave `admin`).
- Funcionar como PWA básica (cache offline de archivos estáticos).

## Uso rápido

1. Abrir `index.html` en un servidor local.
2. Cargar un JSON/CSV con productos (o usar menú demo).
3. Seleccionar productos con los botones `+` y `−`.
4. Completar datos del cliente.
5. Presionar **Generar correo de pedido**.

## Administrador de inventario

- Botón **Administrador** en la cabecera.
- Credenciales por defecto:
  - Usuario: `admin`
  - Clave: `admin`
- Permite:
  - Ajustar stock por producto.
  - Eliminar productos.
  - Crear productos nuevos.

## Formato de catálogo JSON

```json
{
  "restaurant": "Sushi Daruma",
  "orderEmail": "pedidos@turestaurant.cl",
  "products": [
    {
      "id": "nigiri-salmon",
      "name": "Nigiri Salmón (2)",
      "category": "Nigiri",
      "price": 3900,
      "description": "Arroz sazonado y salmón fresco.",
      "image": "https://.../foto.jpg"
    }
  ]
}
```

## CSV de WooCommerce

También puedes subir directamente un CSV exportado desde WooCommerce (`Products > Export`), usando columnas típicas como:

- `Name`
- `Categories`
- `Regular price` (o `Sale price` / `Price`)
- `Images`
- `Short description` (opcional)

## Nota sobre el módulo de compra

Esta primera versión deja listo el flujo de selección y pre-pedido por correo.
El siguiente paso puede ser integrar pasarela de pago y envío automático de email transaccional (por ejemplo con Brevo, Resend o SendGrid).

## Ejecutar localmente

```bash
python3 -m http.server 4173
```

Abrir: `http://localhost:4173`.
