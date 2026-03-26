const STORAGE_KEYS = {
  catalog: 'sushi_catalog_v1',
  order: 'sushi_order_v1'
};

const DEMO_CATALOG = {
  restaurant: 'Sushi Daruma',
  orderEmail: 'pedidos@sushidaruma.cl',
  products: [
    {
      id: 'uramaki-salmon-queso',
      name: 'Uramaki Salmón Queso (10)',
      category: 'Rolls',
      price: 6990,
      description: 'Salmón, queso crema y cebollín.',
      image: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=900&q=80'
    },
    {
      id: 'ebi-furai-roll',
      name: 'Ebi Furai Roll (10)',
      category: 'Rolls',
      price: 7590,
      description: 'Camarón furai, palta y salsa acevichada.',
      image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=80'
    },
    {
      id: 'nigiri-mix',
      name: 'Nigiri Mix (6)',
      category: 'Nigiri',
      price: 6400,
      description: 'Selección de salmón, atún y camarón.',
      image: 'https://images.unsplash.com/photo-1625938145312-59e95fb3384f?auto=format&fit=crop&w=900&q=80'
    },
    {
      id: 'gyoza-camaron',
      name: 'Gyoza Camarón (5)',
      category: 'Entradas',
      price: 4990,
      description: 'Gyozas al vapor con salsa ponzu.',
      image: 'https://images.unsplash.com/photo-1607301405390-d831c242f59b?auto=format&fit=crop&w=900&q=80'
    },
    {
      id: 'ramune-original',
      name: 'Ramune Original',
      category: 'Bebidas',
      price: 2590,
      description: 'Bebida japonesa sabor clásico.',
      image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80'
    }
  ]
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

function getCatalog() {
  return loadJson(STORAGE_KEYS.catalog, null);
}

function saveCatalog(catalog) {
  saveJson(STORAGE_KEYS.catalog, catalog);
}

function clearCatalog() {
  localStorage.removeItem(STORAGE_KEYS.catalog);
}

function getOrder() {
  return loadJson(STORAGE_KEYS.order, {});
}

function saveOrder(orderMap) {
  saveJson(STORAGE_KEYS.order, orderMap);
}

function clearOrder() {
  localStorage.removeItem(STORAGE_KEYS.order);
}

function currencyCLP(value) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function normalizeCatalog(raw) {
  const products = Array.isArray(raw?.products) ? raw.products : [];
  return {
    restaurant: String(raw?.restaurant || 'Sushi Daruma').trim(),
    orderEmail: String(raw?.orderEmail || 'pedidos@sushidaruma.cl').trim(),
    products: products
      .map((item, index) => ({
        id: String(item.id || `${item.name || 'producto'}-${index}`).trim().toLowerCase().replace(/\s+/g, '-'),
        name: String(item.name || '').trim(),
        category: String(item.category || 'Otros').trim(),
        price: Number(item.price || 0),
        description: String(item.description || '').trim(),
        image: String(item.image || '').trim()
      }))
      .filter(item => item.name)
  };
}
