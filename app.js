const fileInput = document.getElementById('catalog-file');
const loadDemoBtn = document.getElementById('load-demo');
const clearDataBtn = document.getElementById('clear-data');
const statusLabel = document.getElementById('catalog-status');
const menuGrid = document.getElementById('menu-grid');
const categoryFilters = document.getElementById('category-filters');
const menuSearch = document.getElementById('menu-search');
const orderList = document.getElementById('order-list');
const orderTotal = document.getElementById('order-total');
const orderForm = document.getElementById('order-form');
const mailNote = document.getElementById('mail-note');

let activeCategory = 'Todos';
let currentCatalog = getCatalog() || normalizeCatalog(DEMO_CATALOG);
let currentOrder = getOrder();

function updateStatus(message) {
  statusLabel.textContent = message;
}

function persistState() {
  saveCatalog(currentCatalog);
  saveOrder(currentOrder);
}

function getFilteredProducts() {
  const term = menuSearch.value.trim().toLowerCase();
  return currentCatalog.products.filter(item => {
    const categoryOk = activeCategory === 'Todos' || item.category === activeCategory;
    const text = `${item.name} ${item.description} ${item.category}`.toLowerCase();
    const termOk = !term || text.includes(term);
    return categoryOk && termOk;
  });
}

function renderCategories() {
  const categories = ['Todos', ...new Set(currentCatalog.products.map(item => item.category))];
  categoryFilters.innerHTML = '';

  categories.forEach(category => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = category === activeCategory ? 'chip active' : 'chip';
    button.textContent = category;
    button.addEventListener('click', () => {
      activeCategory = category;
      renderMenu();
      renderCategories();
    });
    categoryFilters.appendChild(button);
  });
}

function changeQty(productId, delta) {
  const current = Number(currentOrder[productId] || 0);
  const next = Math.max(0, current + delta);
  if (next === 0) {
    delete currentOrder[productId];
  } else {
    currentOrder[productId] = next;
  }
  persistState();
  renderOrder();
  renderMenu();
}

function renderMenu() {
  const products = getFilteredProducts();
  menuGrid.innerHTML = '';

  if (!products.length) {
    menuGrid.innerHTML = '<p class="muted">No hay productos para este filtro.</p>';
    return;
  }

  products.forEach(item => {
    const qty = Number(currentOrder[item.id] || 0);
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${item.image || 'assets/logo-color.svg'}" alt="${item.name}" loading="lazy" />
      <div class="product-body">
        <small>${item.category}</small>
        <h3>${item.name}</h3>
        <p>${item.description || 'Sin descripción.'}</p>
        <div class="product-footer">
          <strong>${currencyCLP(item.price)}</strong>
          <div class="qty-control">
            <button type="button" data-delta="-1" data-id="${item.id}">−</button>
            <span>${qty}</span>
            <button type="button" data-delta="1" data-id="${item.id}">+</button>
          </div>
        </div>
      </div>
    `;
    menuGrid.appendChild(card);
  });

  menuGrid.querySelectorAll('.qty-control button').forEach(button => {
    button.addEventListener('click', () => {
      changeQty(button.dataset.id, Number(button.dataset.delta));
    });
  });
}

function getOrderLines() {
  return Object.entries(currentOrder)
    .map(([id, qty]) => {
      const product = currentCatalog.products.find(item => item.id === id);
      if (!product) return null;
      const lineTotal = product.price * qty;
      return { ...product, qty, lineTotal };
    })
    .filter(Boolean);
}

function renderOrder() {
  const lines = getOrderLines();
  orderList.innerHTML = '';

  if (!lines.length) {
    orderList.innerHTML = '<li class="muted">Aún no agregas productos.</li>';
    orderTotal.textContent = currencyCLP(0);
    return;
  }

  let total = 0;
  lines.forEach(line => {
    total += line.lineTotal;
    const li = document.createElement('li');
    li.innerHTML = `<span>${line.qty} × ${line.name}</span><strong>${currencyCLP(line.lineTotal)}</strong>`;
    orderList.appendChild(li);
  });

  orderTotal.textContent = currencyCLP(total);
}

function buildOrderEmailHtml(customer, lines, total) {
  const itemsHtml = lines
    .map(line => `<tr>
      <td style="padding:8px;border-bottom:1px solid #ffd5d5;">${line.qty} x ${line.name}</td>
      <td style="padding:8px;border-bottom:1px solid #ffd5d5;text-align:right;">${currencyCLP(line.lineTotal)}</td>
    </tr>`)
    .join('');

  return `
    <div style="font-family:Arial,sans-serif;background:#fff7f7;padding:16px;color:#3a1616;">
      <h2 style="margin:0 0 8px;color:#d81818;">${currentCatalog.restaurant}</h2>
      <p style="margin:0 0 12px;">Nuevo pedido web recibido.</p>
      <p><strong>Cliente:</strong> ${customer.customerName}<br/>
      <strong>Correo:</strong> ${customer.customerEmail}<br/>
      <strong>Teléfono:</strong> ${customer.customerPhone || '-'}<br/>
      <strong>Notas:</strong> ${customer.notes || 'Sin notas'}</p>
      <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #ffd5d5;border-radius:8px;overflow:hidden;">
        ${itemsHtml}
        <tr>
          <td style="padding:10px;font-weight:700;">Total</td>
          <td style="padding:10px;font-weight:700;text-align:right;">${currencyCLP(total)}</td>
        </tr>
      </table>
    </div>
  `.trim();
}

function handleOrderSubmit(event) {
  event.preventDefault();
  const lines = getOrderLines();

  if (!lines.length) {
    mailNote.textContent = 'Debes agregar al menos 1 producto antes de generar el correo.';
    return;
  }

  const formData = new FormData(orderForm);
  const customer = Object.fromEntries(formData.entries());
  const total = lines.reduce((acc, line) => acc + line.lineTotal, 0);
  const subject = encodeURIComponent(`Pedido Web - ${currentCatalog.restaurant} - ${customer.customerName}`);
  const plainLines = lines.map(line => `${line.qty} x ${line.name} = ${currencyCLP(line.lineTotal)}`).join('\n');
  const htmlBody = buildOrderEmailHtml(customer, lines, total);
  const textBody = [
    `Cliente: ${customer.customerName}`,
    `Correo: ${customer.customerEmail}`,
    `Teléfono: ${customer.customerPhone || '-'}`,
    '',
    'Detalle:',
    plainLines,
    '',
    `Total: ${currencyCLP(total)}`,
    '',
    `HTML sugerido para plantilla de marca:\n${htmlBody}`
  ].join('\n');

  const mailto = `mailto:${encodeURIComponent(currentCatalog.orderEmail)}?subject=${subject}&body=${encodeURIComponent(textBody)}`;
  window.location.href = mailto;
  mailNote.textContent = `Pedido preparado para enviar a ${currentCatalog.orderEmail}.`;
}

function loadCatalogFromRaw(raw, sourceLabel) {
  const normalized = normalizeCatalog(raw);
  if (!normalized.products.length) {
    updateStatus('El archivo no contiene productos válidos.');
    return;
  }

  currentCatalog = normalized;
  currentOrder = {};
  activeCategory = 'Todos';
  persistState();
  renderCategories();
  renderMenu();
  renderOrder();
  updateStatus(`Catálogo cargado (${sourceLabel}) con ${normalized.products.length} productos.`);
}

function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  fields.push(current.trim());
  return fields;
}

function parseWooCsvToCatalog(text, sourceLabel) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map(item => item.trim())
    .filter(Boolean);

  if (lines.length < 2) return null;

  const headers = parseCsvLine(lines[0]).map(item => item.toLowerCase());
  const nameIndex = headers.findIndex(item => item === 'name');
  const categoryIndex = headers.findIndex(item => item === 'categories');
  const priceIndex = headers.findIndex(item => item === 'regular price' || item === 'sale price' || item === 'price');
  const imagesIndex = headers.findIndex(item => item === 'images');
  const descriptionIndex = headers.findIndex(item => item === 'short description' || item === 'description');

  if (nameIndex === -1 || priceIndex === -1) return null;

  const products = lines.slice(1).map((line, index) => {
    const cols = parseCsvLine(line);
    const imageRaw = imagesIndex >= 0 ? String(cols[imagesIndex] || '') : '';
    const image = imageRaw.split(',').map(item => item.trim()).find(Boolean) || '';
    const categoryRaw = categoryIndex >= 0 ? String(cols[categoryIndex] || '') : 'Otros';
    const category = categoryRaw.split('>').map(item => item.trim()).filter(Boolean).pop() || 'Otros';
    const priceText = String(cols[priceIndex] || '0').replace(',', '.').replace(/[^\d.]/g, '');
    return {
      id: `${String(cols[nameIndex] || 'producto').toLowerCase().replace(/\s+/g, '-')}-${index}`,
      name: String(cols[nameIndex] || '').trim(),
      category,
      price: Number(priceText || 0),
      description: descriptionIndex >= 0 ? String(cols[descriptionIndex] || '').trim() : '',
      image
    };
  }).filter(item => item.name);

  return {
    restaurant: currentCatalog?.restaurant || 'Sushi Daruma',
    orderEmail: currentCatalog?.orderEmail || 'pedidos@sushidaruma.cl',
    products,
    sourceLabel
  };
}

fileInput.addEventListener('change', async event => {
  const [file] = event.target.files || [];
  if (!file) return;

  try {
    const text = await file.text();
    const lowerName = String(file.name || '').toLowerCase();
    if (lowerName.endsWith('.csv')) {
      const parsed = parseWooCsvToCatalog(text, file.name);
      if (!parsed || !parsed.products.length) {
        updateStatus('No se pudo leer el CSV. Verifica que tenga columnas Name y Price/Regular price.');
        return;
      }
      loadCatalogFromRaw(parsed, file.name);
      return;
    }

    loadCatalogFromRaw(JSON.parse(text), file.name);
  } catch {
    updateStatus('No se pudo leer el archivo. Revisa que sea JSON válido o CSV compatible.');
  }
});

loadDemoBtn.addEventListener('click', () => {
  loadCatalogFromRaw(DEMO_CATALOG, 'menú demo');
});

clearDataBtn.addEventListener('click', () => {
  clearCatalog();
  clearOrder();
  currentCatalog = normalizeCatalog(DEMO_CATALOG);
  currentOrder = {};
  activeCategory = 'Todos';
  renderCategories();
  renderMenu();
  renderOrder();
  updateStatus('Se limpiaron los datos guardados del navegador.');
});

menuSearch.addEventListener('input', renderMenu);
orderForm.addEventListener('submit', handleOrderSubmit);

renderCategories();
renderMenu();
renderOrder();
updateStatus(getCatalog() ? 'Catálogo recuperado desde tu navegador.' : 'Cargado menú demo base. Sube tu archivo para usar tu catálogo real.');
