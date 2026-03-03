const DELIVERY_KEYS = {
  orders: 'tacam_delivery_orders',
  couriers: 'tacam_delivery_couriers'
};

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function seedDeliveryData() {
  const orders = loadJson(DELIVERY_KEYS.orders, []);
  if (orders.length) return;
  const initial = [
    {
      id: crypto.randomUUID(),
      customer: 'Cliente Demo',
      phone: '+56911111111',
      address: 'Jorge Washington 2675, Antofagasta',
      notes: 'Llamar antes de llegar',
      assignedTo: '',
      status: 'nuevo',
      createdAt: new Date().toISOString()
    }
  ];
  saveJson(DELIVERY_KEYS.orders, initial);
}

function getOrders() {
  return loadJson(DELIVERY_KEYS.orders, []);
}

function saveOrders(orders) {
  saveJson(DELIVERY_KEYS.orders, orders);
}

function statusLabel(status) {
  return ({
    nuevo: 'Nuevo',
    asignado: 'Asignado',
    en_camino: 'En camino',
    entregado: 'Entregado'
  })[status] || status;
}

function fmtDate(iso) {
  return new Date(iso).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
}

seedDeliveryData();
