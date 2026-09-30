import { STATUSES, PRIORITIES } from './data.js';
import * as store from './store.js';

const $ = (sel) => document.querySelector(sel);
const label = (list, v) => list.find((x) => x.value === v)?.label ?? v;
const fmt = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const options = (list, selected) =>
  list.map((o) => `<option value="${o.value}"${o.value === selected ? ' selected' : ''}>${o.label}</option>`).join('');

const filters = { q: '', status: '', priority: '' };
const sort = { key: 'createdDate', dir: 'desc' };
const params = new URLSearchParams(location.search); // filters survive refresh and can be shared as a link
for (const k of Object.keys(filters)) filters[k] = params.get(k) ?? '';
const RANK = { priority: { low: 0, medium: 1, high: 2, urgent: 3 }, status: { open: 0, in_progress: 1, resolved: 2, closed: 3 } };
let openId = null;
let toastTimer;

/* ---------- rendering ---------- */

function renderStats() {
  const s = store.stats();
  const items = [
    ['Total', s.total], ['Open', s.open], ['In progress', s.inProgress],
    ['Resolved or closed', s.resolved], ['Overdue', s.overdue], ['High or urgent, still active', s.urgentActive],
  ];
  $('#stats').innerHTML = items
    .map(([name, n]) => `<div class="stat${name === 'Overdue' && n ? ' warn' : ''}"><dd>${n}</dd><dt>${name}</dt></div>`)
    .join('');
}

function visibleTickets() {
  const q = filters.q.trim().toLowerCase();
  return store.getAll()
    .filter((x) => !filters.status || x.status === filters.status)
    .filter((x) => !filters.priority || x.priority === filters.priority)
    .filter((x) => !q || `${x.title} ${x.client}`.toLowerCase().includes(q))
    .sort(compare);
}

function compare(a, b) {
  const k = sort.key;
  const va = RANK[k] ? RANK[k][a[k]] : a[k].toLowerCase();
  const vb = RANK[k] ? RANK[k][b[k]] : b[k].toLowerCase();
  const r = va < vb ? -1 : va > vb ? 1 : 0;
  return sort.dir === 'asc' ? r : -r;
}

function priorityCell(x) {
  const f = document.createDocumentFragment();
  f.append(badge('priority', x.priority, PRIORITIES));
  if (store.isOverdue(x)) {
    const o = document.createElement('span');
    o.className = 'badge overdue';
    o.textContent = 'Overdue';
    f.append(' ', o);
  }
  return f;
}

function renderHistory(x) {
  $('#d-history').replaceChildren(...(x.history ?? []).slice(0, 6).map((h) =>
    Object.assign(document.createElement('li'), { textContent: `${fmt(h.at)}: ${h.text}` })));
}

function renderList() {
  const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v));
  if (params.has('demo')) qs.set('demo', '1'); // keep demo mode across re-renders
  try { history.replaceState(null, '', qs.size ? `?${qs}` : location.pathname); } catch { /* sandboxed frame */ }
  document.querySelectorAll('th[data-sort]').forEach((th) => th.setAttribute('aria-sort',
    th.dataset.sort === sort.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'));
  const rows = visibleTickets();
  $('#count').textContent = `${rows.length} of ${store.getAll().length} tickets`;
  const body = $('#rows');
  body.replaceChildren();
  $('#empty').hidden = rows.length > 0;
  for (const x of rows) {
    const tr = document.createElement('tr');
    const title = document.createElement('button');
    title.className = 'link';
    title.textContent = x.title;
    title.addEventListener('click', () => openDetail(x.id));
    const cells = [
      title, x.client,
      priorityCell(x),
      badge('status', x.status, STATUSES),
      fmt(x.createdDate),
    ];
    cells.forEach((c, i) => {
      const td = document.createElement('td');
      td.dataset.label = ['Title', 'Client', 'Priority', 'Status', 'Created'][i];
      td.append(c);
      tr.append(td);
    });
    body.append(tr);
  }
}

function badge(kind, value, list) {
  const el = document.createElement('span');
  el.className = `badge ${kind}-${value}`;
  el.textContent = label(list, value);
  return el;
}

function renderMix() {
  const active = store.getAll().filter((x) => x.status === 'open' || x.status === 'in_progress');
  const counts = PRIORITIES.map((p) => [p, active.filter((x) => x.priority === p.value).length]);
  $('#mix-bar').innerHTML = counts.filter(([, n]) => n)
    .map(([p, n]) => `<span class="seg priority-${p.value}" style="flex:${n}" title="${p.label}: ${n}"></span>`).join('');
  $('#mix-legend').innerHTML = counts
    .map(([p, n]) => `<span class="priority-${p.value}"><i></i>${p.label}<b>${n}</b></span>`).join('');
}

function render() {
  renderStats();
  renderMix();
  renderList();
}

/* ---------- detail dialog ---------- */

function openDetail(id) {
  const x = store.getById(id);
  if (!x) return;
  openId = id;
  $('#d-title').textContent = x.title;
  $('#d-client').textContent = x.client;
  $('#d-date').textContent = fmt(x.createdDate);
  $('#d-desc').textContent = x.description || 'No description provided.';
  $('#d-status').innerHTML = options(STATUSES, x.status);
  $('#d-priority').innerHTML = options(PRIORITIES, x.priority);
  renderHistory(x);
  $('#detail').showModal();
}

$('#d-status').addEventListener('change', (e) => {
  store.update(openId, { status: e.target.value });
  render();
  renderHistory(store.getById(openId));
  announce(`Status changed to ${label(STATUSES, e.target.value)}`);
});
$('#d-priority').addEventListener('change', (e) => {
  store.update(openId, { priority: e.target.value });
  render();
  renderHistory(store.getById(openId));
  announce(`Priority changed to ${label(PRIORITIES, e.target.value)}`);
});
$('#d-delete').addEventListener('click', () => {
  const removed = store.remove(openId);
  $('#detail').close();
  render();
  if (removed) announce(`Deleted "${removed.ticket.title}"`, () => { store.restore(removed); render(); });
});

/* ---------- create dialog ---------- */

$('#new-btn').addEventListener('click', () => {
  $('#new-form').reset();
  $('#new-error').textContent = '';
  $('#n-priority').innerHTML = options(PRIORITIES, 'medium');
  $('#new').showModal();
  $('#n-title').focus();
});

$('#new-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const title = f.get('title').trim();
  const client = f.get('client').trim();
  if (!title || !client) {
    $('#new-error').textContent = 'Title and client are required.';
    return;
  }
  const t = store.create({ title, client, priority: f.get('priority'), description: f.get('description').trim() });
  $('#new').close();
  filters.q = filters.status = filters.priority = '';
  $('#search').value = $('#f-status').value = $('#f-priority').value = '';
  render();
  announce(`Created "${t.title}"`);
});

document.querySelectorAll('[data-close]').forEach((b) =>
  b.addEventListener('click', () => b.closest('dialog').close()));

/* ---------- filters ---------- */

$('#search').addEventListener('input', (e) => { filters.q = e.target.value; renderList(); });
$('#f-status').addEventListener('change', (e) => { filters.status = e.target.value; renderList(); });
$('#f-priority').addEventListener('change', (e) => { filters.priority = e.target.value; renderList(); });
$('#clear').addEventListener('click', () => {
  filters.q = filters.status = filters.priority = '';
  $('#search').value = $('#f-status').value = $('#f-priority').value = '';
  renderList();
});

/* ---------- sorting, export, shortcuts ---------- */

document.querySelectorAll('th[data-sort]').forEach((th) =>
  th.querySelector('button').addEventListener('click', () => {
    const key = th.dataset.sort;
    sort.dir = sort.key === key && sort.dir === 'asc' ? 'desc' : 'asc';
    sort.key = key;
    renderList();
  }));

$('#export').addEventListener('click', () => {
  // Prefix formula-like cells so spreadsheets don't execute them (CSV injection).
  const esc = (v) => `"${(/^[=+\-@]/.test(v) ? "'" + v : String(v)).replaceAll('"', '""')}"`;
  const rows = [['Title', 'Client', 'Priority', 'Status', 'Created'],
    ...visibleTickets().map((x) => [x.title, x.client, x.priority, x.status, x.createdDate])];
  const url = URL.createObjectURL(new Blob([rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv' }));
  Object.assign(document.createElement('a'), { href: url, download: 'tickets.csv' }).click();
  URL.revokeObjectURL(url);
});

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || document.querySelector('dialog[open]') || e.target.matches('input, textarea, select')) return;
  if (e.key === '/') { e.preventDefault(); $('#search').focus(); }
  if (e.key === 'n') { e.preventDefault(); $('#new-btn').click(); }
});

/* ---------- toast with optional undo (added feature) ---------- */

function announce(message, onUndo) {
  const toast = $('#toast');
  $('#toast-msg').textContent = message;
  const undo = $('#toast-undo');
  undo.hidden = !onUndo;
  undo.onclick = () => { onUndo?.(); toast.hidden = true; };
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, onUndo ? 7000 : 3000);
}

/* ---------- init ---------- */

$('#f-status').innerHTML = '<option value="">All statuses</option>' + options(STATUSES);
$('#f-priority').innerHTML = '<option value="">All priorities</option>' + options(PRIORITIES);
$('#search').value = filters.q;
$('#f-status').value = filters.status;
$('#f-priority').value = filters.priority;
render();
const tick = () => { $('#clock').textContent = new Date().toLocaleTimeString([], { hour12: false }); };
tick();
setInterval(tick, 1000);
setInterval(render, 60000); // re-evaluate overdue tickets as time passes
if (params.has('demo')) import('./demo.js'); // guided auto-play tour: open index.html?demo
