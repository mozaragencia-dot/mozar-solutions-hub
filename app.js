const ordersBody = document.getElementById('orders-body');
const courierBody = document.getElementById('courier-body');
const orderForm = document.getElementById('order-form');
const courierName = document.getElementById('courier-name');
const lawyerForm = document.getElementById('lawyer-form');
const lawyerList = document.getElementById('lawyer-list');

function notifyOrder(order) {
  const destination = cleanPhone(order.phone);
  if (!destination) return;
  const msg = encodeURIComponent(buildTacamMessage(order));
  window.open(`https://wa.me/${destination}?text=${msg}`, '_blank', 'noopener');
}

function updateOrder(orderId, updater) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  updater(order);
  saveOrders(orders);
  renderAll();
}

function renderOrders() {
  const orders = getOrders();
  ordersBody.innerHTML = orders.length ? orders.map(order => `
    <tr>
      <td>${fmtDate(order.createdAt)}</td>
      <td>${order.customer}</td>
      <td>${order.phone}</td>
      <td>${order.address}</td>
      <td><span class="badge ${order.status}">${statusLabel(order.status)}</span></td>
      <td>
        <input data-assign-input="${order.id}" value="${order.assignedTo || ''}" placeholder="Nombre repartidor" />
        <button data-assign-btn="${order.id}">Guardar</button>
      </td>
      <td><button data-notify-btn="${order.id}">WhatsApp</button></td>
    </tr>
  `).join('') : '<tr><td colspan="7">Sin pedidos</td></tr>';

  ordersBody.querySelectorAll('[data-assign-btn]').forEach(btn => {
    btn.onclick = () => updateOrder(btn.dataset.assignBtn, order => {
      const input = ordersBody.querySelector(`[data-assign-input="${order.id}"]`);
      order.assignedTo = input.value.trim();
      order.status = order.assignedTo ? 'asignado' : 'nuevo';
    });
  });
  ordersBody.querySelectorAll('[data-notify-btn]').forEach(btn => {
    btn.onclick = () => {
      const order = getOrders().find(o => o.id === btn.dataset.notifyBtn);
      if (order) notifyOrder(order);
    };
  });
}

function renderCourier() {
  const name = courierName.value.trim();
  const orders = getOrders().filter(o => o.status !== 'entregado' && (!o.assignedTo || o.assignedTo === name));
  courierBody.innerHTML = orders.length ? orders.map(order => `
    <tr>
      <td>${order.customer}</td>
      <td>${order.address}</td>
      <td><span class="badge ${order.status}">${statusLabel(order.status)}</span></td>
      <td>
        <button data-take="${order.id}">Tomar</button>
        <button data-route="${order.id}">En camino</button>
        <button data-done="${order.id}">Entregado</button>
      </td>
    </tr>
  `).join('') : '<tr><td colspan="4">Sin pedidos</td></tr>';

  courierBody.querySelectorAll('[data-take]').forEach(btn => {
    btn.onclick = () => updateOrder(btn.dataset.take, order => {
      if (!name) return;
      order.assignedTo = name;
      order.status = 'asignado';
    });
  });
  courierBody.querySelectorAll('[data-route]').forEach(btn => {
    btn.onclick = () => updateOrder(btn.dataset.route, order => {
      if (name && order.assignedTo === name) order.status = 'en_camino';
    });
  });
  courierBody.querySelectorAll('[data-done]').forEach(btn => {
    btn.onclick = () => updateOrder(btn.dataset.done, order => {
      if (name && order.assignedTo === name) order.status = 'entregado';
    });
  });
}

function renderLawyers() {
  const lawyers = getLawyers();
  lawyerList.innerHTML = lawyers.length ? lawyers.map(l => `
    <article class="lawyer-card">
      <img src="${l.photo}" alt="Foto de ${l.name}" />
      <div>
        <h3>${l.name}</h3>
        <p>${l.specialty || 'Sin especialidad'}</p>
        <small>${l.phone || 'Sin WhatsApp'}</small>
      </div>
    </article>
  `).join('') : '<p>No hay abogados cargados.</p>';
}

function renderAll() {
  renderOrders();
  renderCourier();
  renderLawyers();
}

orderForm.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(orderForm);
  const orders = getOrders();
  orders.unshift({
    id: crypto.randomUUID(),
    customer: String(data.get('customer') || '').trim(),
    phone: String(data.get('phone') || '').trim(),
    address: String(data.get('address') || '').trim(),
    notes: String(data.get('notes') || '').trim(),
    assignedTo: '',
    status: 'nuevo',
    createdAt: new Date().toISOString()
  });
  saveOrders(orders);
  orderForm.reset();
  renderAll();
});

courierName.addEventListener('input', renderCourier);

lawyerForm.addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(lawyerForm);
  const file = data.get('photo');
  if (!(file instanceof File) || !file.size) return;
  const lawyers = getLawyers();
  lawyers.unshift({
    id: crypto.randomUUID(),
    name: String(data.get('name') || '').trim(),
    specialty: String(data.get('specialty') || '').trim(),
    phone: String(data.get('phone') || '').trim(),
    photo: await fileToDataUrl(file)
  });
  saveLawyers(lawyers);
  lawyerForm.reset();
  renderLawyers();
});

renderAll();
setInterval(renderOrders, 4000);
