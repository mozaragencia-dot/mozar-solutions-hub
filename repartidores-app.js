const courierName = document.getElementById('courier-name');
const courierBody = document.getElementById('courier-body');

function updateOrder(orderId, updater) {
  const orders = getOrders();
  const order = orders.find(item => item.id === orderId);
  if (!order) return;
  updater(order);
  saveOrders(orders);
  renderCourierOrders();
}

function renderCourierOrders() {
  const name = courierName.value.trim();
  const orders = getOrders().filter(order =>
    order.status !== 'entregado' && (!order.assignedTo || order.assignedTo === name)
  );

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
  `).join('') : '<tr><td colspan="4">Sin pedidos para mostrar</td></tr>';

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

courierName.addEventListener('input', renderCourierOrders);
renderCourierOrders();
