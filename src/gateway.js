'use strict';

// Fake payment gateway. Dedupes on idempotencyKey the way Stripe-style APIs do:
// the same key replays the original charge, a new key creates a new charge.
//
// It also simulates the nastiest real-world failure mode: the charge is created
// on the gateway side, then the response is lost (socket timeout).

function createGateway({ failFirstResponse = false } = {}) {
  const byKey = new Map();
  const captured = [];
  let dropNextResponse = failFirstResponse;

  return {
    captured,
    async charge({ idempotencyKey, amountCents }) {
      if (byKey.has(idempotencyKey)) return byKey.get(idempotencyKey);

      const receipt = {
        id: `ch_${captured.length + 1}`,
        idempotencyKey,
        amountCents,
        status: 'succeeded',
      };
      byKey.set(idempotencyKey, receipt);
      captured.push(receipt);

      if (dropNextResponse) {
        dropNextResponse = false;
        const err = new Error('socket hang up');
        err.code = 'ETIMEDOUT';
        throw err;
      }

      return receipt;
    },
  };
}

module.exports = { createGateway };
