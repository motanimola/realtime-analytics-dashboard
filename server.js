const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = Number(process.env.PORT || 3000);
const MAX_EVENTS = 100;
const events = [];
let totalEvents = 0;
let activeUsers = new Set();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function makeEvent() {
  const pages = ['/home', '/products', '/pricing', '/dashboard', '/checkout', '/about'];
  const countries = ['US', 'CA', 'GB', 'DE', 'IN', 'AU', 'NG'];
  const types = ['page_view', 'click', 'signup', 'purchase', 'api_call'];
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    userId: `user_${Math.floor(Math.random() * 250) + 1}`,
    type: types[Math.floor(Math.random() * types.length)],
    page: pages[Math.floor(Math.random() * pages.length)],
    country: countries[Math.floor(Math.random() * countries.length)],
    value: Math.random() > 0.85 ? Number((Math.random() * 150 + 10).toFixed(2)) : 0
  };
}

function summary() {
  const uniqueUsers = new Set(events.map((event) => event.userId)).size;
  const purchases = events.filter((event) => event.type === 'purchase');
  const revenue = purchases.reduce((sum, event) => sum + event.value, 0);
  const byType = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {});
  return { totalEvents, activeUsers: uniqueUsers, purchases: purchases.length, revenue: Number(revenue.toFixed(2)), byType };
}

function publishEvent(event) {
  events.unshift(event);
  if (events.length > MAX_EVENTS) events.pop();
  totalEvents += 1;
  io.emit('analytics:event', event);
  io.emit('analytics:summary', summary());
}

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.get('/api/summary', (_req, res) => res.json(summary()));
app.get('/api/events', (_req, res) => res.json(events));
app.post('/api/events', (req, res) => {
  const { userId, type, page, country, value } = req.body || {};
  if (!userId || !type || !page) {
    return res.status(400).json({ error: 'userId, type, and page are required' });
  }
  const event = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    userId: String(userId), type: String(type), page: String(page),
    country: String(country || 'US'), value: Number(value || 0)
  };
  publishEvent(event);
  return res.status(201).json(event);
});

io.on('connection', (socket) => {
  socket.emit('analytics:init', { events, summary: summary() });
  socket.on('disconnect', () => activeUsers.delete(socket.id));
  activeUsers.add(socket.id);
});

// Demo event stream. Replace this generator with a real event source in production.
setInterval(() => publishEvent(makeEvent()), 1200);

server.listen(PORT, '0.0.0.0', () => console.log(`Analytics dashboard listening on port ${PORT}`));
