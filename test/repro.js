'use strict';

const assert = require('node:assert');
const store = require('../src/store');
const { handle } = require('../src/orders');
const { createGateway } = require('../src/gateway');

const auth = (token) => ({ authorization: `Bearer ${token}` });

const results = [];

async function check(name, fn) {
  store.reset();
  try {
    await fn();
    results.push(`PASS  ${name}`);
  } catch (err) {
    results.push(`FAIL  ${name}\n      ${err.message.split('\n')[0]}`);
  }
}

async function main() {
  await check('a customer cannot read another customer order', async () => {
    const res = await handle(
      { method: 'GET', path: '/orders/o_100', headers: auth('tok-grace') },
      { gateway: createGateway() }
    );
    assert.strictEqual(res.status, 403);
  });

  await check('a customer cannot refund another customer order', async () => {
    const res = await handle(
      { method: 'POST', path: '/orders/o_100/refund', headers: auth('tok-grace') },
      { gateway: createGateway() }
    );
    assert.strictEqual(res.status, 403, `expected 403, got ${res.status}`);
    assert.strictEqual(store.getOrder('o_100').refunds.length, 0);
  });

  await check('a dropped gateway response does not double charge', async () => {
    const gateway = createGateway({ failFirstResponse: true });
    const res = await handle(
      { method: 'POST', path: '/orders/o_200/pay', headers: auth('tok-grace') },
      { gateway }
    );
    assert.strictEqual(res.status, 200);
    assert.strictEqual(
      gateway.captured.length,
      1,
      `customer was charged ${gateway.captured.length} times`
    );
  });

  await check('digital-only orders can be summarized', async () => {
    const res = await handle(
      { method: 'GET', path: '/orders/o_200', headers: auth('tok-grace') },
      { gateway: createGateway() }
    );
    assert.strictEqual(res.status, 200);
  });

  console.log(results.join('\n'));
  const failed = results.filter((r) => r.startsWith('FAIL')).length;
  console.log(`\n${results.length - failed} passed, ${failed} failed`);
  process.exitCode = failed > 0 ? 1 : 0;
}

main();
