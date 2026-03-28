// ============================================================
// Dashboard View
// ============================================================
import {
  DAILY_HABITS, WEEKLY_HABITS, MONTHLY_GOALS,
  getMonthStats, getDayCompletionRate, today, dateKey, daysInMonth
} from './data.js';

export function renderDashboard(container, state) {
  const { year, month } = state.currentMonth;
  const t = today();
  const stats = getMonthStats(state.data.daily, year, month);

  // Count today's habits
  const todayKey = dateKey(t.year, t.month, t.day);
  const todayData = state.data.daily[todayKey] || {};
  const todayDone = DAILY_HABITS.filter(h => todayData[h.id]).length;

  // Week stats
  const wk = state.currentWeekKey;
  const weekData = state.data.weekly[wk] || {};
  const weekDone = WEEKLY_HABITS.filter(h => weekData[h.id]).length;

  // Month goals
  const mk = state.currentMonthKey;
  const monthData = state.data.monthly[mk] || {};
  const monthDone = MONTHLY_GOALS.filter(g => monthData[g.id]).length;

  // Top habits by frequency
  const topHabits = computeTopHabits(state.data.daily, year, month);

  const monthName = new Date(year, month-1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  container.innerHTML = `
    <div class="view-header">
      <h1 class="view-title">📊 Dashboard</h1>
      <p class="view-subtitle">${monthName} — Your habit journey at a glance</p>
    </div>
    <div class="view-body">

      <!-- Stat cards -->
      <div class="stats-grid">
        <div class="stat-card" style="--color: var(--accent)">
          <div class="stat-icon">📅</div>
          <div class="stat-label">Monthly Completion</div>
          <div class="stat-value">${stats.overall}%</div>
          <div class="stat-sub">${stats.trackedDays} days tracked</div>
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill" style="width:${stats.overall}%"></div>
          </div>
        </div>

        <div class="stat-card" style="--color: var(--green)">
          <div class="stat-icon">☀️</div>
          <div class="stat-label">Today's Progress</div>
          <div class="stat-value">${todayDone}</div>
          <div class="stat-sub">of ${DAILY_HABITS.length} habits done</div>
          <div class="progress-bar-wrap" style="--color: var(--green)">
            <div class="progress-bar-fill" style="width:${Math.round(todayDone/DAILY_HABITS.length*100)}%; background: var(--green)"></div>
          </div>
        </div>

        <div class="stat-card" style="--color: var(--yellow)">
          <div class="stat-icon">📆</div>
          <div class="stat-label">Weekly Habits</div>
          <div class="stat-value">${weekDone}/${WEEKLY_HABITS.length}</div>
          <div class="stat-sub">this week</div>
          <div class="progress-bar-wrap" style="--color: var(--yellow)">
            <div class="progress-bar-fill" style="width:${Math.round(weekDone/WEEKLY_HABITS.length*100)}%; background: var(--yellow)"></div>
          </div>
        </div>

        <div class="stat-card" style="--color: var(--cyan)">
          <div class="stat-icon">🎯</div>
          <div class="stat-label">Monthly Goals</div>
          <div class="stat-value">${monthDone}/${MONTHLY_GOALS.length}</div>
          <div class="stat-sub">completed this month</div>
          <div class="progress-bar-wrap" style="--color: var(--cyan)">
            <div class="progress-bar-fill" style="width:${Math.round(monthDone/MONTHLY_GOALS.length*100)}%; background: var(--cyan)"></div>
          </div>
        </div>
      </div>

      <!-- Bar chart + Top Habits -->
      <div class="dashboard-grid">
        <div class="card">
          <div class="card-title">Daily Completion — ${monthName}</div>
          <div class="chart-wrap">
            ${renderBarChart(stats.dailyRates)}
          </div>
        </div>

        <div class="card">
          <div class="card-title">🏆 Top Consistent Habits</div>
          <div class="top-habits-list">
            ${topHabits.map(h => `
              <div class="top-habit-item">
                <div class="top-habit-icon">${h.icon}</div>
                <div class="top-habit-info">
                  <div class="top-habit-name">${h.label}</div>
                  <div class="top-habit-bar-wrap">
                    <div class="top-habit-bar" style="width:${h.pct}%"></div>
                  </div>
                </div>
                <div class="top-habit-pct">${h.pct}%</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Heatmap -->
      <div class="card">
        <div class="card-title">📅 Calendar Heatmap — ${monthName}</div>
        ${renderHeatmap(state.data.daily, year, month)}
        <div class="heatmap-legend">
          <span>Less</span>
          <div class="legend-box" style="background:#1a1a24"></div>
          <div class="legend-box" style="background:#166534"></div>
          <div class="legend-box" style="background:#16a34a"></div>
          <div class="legend-box" style="background:#22c55e"></div>
          <div class="legend-box" style="background:#4ade80"></div>
          <span>More</span>
        </div>
      </div>

    </div>
  `;
}

function renderBarChart(dailyRates) {
  const W = 500, H = 140, padL = 30, padB = 22, barW = Math.max(4, Math.floor((W - padL) / dailyRates.length) - 2);
  const maxRate = 100;

  const bars = dailyRates.map((d, i) => {
    if (d.rate === null) return '';
    const x = padL + i * ((W - padL) / dailyRates.length) + 1;
    const barH = Math.max(2, (d.rate / maxRate) * (H - padB - 8));
    const y = H - padB - barH;
    const col = d.rate >= 80 ? '#4ade80' : d.rate >= 50 ? '#7c6bf5' : d.rate >= 30 ? '#f59e0b' : '#ef4444';
    return `<rect class="chart-bar" x="${x}" y="${y}" width="${barW}" height="${barH}" rx="3" fill="${col}" opacity="0.85">
      <title>Day ${d.day}: ${d.rate}%</title>
    </rect>`;
  }).join('');

  // X axis labels (every 5 days)
  const xLabels = dailyRates.filter(d => d.day % 5 === 0).map(d => {
    const x = padL + (d.day - 1) * ((W - padL) / dailyRates.length) + barW / 2;
    return `<text class="chart-label" x="${x}" y="${H - 6}" text-anchor="middle">${d.day}</text>`;
  }).join('');

  // Y axis labels
  const yLabels = [0, 25, 50, 75, 100].map(v => {
    const y = H - padB - (v / maxRate) * (H - padB - 8);
    return `<text class="chart-label" x="${padL - 5}" y="${y + 4}" text-anchor="end">${v}</text>
    <line x1="${padL}" y1="${y}" x2="${W}" y2="${y}" stroke="var(--border)" stroke-width="1" opacity="0.5"/>`;
  }).join('');

  return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" style="height:${H}px">
    ${yLabels}
    ${bars}
    ${xLabels}
  </svg>`;
}

function renderHeatmap(dailyData, year, month) {
  const days = daysInMonth(year, month);
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const headers = dayNames.map(d => `<div class="heatmap-day-label">${d}</div>`).join('');
  const empties = Array.from({length: firstDay}, () => `<div class="heatmap-cell empty"></div>`).join('');

  const cells = [];
  for (let d = 1; d <= days; d++) {
    const rate = getDayCompletionRate(dailyData, year, month, d);
    let tier = '0', tooltip = `Day ${d}: No data`;
    if (rate !== null) {
      if (rate >= 90) tier = '5';
      else if (rate >= 70) tier = '4';
      else if (rate >= 50) tier = '3';
      else if (rate >= 30) tier = '2';
      else tier = '1';
      tooltip = `Day ${d}: ${rate}%`;
    }
    const isToday = (new Date().getDate() === d && new Date().getMonth() + 1 === month && new Date().getFullYear() === year);
    const style = isToday ? 'outline: 2px solid var(--accent); outline-offset: 1px;' : '';
    cells.push(`<div class="heatmap-cell" data-rate="${rate !== null ? tier : '0'}" title="${tooltip}" style="${style}">${d}</div>`);
  }

  return `<div class="heatmap-grid">${headers}${empties}${cells.join('')}</div>`;
}

function computeTopHabits(dailyData, year, month) {
  const counts = {};
  DAILY_HABITS.forEach(h => { counts[h.id] = 0; });
  let tracked = 0;

  const days = daysInMonth(year, month);
  for (let d = 1; d <= days; d++) {
    const key = dateKey(year, month, d);
    if (dailyData[key]) {
      tracked++;
      DAILY_HABITS.forEach(h => {
        if (dailyData[key][h.id]) counts[h.id]++;
      });
    }
  }

  if (tracked === 0) return DAILY_HABITS.slice(0, 7).map(h => ({ ...h, pct: 0 }));

  return DAILY_HABITS
    .map(h => ({ ...h, pct: Math.round((counts[h.id] / tracked) * 100) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 7);
}
