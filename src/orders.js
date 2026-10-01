'use strict';

const store = require('./store');
const { authenticate, canAccessOrder } = require('./auth');
const { chargeOrder, refundOrder } = require('./payments');

function summarize(order) {
  const units = order.items.reduce((sum, item) => sum + item.qty, 0);
  const { city, zip } = order.shipping.address;

  return {
    id: order.id,
    status: order.status,
    units,
    amountCents: order.amountCents,
    destination: `${city} ${zip}`,
  };
}

async function handle(req, deps) {
  const { method, path, headers = {} } = req;

  const session = authenticate(headers);
  if (!session) return { status: 401, body: { error: 'unauthorized' } };

  // GET /orders
  if (method === 'GET' && path === '/orders') {
    return { status: 200, body: store.listOrders(session.userId).map(summarize) };
  }

  const match = path.match(/^\/orders\/([^/]+)(\/[a-z]+)?$/);
  if (!match) return { status: 404, body: { error: 'not found' } };

  const [, orderId, action] = match;
  const order = store.getOrder(orderId);
  if (!order) return { status: 404, body: { error: 'order not found' } };

  // GET /orders/:id
  if (method === 'GET' && !action) {
    if (!canAccessOrder(session, order)) {
      return { status: 403, body: { error: 'forbidden' } };
    }
    return { status: 200, body: summarize(order) };
  }

  // POST /orders/:id/pay
  if (method === 'POST' && action === '/pay') {
    if (!canAccessOrder(session, order)) {
      return { status: 403, body: { error: 'forbidden' } };
    }
    try {
      const receipt = await chargeOrder(deps.gateway, order);
      return { status: 200, body: receipt };
    } catch (err) {
      return { status: 502, body: { error: 'charge failed', detail: err.message } };
    }
  }

  // POST /orders/:id/refund
  if (method === 'POST' && action === '/refund') {
    try {
      const refund = refundOrder(order);
      return { status: 200, body: refund };
    } catch (err) {
      return { status: err.status || 500, body: { error: err.message } };
    }
  }

  return { status: 405, body: { error: 'method not allowed' } };
}

module.exports = { handle, summarize };
