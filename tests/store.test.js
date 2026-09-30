import test from 'node:test';
import assert from 'node:assert/strict';
import * as store from '../js/store.js';

const hoursAgo = (h) => new Date(Date.now() - h * 36e5).toISOString();

test('starts with 10 seeded tickets', () => assert.equal(store.getAll().length, 10));

test('create adds a ticket with a history entry', () => {
  const t = store.create({ title: 'A', client: 'B', priority: 'low', description: '' });
  assert.equal(store.getAll()[0].id, t.id);
  assert.equal(t.status, 'open');
  assert.equal(t.history.length, 1);
});

test('update logs changes and ignores no-ops', () => {
  const t = store.getAll()[0];
  store.update(t.id, { status: 'resolved' });
  store.update(t.id, { status: 'resolved' });
  assert.equal(t.history.length, 2);
  assert.match(t.history[0].text, /open → resolved/);
});

test('remove then restore keeps the original position', () => {
  const removed = store.remove(store.getAll()[3].id);
  assert.equal(removed.index, 3);
  store.restore(removed);
  assert.equal(store.getAll()[3].id, removed.ticket.id);
});

test('overdue applies only to active tickets past their SLA', () => {
  assert.equal(store.isOverdue({ status: 'open', priority: 'urgent', createdDate: hoursAgo(48) }), true);
  assert.equal(store.isOverdue({ status: 'resolved', priority: 'urgent', createdDate: hoursAgo(48) }), false);
  assert.equal(store.isOverdue({ status: 'open', priority: 'low', createdDate: hoursAgo(48) }), false);
});
