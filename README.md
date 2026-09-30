# Mini Support Desk

A lightweight internal tool for tracking client support requests. Vanilla JavaScript (ES modules), no build step, data saved in `localStorage`.

## Run in VS Code

1. Unzip and open the folder in VS Code (`File > Open Folder`).
2. Install the recommended **Live Server** extension (VS Code offers it automatically).
3. Right-click `index.html` > **Open with Live Server**.
4. Click **Watch demo** in the header (or open `/?demo`) for a guided auto-play tour of every feature. **Stop demo** ends it.

No extension? Double-click **`demo.html`**: it is a single-file build of the same app that plays the tour straight from disk, no server needed.

## Run locally

ES modules need an HTTP server (opening `index.html` via `file://` will not work):

```bash
npx serve .
# or: python3 -m http.server 8000
```

## Deploy

It is a static site. On Vercel or Netlify, import the repo with no framework preset, no build command, and the root directory as output.

## Features

- 10 seeded sample tickets (created on first load or if stored data is corrupted)
- Create a ticket (title and client required, whitespace trimmed, length limits)
- Ticket details in a modal; change status and priority inline
- Search by title or client, filter by status and priority, clear filters
- Delete a ticket
- Dashboard: total, open, in progress, resolved/closed, high or urgent tickets still active
- Responsive layout (table becomes stacked rows on mobile), light and dark theme

## Structure

```
index.html        page shell and dialogs
css/styles.css    styling, theming, responsive rules
js/data.js        status/priority definitions and seed tickets
js/store.js       data layer: CRUD, stats, localStorage persistence
js/app.js         rendering, events, filters, dialogs, toast
```

The store knows nothing about the DOM, so swapping `localStorage` for an API or Supabase means changing only `store.js`.

## What I added: undo for delete

Deleting a ticket shows a toast with an **Undo** button for 7 seconds; undo restores the ticket in its original position.

**Why:** delete is the one destructive action in the app. A confirm dialog interrupts every deletion, while undo keeps the flow fast and still protects against mistakes. The toast is a `role="status"` live region, so screen reader users hear it too. The same toast confirms status, priority and create actions.

## Edge cases handled

- Empty or whitespace-only title/client rejected with an inline error
- Empty state when no ticket matches filters
- Corrupted or unavailable `localStorage` falls back to seed data / in-memory
- User text is inserted with `textContent`, never as HTML, so no XSS
- Keyboard accessible: native `<dialog>` (Esc closes, focus trapped), visible focus rings, labelled controls

## Trade-offs

Data is per browser (no shared backend), and there is no edit-title flow or pagination, since the brief asked for lightweight scope.

## Version 2 improvements

Headline extra: **overdue tickets (SLA).** Each priority has a time limit (`SLA_HOURS` in `js/data.js`: urgent 24h, high 72h, medium 7d, low 14d). An open or in-progress ticket past its limit gets an Overdue badge and counts in a dashboard card. Why: a support team's real question is "what is slipping?", and this answers it. The logic is one pure function, `isOverdue`, so it is unit tested.

Smaller additions:
- **Activity history:** every status or priority change is logged per ticket and shown in the detail dialog.
- **Sortable columns** with `aria-sort` for screen readers (priority and status sort by rank, not alphabetically).
- **Filters live in the URL** (`?status=open&q=login`), so a view survives refresh and can be shared.
- **Export CSV** of the filtered list, with protection against spreadsheet formula injection.
- **Keyboard shortcuts:** `/` focuses search, `n` opens a new ticket.
- **Tests:** `npm test` runs unit tests for the store using Node's built-in runner (no dependencies).

## Interface

Dark, mission-control style: grid backdrop, monospace tabular numbers, priority and status colour coding, and a live clock. A workload bar shows active tickets by priority, the Overdue card turns red when anything is late, and the list re-checks overdue tickets every minute without a reload.

## Structure note

`demo.html` is a generated single-file bundle (all CSS and JS inlined) so the demo runs from disk. The real source lives in `index.html`, `css/` and `js/`.
