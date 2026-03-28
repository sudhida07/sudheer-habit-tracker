// ============================================================
// Weekly Habits View
// ============================================================
import { WEEKLY_HABITS } from './data.js';

export function renderWeekly(container, state, onToggle, onNavigate) {
  const wk = state.currentWeekKey;
  const weekData = state.data.weekly[wk] || {};
  const done = WEEKLY_HABITS.filter(h => weekData[h.id]).length;
  const pct = Math.round((done / WEEKLY_HABITS.length) * 100);

  // Parse week number for display
  const [yr, wNum] = wk.split('-W');
  const weekLabel = `Week ${parseInt(wNum)}, ${yr}`;

  // Get week date range
  const range = getWeekRange(wk);

  container.innerHTML = `
    <div class="view-header">
      <h1 class="view-title">📆 Weekly Habits</h1>
      <p class="view-subtitle">10 habits to keep your week on track</p>
    </div>
    <div class="view-body">

      <!-- Week navigator -->
      <div class="week-nav">
        <button class="nav-btn" id="prevWeek">‹</button>
        <div class="date-display" style="flex:1;text-align:center">
          <div class="date-display-main">${weekLabel}</div>
          <div class="date-display-sub">${range}</div>
        </div>
        <button class="nav-btn" id="nextWeek">›</button>
      </div>

      <!-- Week progress bar -->
      <div class="week-stats-bar">
        <div class="week-pct">${pct}%</div>
        <div class="week-detail" style="flex:1">
          <div class="week-title">${done} of ${WEEKLY_HABITS.length} weekly habits completed</div>
          <div class="progress-bar-wrap" style="--color: var(--green); height: 8px">
            <div class="progress-bar-fill" style="width:${pct}%; background: var(--green); height: 8px"></div>
          </div>
          <div style="font-size:12px;color:var(--text3);margin-top:6px">
            ${pct >= 80 ? '🌟 Outstanding week!' : pct >= 60 ? '💪 Great progress!' : pct >= 40 ? '📈 Keep going!' : done > 0 ? '🌱 Building momentum...' : '📋 Check off habits as you complete them'}
          </div>
        </div>
      </div>

      <!-- Habit cards -->
      <div class="week-grid">
        ${WEEKLY_HABITS.map(h => {
          const isDone = !!weekData[h.id];
          return `
            <div class="weekly-habit-card ${isDone ? 'done' : ''}" data-id="${h.id}">
              <div class="weekly-icon-wrap">${h.icon}</div>
              <div class="weekly-habit-info">
                <div class="weekly-habit-name">${h.label}</div>
                <div class="weekly-habit-day">📅 ${h.day}</div>
              </div>
              <div class="weekly-check">${isDone ? '✓' : ''}</div>
            </div>
          `;
        }).join('')}
      </div>

    </div>
  `;

  // Wire up events
  container.querySelectorAll('.weekly-habit-card').forEach(card => {
    card.addEventListener('click', () => onToggle('weekly', card.dataset.id, wk));
  });

  container.querySelector('#prevWeek')?.addEventListener('click', () => onNavigate('week', -1));
  container.querySelector('#nextWeek')?.addEventListener('click', () => onNavigate('week', +1));
}

function getWeekRange(wk) {
  // ISO week to date range
  const [yr, wNum] = wk.split('-W').map(Number);
  // Jan 4th is always in week 1 of its year
  const jan4 = new Date(yr, 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1);
  const start = new Date(startOfWeek1);
  start.setDate(startOfWeek1.getDate() + (wNum - 1) * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = d => d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}
