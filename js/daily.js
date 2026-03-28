// ============================================================
// Daily Log View
// ============================================================
import {
  DAILY_HABITS, BLOCK_META, dateKey, formatDate, today, daysInMonth
} from './data.js';

export function renderDaily(container, state, onToggle, onNavigate) {
  const { year, month, day } = state.currentDay;
  const key = dateKey(year, month, day);
  const dayData = state.data.daily[key] || {};
  const t = today();
  const isToday = (year === t.year && month === t.month && day === t.day);

  // Group habits by block
  const blocks = {};
  DAILY_HABITS.forEach(h => {
    if (!blocks[h.block]) blocks[h.block] = [];
    blocks[h.block].push(h);
  });

  // Completion stats
  const totalDone = DAILY_HABITS.filter(h => dayData[h.id]).length;
  const totalAll = DAILY_HABITS.length;
  const pct = Math.round((totalDone / totalAll) * 100);
  const circumference = 201;
  const offset = circumference - (pct / 100) * circumference;

  // Block completion pills
  const blockPills = Object.entries(blocks).map(([blockName, habits]) => {
    const done = habits.filter(h => dayData[h.id]).length;
    const meta = BLOCK_META[blockName];
    return `<span class="block-pill" style="background:${meta.color}20; border-color:${meta.color}50; color:${meta.color}">${meta.emoji} ${done}/${habits.length}</span>`;
  }).join('');

  // Streak calculation
  const streak = calcStreak(state.data.daily, year, month, day);

  container.innerHTML = `
    <div class="view-header">
      <h1 class="view-title">📝 Daily Log</h1>
      <p class="view-subtitle">Track your 22 habits across 6 time blocks</p>
    </div>
    <div class="view-body">

      <!-- Date navigator -->
      <div class="date-nav">
        <button class="nav-btn" id="prevDay" title="Previous day">‹</button>
        <div class="date-display">
          <div class="date-display-main">${formatDate(year, month, day)}</div>
          <div class="date-display-sub">${isToday ? '✨ Today' : ''}</div>
        </div>
        <button class="nav-btn" id="nextDay" title="Next day">›</button>
        ${!isToday ? `<button class="today-btn" id="goToday">Today</button>` : ''}
      </div>

      <!-- Completion ring -->
      <div class="completion-summary">
        <div class="ring-wrap">
          <svg class="ring-svg" viewBox="0 0 70 70">
            <circle class="ring-track" cx="35" cy="35" r="32"/>
            <circle class="ring-fill" cx="35" cy="35" r="32" style="stroke-dashoffset:${offset}"/>
          </svg>
          <div class="ring-text">${pct}%</div>
        </div>
        <div class="completion-details">
          <div class="completion-big">${totalDone} / ${totalAll} Habits</div>
          <div class="completion-sub">
            ${pct >= 80 ? '🔥 Excellent day! Keep it up!' : pct >= 50 ? '💪 Good progress, keep going!' : pct > 0 ? '🌱 Great start, keep building!' : '📌 Click habits to mark them done'}
            ${streak > 1 ? `&nbsp; <span class="streak-badge">🔥 ${streak} day streak</span>` : ''}
          </div>
          <div class="block-pills">${blockPills}</div>
        </div>
      </div>

      <!-- Time Blocks -->
      ${Object.entries(blocks).map(([blockName, habits]) => {
        const meta = BLOCK_META[blockName];
        const done = habits.filter(h => dayData[h.id]).length;
        return `
          <div class="time-block" id="block-${blockName.replace(/\s+/g, '-')}">
            <div class="time-block-header" onclick="toggleBlock(this)">
              <div class="block-title-wrap">
                <div class="block-dot" style="background:${meta.color}"></div>
                <div>
                  <div class="block-name">${meta.emoji} ${blockName}</div>
                  <div class="block-time">${meta.time}</div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:10px">
                <div class="block-count" style="color:${done === habits.length ? meta.color : 'var(--text3)'}">${done}/${habits.length}</div>
                <div class="block-chevron">▾</div>
              </div>
            </div>
            <div class="habit-list" style="background:${meta.bg}08">
              ${habits.map(h => renderHabitRow(h, dayData[h.id])).join('')}
            </div>
          </div>
        `;
      }).join('')}

    </div>
  `;

  // Wire up events
  container.querySelectorAll('.habit-row').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.dataset.id;
      onToggle('daily', id, key);
    });
  });

  container.querySelector('#prevDay')?.addEventListener('click', () => {
    onNavigate('day', -1);
  });

  container.querySelector('#nextDay')?.addEventListener('click', () => {
    onNavigate('day', +1);
  });

  container.querySelector('#goToday')?.addEventListener('click', () => {
    onNavigate('today');
  });
}

function renderHabitRow(habit, isDone) {
  return `
    <div class="habit-row ${isDone ? 'done' : ''}" data-id="${habit.id}">
      <div class="habit-checkbox">${isDone ? '✓' : ''}</div>
      <span class="habit-emoji">${habit.icon}</span>
      <span class="habit-label">${habit.label}</span>
    </div>
  `;
}

function calcStreak(dailyData, year, month, day) {
  let streak = 0;
  let d = new Date(year, month - 1, day);

  while (true) {
    const k = dateKey(d.getFullYear(), d.getMonth() + 1, d.getDate());
    const data = dailyData[k];
    if (!data) break;
    const done = DAILY_HABITS.filter(h => data[h.id]).length;
    if (done === 0) break;
    streak++;
    d.setDate(d.getDate() - 1);
    if (streak > 365) break;
  }
  return streak;
}

// Global for inline onclick (block collapse toggle)
window.toggleBlock = function(header) {
  const block = header.closest('.time-block');
  block.classList.toggle('collapsed');
};
