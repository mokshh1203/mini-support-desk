import { SEED, SLA_HOURS } from './data.js';

const KEY = 'minidesk.tickets.v1';

function load() {
  try {
    if (new URLSearchParams(location.search).has('demo')) localStorage.removeItem(KEY); // demo starts from seed data
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* corrupted or blocked storage: fall back to seed data */
  }
  return structuredClone(SEED);
}

let tickets = load();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(tickets));
  } catch {
    /* storage full or blocked: app keeps working in memory */
  }
}

export const getAll = () => tickets;
export const getById = (id) => tickets.find((x) => x.id === id);

export function create({ title, client, priority, description }) {
  const ticket = {
    id: crypto.randomUUID(),
    title, client, priority, description,
    status: 'open',
    createdDate: new Date().toISOString(),
    history: [{ at: new Date().toISOString(), text: 'Ticket created' }],
  };
  tickets.unshift(ticket);
  save();
  return ticket;
}

export function update(id, patch) {
  const ticket = getById(id);
  if (!ticket) return null;
  ticket.history ??= [];
  for (const [key, value] of Object.entries(patch)) {
    if (ticket[key] === value) continue; // no-op changes are not logged
    const show = (v) => String(v).replace('_', ' ');
    ticket.history.unshift({ at: new Date().toISOString(), text: `${key} ${show(ticket[key])} → ${show(value)}` });
    ticket[key] = value;
  }
  save();
  return ticket;
}

export function remove(id) {
  const index = tickets.findIndex((x) => x.id === id);
  if (index < 0) return null;
  const [ticket] = tickets.splice(index, 1);
  save();
  return { ticket, index };
}

export function restore({ ticket, index }) {
  tickets.splice(index, 0, ticket);
  save();
}

export function isOverdue(t) {
  const active = t.status === 'open' || t.status === 'in_progress';
  return active && Date.now() - new Date(t.createdDate) > SLA_HOURS[t.priority] * 36e5;
}

export function stats() {
  const by = (key, value) => tickets.filter((x) => x[key] === value).length;
  const active = tickets.filter((x) => x.status === 'open' || x.status === 'in_progress');
  return {
    total: tickets.length,
    open: by('status', 'open'),
    inProgress: by('status', 'in_progress'),
    resolved: by('status', 'resolved') + by('status', 'closed'),
    overdue: tickets.filter(isOverdue).length,
    urgentActive: active.filter((x) => x.priority === 'urgent' || x.priority === 'high').length,
  };
}
