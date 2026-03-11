const DELIVERY_KEYS = {
  orders: 'tacam_delivery_orders',
  couriers: 'tacam_delivery_couriers',
  lawyers: 'tacam_delivery_lawyers'
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
  if (!orders.length) {
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

  const lawyers = loadJson(DELIVERY_KEYS.lawyers, []);
  if (!lawyers.length) {
    saveJson(DELIVERY_KEYS.lawyers, [
      {
        id: crypto.randomUUID(),
        name: 'Abogado TACAM',
        specialty: 'Atención General',
        phone: '+56987591312',
        photo: 'assets/logo-color.svg'
      }
    ]);
  }
}

function getOrders() {
  return loadJson(DELIVERY_KEYS.orders, []);
}

function saveOrders(orders) {
  saveJson(DELIVERY_KEYS.orders, orders);
}

function getLawyers() {
  return loadJson(DELIVERY_KEYS.lawyers, []);
}

function saveLawyers(lawyers) {
  saveJson(DELIVERY_KEYS.lawyers, lawyers);
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

function cleanPhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function buildTacamMessage(order) {
  return `Desde TACAM, informamos toda la información de su pedido. Cliente: ${order.customer}. Dirección: ${order.address}. Estado actual: ${statusLabel(order.status)}.`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

seedDeliveryData();
