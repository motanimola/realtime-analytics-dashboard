(() => {
  const socket = io();
  const $ = (id) => document.getElementById(id);
  const labels = [];
  const counts = [];
  const typeNames = ['page_view', 'click', 'signup', 'purchase', 'api_call'];
  const typeColors = ['#6d9cff', '#a78bfa', '#45d6b0', '#f6b75e', '#f17c9c'];
  const activityChart = new Chart($('activity-chart'), {
    type: 'line', data: { labels, datasets: [{ label: 'Events', data: counts, borderColor: '#719cff', backgroundColor: 'rgba(113,156,255,.12)', fill: true, tension: .38, pointRadius: 2, pointBackgroundColor: '#9ab8ff', borderWidth: 2 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#71809a', maxTicksLimit: 8 }, grid: { display: false } }, y: { beginAtZero: true, ticks: { color: '#71809a', precision: 0 }, grid: { color: 'rgba(125,145,180,.1)' } } } }
  });
  const typeChart = new Chart($('type-chart'), {
    type: 'doughnut', data: { labels: typeNames, datasets: [{ data: [0,0,0,0,0], backgroundColor: typeColors, borderColor: '#111a2e', borderWidth: 4 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { position: 'bottom', labels: { color: '#aab6ca', boxWidth: 8, padding: 13, font: { size: 10 } } } } }
  });
  function renderSummary(summary) {
    $('total-events').textContent = summary.totalEvents.toLocaleString();
    $('active-users').textContent = summary.activeUsers.toLocaleString();
    $('purchases').textContent = summary.purchases.toLocaleString();
    $('revenue').textContent = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(summary.revenue);
    typeChart.data.datasets[0].data = typeNames.map((name) => summary.byType[name] || 0);
    typeChart.update('none');
  }
  function addFeedEvent(event) {
    const row = document.createElement('tr');
    const time = new Date(event.timestamp).toLocaleTimeString();
    [event.type, event.userId, event.page, time].forEach((value, index) => {
      const cell = document.createElement('td');
      cell.textContent = value;
      if (index === 0) cell.className = 'event-type';
      row.appendChild(cell);
    });
    $('event-feed').prepend(row);
    while ($('event-feed').children.length > 8) $('event-feed').lastElementChild.remove();
    $('feed-count').textContent = `${Math.min(Number($('feed-count').textContent || 0) + 1, 8)} shown`;
  }
  function recordActivity(event) {
    const time = new Date(event.timestamp).toLocaleTimeString();
    labels.push(time); counts.push(1);
    if (labels.length > 20) { labels.shift(); counts.shift(); }
    // Count events received in each displayed time bucket.
    activityChart.update('none');
    $('last-updated').textContent = `Updated ${time}`;
    addFeedEvent(event);
  }
  socket.on('analytics:init', ({ events, summary }) => {
    renderSummary(summary);
    $('event-feed').innerHTML = '';
    events.slice(0, 8).reverse().forEach(addFeedEvent);
    $('feed-count').textContent = `${Math.min(events.length, 8)} shown`;
    events.slice(0, 20).reverse().forEach((event) => { labels.push(new Date(event.timestamp).toLocaleTimeString()); counts.push(1); });
    activityChart.update('none');
  });
  socket.on('analytics:event', recordActivity);
  socket.on('analytics:summary', renderSummary);
})();
