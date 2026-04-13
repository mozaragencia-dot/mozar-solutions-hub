# 3) Endpoints API (MVP)

## Auth
- `POST /api/auth/login`

## Técnico
- `GET /api/technician/services`
- `GET /api/technician/services/{id}`
- `PUT /api/technician/services/{id}/form`
- `POST /api/technician/services/{id}/photos`
- `POST /api/technician/services/{id}/signatures`
- `POST /api/technician/services/change-status` body: `{ id_service, status, comment? }`

## Admin
- `GET /admin/services` (filtros: status, client_id, technician_id, date_from/date_to)
- `GET /admin/services/view/{id}`
- `GET /Services/view/{id}` (HTML para PDF)
- `GET /admin/services/{id}/pdf`
- `POST /admin/services`
- `PUT /admin/services/{id}`
- `POST /admin/services/{id}/assign`

## Catálogos
- `GET/POST /api/clients`
- `GET/POST /api/subclients`
- `GET /api/subclients?client_id={id}`
- `GET/POST /api/technicians`
