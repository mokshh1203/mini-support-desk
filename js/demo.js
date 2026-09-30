(() => {
  const $ = (s) => document.querySelector(s);
  let alive = true;
  const sleep = (ms) => new Promise((r) => setTimeout(() => (alive ? r() : (() => { throw 'stop'; })()), ms));
  const mk = (cls, html = '') => { const e = document.createElement('div'); e.className = cls; e.setAttribute('popover', 'manual'); e.innerHTML = html; document.body.append(e); return e; };
  const cur = mk('d-cur'), cap = mk('d-cap'), ctl = mk('d-ctl', '<button id="d-stop" class="btn primary">Stop demo</button>');
  const raise = () => [cur, cap, ctl].forEach((e) => { try { e.hidePopover(); } catch {} e.showPopover(); });
  const show = (msg) => { cap.textContent = msg; raise(); };
  async function move(el) {
    el.scrollIntoView({ block: 'nearest' }); raise();
    const r = el.getBoundingClientRect();
    cur.style.left = r.left + Math.min(r.width / 2, 60) + 'px';
    cur.style.top = r.top + r.height / 2 + 'px';
    await sleep(800);
  }
  async function click(el) { await move(el); cur.classList.add('tap'); await sleep(180); el.click(); cur.classList.remove('tap'); await sleep(500); }
  async function type(el, text) { await move(el); el.focus(); for (const ch of text) { el.value += ch; el.dispatchEvent(new Event('input', { bubbles: true })); await sleep(90); } }
  async function pick(el, v) { await move(el); el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); await sleep(500); }

  async function tour() {
    await sleep(1200);
    show('Dashboard: live counts of open, in-progress, resolved and overdue tickets'); await move($('#stats')); await sleep(2500);
    show('Search by title or client'); await type($('#search'), 'login'); await sleep(1800);
    await click($('#clear'));
    show('Filter by status'); await pick($('#f-status'), 'open'); await sleep(1600);
    show('Filter by priority'); await pick($('#f-priority'), 'urgent'); await sleep(1600);
    await click($('#clear'));
    show('Sort any column. Click Priority, then again to reverse'); await click($('th[data-sort=priority] button')); await sleep(1200);
    await click($('th[data-sort=priority] button')); await sleep(1500);
    show('Open a ticket to see its details'); await click($('#rows .link')); await sleep(1500);
    show('Change status: the dashboard updates and the activity log records it'); await pick($('#d-status'), 'in_progress'); await sleep(2200);
    show('Change priority the same way'); await pick($('#d-priority'), 'medium'); await sleep(2000);
    await click($('#detail [data-close]'));
    show('Create a ticket. Submitting empty shows a validation error'); await click($('#new-btn')); await click($('#new-form .primary')); await sleep(1800);
    show('Fill in the form'); await type($('#n-title'), 'Client cannot download invoice'); await type($('[name=client]'), 'Acme Corp'); await pick($('#n-priority'), 'urgent'); await sleep(600);
    await click($('#new-form .primary')); show('The new ticket appears in the list'); await sleep(2400);
    show('Delete a ticket'); await click($('#rows .link')); await click($('#d-delete')); await sleep(1200);
    show('Undo brings it straight back'); await click($('#toast-undo')); await sleep(2200);
    show('That is the whole app. Data is saved in the browser. Now try it yourself!');
    cur.hidePopover();
  }
  const btn = $('#d-stop');
  btn.onclick = () => { if (btn.textContent === 'Replay demo') return location.reload(); alive = false; btn.textContent = 'Replay demo'; try { cap.hidePopover(); cur.hidePopover(); } catch {} };
  tour().then(() => { btn.textContent = 'Replay demo'; }).catch((e) => { if (e !== 'stop') show('Demo paused. Use the app normally.'); });
})();
