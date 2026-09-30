const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString();

export const STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];
export const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const t = (n, title, client, priority, status, days, description) => ({
  id: `seed-${n}`, title, client, priority, status, createdDate: daysAgo(days), description,
});

export const SEED = [
  t(1, 'Cannot log in after password reset', 'Northwind Traders', 'urgent', 'open', 0, 'Reset email arrives but the new password is rejected on the login page.'),
  t(2, 'Invoice PDF shows wrong VAT rate', 'Brightside Dental', 'high', 'in_progress', 1, 'March invoices list 18% VAT instead of 5%. Finance needs corrected copies.'),
  t(3, 'Add export to CSV on reports page', 'Kestrel Logistics', 'low', 'open', 2, 'Feature request: export the monthly delivery report as CSV.'),
  t(4, 'Dashboard loads slowly on mobile', 'Harbor & Co', 'medium', 'in_progress', 3, 'Takes about 12 seconds on 4G. Started after last week\'s release.'),
  t(5, 'Webhook retries not firing', 'Lumen Studio', 'high', 'open', 4, 'Failed webhooks are not retried. Last successful retry was on the 12th.'),
  t(6, 'Update billing contact email', 'Alder Foods', 'low', 'resolved', 6, 'Change billing contact to accounts@alderfoods.example.'),
  t(7, 'Team member cannot see shared folder', 'Northwind Traders', 'medium', 'resolved', 8, 'Permissions look correct but the folder is hidden for one user.'),
  t(8, 'Duplicate notification emails', 'Brightside Dental', 'medium', 'closed', 12, 'Clients receive appointment reminders twice.'),
  t(9, 'Request for SSO with Okta', 'Kestrel Logistics', 'high', 'open', 15, 'Security team requires SSO before the contract renewal.'),
  t(10, 'Typo on the pricing page', 'Harbor & Co', 'low', 'closed', 20, '"Enterprize" should be "Enterprise" in the plan table.'),
];

// Hours an active ticket may stay unresolved before it counts as overdue.
export const SLA_HOURS = { urgent: 24, high: 72, medium: 168, low: 336 };
