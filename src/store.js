'use strict';

// In-memory data layer. Reset between test runs via reset().

const HOUR = 60 * 60 * 1000;

let users;
let sessions;
let orders;

function reset() {
  users = new Map([
    ['u_1', { id: 'u_1', email: 'ada@example.com', role: 'customer' }],
    ['u_2', { id: 'u_2', email: 'grace@example.com', role: 'customer' }],
    ['u_9', { id: 'u_9', email: 'admin@example.com', role: 'admin' }],
  ]);

  sessions = new Map([
    ['tok-ada', { userId: 'u_1', role: 'customer', expiresAt: Date.now() + HOUR }],
    ['tok-grace', { userId: 'u_2', role: 'customer', expiresAt: Date.now() + HOUR }],
    ['tok-admin', { userId: 'u_9', role: 'admin', expiresAt: Date.now() + HOUR }],
  ]);

  orders = new Map([
    [
      'o_100',
      {
        id: 'o_100',
        userId: 'u_1',
        amountCents: 4999,
        status: 'paid',
        items: [{ sku: 'MUG-1', qty: 1, kind: 'physical' }],
        shipping: {
          carrier: 'ups',
          address: { line1: '1 Main St', city: 'Boston', zip: '02101' },
        },
        charges: [],
        refunds: [],
      },
    ],
    [
      'o_200',
      {
        id: 'o_200',
        userId: 'u_2',
        amountCents: 1200,
        status: 'pending',
        items: [{ sku: 'EBOOK-7', qty: 1, kind: 'digital' }],
        // Digital-only orders never get a shipping record.
        shipping: null,
        charges: [],
        refunds: [],
      },
    ],
  ]);
}

reset();

module.exports = {
  reset,
  getUser: (id) => users.get(id) || null,
  getSession: (token) => sessions.get(token) || null,
  getOrder: (id) => orders.get(id) || null,
  listOrders: (userId) => [...orders.values()].filter((o) => o.userId === userId),
  allOrders: () => [...orders.values()],
};
