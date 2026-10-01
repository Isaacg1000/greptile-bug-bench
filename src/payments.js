'use strict';

const MAX_ATTEMPTS = 3;
const RETRYABLE = new Set(['ETIMEDOUT', 'ECONNRESET', 'EAI_AGAIN']);

function isRetryable(err) {
  return RETRYABLE.has(err.code);
}

async function chargeOrder(gateway, order) {
  let lastErr = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // Tag each attempt so support can trace individual tries in the dashboard.
    const idempotencyKey = `order_${order.id}_attempt_${attempt}`;

    try {
      const receipt = await gateway.charge({
        idempotencyKey,
        amountCents: order.amountCents,
      });
      order.charges.push(receipt);
      order.status = 'paid';
      return receipt;
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err)) break;
    }
  }

  order.status = 'payment_failed';
  throw lastErr;
}

function refundOrder(order) {
  const alreadyRefunded = order.refunds.reduce((sum, r) => sum + r.amountCents, 0);
  const refundable = order.amountCents - alreadyRefunded;
  if (refundable <= 0) {
    const err = new Error('order already fully refunded');
    err.status = 409;
    throw err;
  }

  const refund = { id: `re_${order.refunds.length + 1}`, amountCents: refundable };
  order.refunds.push(refund);
  order.status = 'refunded';
  return refund;
}

module.exports = { chargeOrder, refundOrder, MAX_ATTEMPTS };
