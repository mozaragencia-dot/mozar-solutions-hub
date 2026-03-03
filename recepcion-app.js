const adminBody = document.getElementById('admin-body');

function renderAdminOrders() {
  const orders = getOrders();
  adminBody.innerHTML = orders.length ? orders.map(order => `
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
    </tr>
  `).join('') : '<tr><td colspan="6">Sin pedidos</td></tr>';

  adminBody.querySelectorAll('[data-assign-btn]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.assignBtn;
      const input = adminBody.querySelector(`[data-assign-input="${id}"]`);
      const orders = getOrders();
      const order = orders.find(item => item.id === id);
      if (!order) return;
      order.assignedTo = input.value.trim();
      order.status = order.assignedTo ? 'asignado' : 'nuevo';
      saveOrders(orders);
      renderAdminOrders();
    };
  });
}

renderAdminOrders();
setInterval(renderAdminOrders, 4000);
