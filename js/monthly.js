// ============================================================
// Monthly Goals View
// ============================================================
import { MONTHLY_GOALS } from './data.js';

const CATEGORIES = ['Bills', 'Maintenance', 'Health', 'Admin', 'Finance', 'Review'];

const CAT_META = {
  Bills:       { icon: '💳', color: '#ef4444' },
  Maintenance: { icon: '🔧', color: '#f59e0b' },
  Health:      { icon: '🏥', color: '#10b981' },
  Admin:       { icon: '📋', color: '#3b82f6' },
  Finance:     { icon: '📈', color: '#8b5cf6' },
  Review:      { icon: '🎯', color: '#06b6d4' },
};

export function renderMonthly(container, state, onToggle, onNavigate) {
  const mk = state.currentMonthKey;
  const monthData = state.data.monthly[mk] || {};
  const done = MONTHLY_GOALS.filter(g => monthData[g.id]).length;
  const pct = Math.round((done / MONTHLY_GOALS.length) * 100);

  // Parse month key for display
  const [yr, mo] = mk.split('-').map(Number);
  const monthName = new Date(yr, mo - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  // Group goals by category
  const grouped = {};
  MONTHLY_GOALS.forEach(g => {
    if (!grouped[g.category]) grouped[g.category] = [];
    grouped[g.category].push(g);
  });

  container.innerHTML = `
    <div class="view-header">
      <h1 class="view-title">🎯 Monthly Goals</h1>
      <p class="view-subtitle">12 goals to close out ${monthName} strong</p>
    </div>
    <div class="view-body">

      <!-- Month navigator -->
      <div class="week-nav">
        <button class="nav-btn" id="prevMonth">‹</button>
        <div class="date-display" style="flex:1;text-align:center">
          <div class="date-display-main">${monthName}</div>
        </div>
        <button class="nav-btn" id="nextMonth">›</button>
      </div>

      <!-- Month progress -->
      <div class="month-progress-summary">
        <div style="flex-shrink:0">
          <div style="font-size:48px;font-weight:900;color:var(--accent);letter-spacing:-2px;line-height:1">${pct}%</div>
          <div style="font-size:13px;color:var(--text3)">complete</div>
        </div>
        <div style="flex:1">
          <div style="font-size:16px;font-weight:600;margin-bottom:8px">${done} of ${MONTHLY_GOALS.length} goals achieved</div>
          <div class="progress-bar-wrap" style="height:10px">
            <div class="progress-bar-fill" style="width:${pct}%;height:10px"></div>
          </div>
          <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px">
            ${CATEGORIES.map(cat => {
              const catGoals = grouped[cat] || [];
              const catDone = catGoals.filter(g => monthData[g.id]).length;
              const m = CAT_META[cat];
              return `<span style="font-size:11px;padding:3px 10px;border-radius:100px;background:${m.color}18;border:1px solid ${m.color}40;color:${m.color}">${m.icon} ${cat} ${catDone}/${catGoals.length}</span>`;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Goals by category -->
      ${CATEGORIES.map(cat => {
        const goals = grouped[cat];
        if (!goals || goals.length === 0) return '';
        const m = CAT_META[cat];
        return `
          <div class="monthly-category-title" style="color:${m.color}">${m.icon} ${cat}</div>
          <div class="monthly-grid">
            ${goals.map(g => {
              const isDone = !!monthData[g.id];
              return `
                <div class="monthly-goal-card ${isDone ? 'done' : ''}" data-id="${g.id}">
                  <div class="monthly-icon">${g.icon}</div>
                  <div class="monthly-goal-info">
                    <div class="monthly-goal-name">${g.label}</div>
                  </div>
                  <div class="monthly-check">${isDone ? '✓' : ''}</div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }).join('')}

    </div>
  `;

  // Wire up events
  container.querySelectorAll('.monthly-goal-card').forEach(card => {
    card.addEventListener('click', () => onToggle('monthly', card.dataset.id, mk));
  });

  container.querySelector('#prevMonth')?.addEventListener('click', () => onNavigate('month', -1));
  container.querySelector('#nextMonth')?.addEventListener('click', () => onNavigate('month', +1));
}
