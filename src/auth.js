'use strict';

const store = require('./store');

function authenticate(headers) {
  const raw = headers.authorization || '';
  if (!raw.startsWith('Bearer ')) return null;

  const session = store.getSession(raw.slice('Bearer '.length).trim());
  if (!session) return null;
  if (session.expiresAt <= Date.now()) return null;

  return session;
}

function canAccessOrder(session, order) {
  if (session.role === 'admin') return true;
  return order.userId === session.userId;
}

module.exports = { authenticate, canAccessOrder };
