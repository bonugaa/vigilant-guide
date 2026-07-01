import webpush from 'web-push';

const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BIoQx8w3zQXS1yo4X3qErIRUq35bdki1awp8mvuKj4k3Zj2ETz02L64yQKGK-m-RLLqfJaYUH1kAn8Ef3JxGqSk';
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function headers(extra = {}) {
  const auth = SERVICE_KEY && !SERVICE_KEY.startsWith('sb_')
    ? { Authorization: 'Bearer ' + SERVICE_KEY }
    : {};
  return { apikey: SERVICE_KEY, ...auth, 'Content-Type': 'application/json', ...extra };
}
async function rest(table, query = '', options = {}) {
  const response = await fetch(SUPABASE_URL + '/rest/v1/' + table + (query ? '?' + query : ''), { ...options, headers: headers(options.headers || {}) });
  if (!response.ok) throw new Error(table + ': ' + await response.text());
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
function firstOfMonth() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}
async function workspaceAlerts(workspaceId, userId, today) {
  const scope = 'workspace_id=eq.' + workspaceId;
  const [recurringRows, budgets, expenseRows, salesRows, paymentRows, members] = await Promise.all([
    rest('recurring_rules', scope + '&active=eq.true&next_due=lte.' + today + '&select=name,amount,next_due,hidden_from&order=next_due.asc'),
    rest('budgets', scope + '&select=type,category,budget_limit,warning_percent'),
    rest('expenses', scope + '&confirmed_at=gte.' + firstOfMonth() + '&select=type,category,amount,hidden_from'),
    rest('sales', scope + '&next_payment_due=lte.' + today + '&select=id,name,base,next_payment_due,hidden_from'),
    rest('payments', scope + '&select=sale_id,base,hidden_from'),
    rest('workspace_members', scope + '&user_id=eq.' + userId + '&select=role')
  ]);
  const owner = members[0] && members[0].role === 'owner';
  const visible = row => owner || !(row.hidden_from || []).includes(userId);
  const recurring = recurringRows.filter(visible), expenses = expenseRows.filter(visible), sales = salesRows.filter(visible), payments = paymentRows.filter(visible);
  const alerts = [];
  if (recurring.length) alerts.push('Tienes ' + recurring.length + ' gasto' + (recurring.length === 1 ? '' : 's') + ' recurrente' + (recurring.length === 1 ? '' : 's') + ' por confirmar.');
  const spent = {};
  for (const expense of expenses) spent[expense.type + '|' + expense.category] = (spent[expense.type + '|' + expense.category] || 0) + Number(expense.amount || 0);
  const limits = budgets.filter(b => {
    const amount = spent[b.type + '|' + b.category] || 0;
    return Number(b.budget_limit) > 0 && amount / Number(b.budget_limit) * 100 >= Number(b.warning_percent || 80);
  });
  if (limits.length) alerts.push('Revisa ' + limits.length + ' presupuesto' + (limits.length === 1 ? '' : 's') + ' cerca del límite.');
  const paid = {};
  for (const payment of payments) paid[payment.sale_id] = (paid[payment.sale_id] || 0) + Number(payment.base || 0);
  const dueSales = sales.filter(s => (paid[s.id] || 0) < Number(s.base || 0));
  if (dueSales.length) alerts.push('Tienes ' + dueSales.length + ' cobro' + (dueSales.length === 1 ? '' : 's') + ' pendiente' + (dueSales.length === 1 ? '' : 's') + '.');
  return alerts;
}

export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  if (process.env.CRON_SECRET && request.headers.authorization !== 'Bearer ' + process.env.CRON_SECRET) return response.status(401).json({ error: 'UNAUTHORIZED' });
  if (!SUPABASE_URL || !SERVICE_KEY || !PRIVATE_KEY) return response.status(500).json({ error: 'PUSH_NOT_CONFIGURED' });
  webpush.setVapidDetails('mailto:notificaciones@clario.app', PUBLIC_KEY, PRIVATE_KEY);
  const today = new Date().toISOString().slice(0, 10);
  const subscriptions = await rest('push_subscriptions', 'enabled=eq.true&or=(last_notified_on.is.null,last_notified_on.lt.' + today + ')&select=*');
  const cache = new Map();
  let sent = 0;
  for (const item of subscriptions) {
    try {
      const cacheKey = item.workspace_id + '|' + item.user_id;
      if (!cache.has(cacheKey)) cache.set(cacheKey, await workspaceAlerts(item.workspace_id, item.user_id, today));
      const alerts = cache.get(cacheKey);
      if (!alerts.length) continue;
      await webpush.sendNotification({ endpoint: item.endpoint, keys: { p256dh: item.p256dh, auth: item.auth_key } }, JSON.stringify({ title: 'Fiometra · Avisos del día', body: alerts.join(' '), url: '/' }));
      await rest('push_subscriptions', 'id=eq.' + item.id, { method: 'PATCH', body: JSON.stringify({ last_notified_on: today, updated_at: new Date().toISOString() }) });
      sent++;
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) await rest('push_subscriptions', 'id=eq.' + item.id, { method: 'DELETE' });
      else console.error(error);
    }
  }
  return response.status(200).json({ ok: true, sent });
}
