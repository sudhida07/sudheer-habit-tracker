// ============================================================
// Goal Tracker View
// ============================================================
import { GOAL_AREAS, DEFAULT_GOALS, TOP_PRIORITIES } from './data.js';

// ============================================================
// Helpers
// ============================================================

function getGoalArea(areaId) {
  return GOAL_AREAS.find(a => a.id === areaId) || { label: areaId, icon: '🎯', color: '#7c6bf5' };
}

function goalProgress(goal) {
  const filled = goal.steps.filter(s => s && s.trim()).length;
  if (filled === 0) return 0;
  const done = goal.stepsCompleted.filter((c, i) => c && goal.steps[i] && goal.steps[i].trim()).length;
  return Math.round((done / filled) * 100);
}

function statusLabel(s) {
  if (s === 'completed')   return { text: '✅ Completed',   color: '#10b981', bg: 'rgba(16,185,129,0.12)' };
  if (s === 'in_progress') return { text: '⏳ In Progress', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };
  return                          { text: '○ Not Started',  color: '#6b6b85', bg: 'rgba(107,107,133,0.10)' };
}

function formatDeadline(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

function daysLeft(d) {
  if (!d) return null;
  const diff = new Date(d) - new Date();
  const days = Math.ceil(diff / 86400000);
  if (days < 0)  return { text: `${Math.abs(days)}d overdue`, color: '#ef4444' };
  if (days === 0) return { text: 'Due today!',  color: '#f59e0b' };
  if (days <= 30) return { text: `${days}d left`, color: '#f59e0b' };
  const months = Math.round(days / 30);
  if (months < 12) return { text: `${months}mo left`, color: '#a0a0b8' };
  return { text: `${Math.round(months/12)}yr left`, color: '#a0a0b8' };
}

// ============================================================
// Main Render
// ============================================================

export function renderGoals(container, state, callbacks) {
  const goals = state.data.goals || DEFAULT_GOALS.map(g => ({...g, steps:[...g.steps], stepsCompleted:[...g.stepsCompleted]}));
  state.data.goals = goals;

  const priorities = state.data.priorities != null ? state.data.priorities : TOP_PRIORITIES.map(t => ({ text: t, done: false }));
  state.data.priorities = priorities;

  // Overall stats
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const inProgressGoals = goals.filter(g => g.status === 'in_progress').length;
  const overallPct = totalGoals ? Math.round((completedGoals / totalGoals) * 100) : 0;

  // Area summary
  const areaSummary = GOAL_AREAS.map(area => {
    const areaGoals = goals.filter(g => g.area === area.id);
    const achieved  = areaGoals.filter(g => g.status === 'completed').length;
    const avgProg   = areaGoals.length ? Math.round(areaGoals.reduce((s,g) => s + goalProgress(g), 0) / areaGoals.length) : 0;
    return { ...area, total: areaGoals.length, achieved, avgProg };
  });

  container.innerHTML = `
    <div class="view-header">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <h1 class="view-title">🏆 Goal Tracker</h1>
          <p class="view-subtitle">Track your life goals across 5 key areas</p>
        </div>
        <button class="add-goal-btn" id="addGoalBtn">+ Add Goal</button>
      </div>
    </div>
    <div class="view-body">

      <!-- ── Overview Strip ── -->
      <div class="goals-overview">
        <div class="goals-overview-left">
          <div class="goals-ring-wrap">
            ${renderRing(overallPct, '#7c6bf5')}
            <div class="goals-ring-label">${overallPct}%</div>
          </div>
          <div>
            <div style="font-size:22px;font-weight:800;letter-spacing:-0.5px">${completedGoals} / ${totalGoals}</div>
            <div style="font-size:13px;color:var(--text2);margin-bottom:6px">Goals achieved</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <span class="goal-stat-pill" style="background:rgba(16,185,129,0.12);color:#10b981">✅ ${completedGoals} done</span>
              <span class="goal-stat-pill" style="background:rgba(245,158,11,0.12);color:#f59e0b">⏳ ${inProgressGoals} in progress</span>
              <span class="goal-stat-pill" style="background:rgba(107,107,133,0.10);color:#a0a0b8">○ ${totalGoals - completedGoals - inProgressGoals} not started</span>
            </div>
          </div>
        </div>

        <!-- Area summary table -->
        <div class="goals-area-table">
          <div class="goals-area-header">
            <span>Category</span><span>Achieved</span><span>Progress</span>
          </div>
          ${areaSummary.map(a => `
            <div class="goals-area-row">
              <span style="display:flex;align-items:center;gap:6px">
                <span>${a.icon}</span>
                <span style="font-size:13px;font-weight:500">${a.label}</span>
              </span>
              <span style="font-size:13px;color:var(--text2)">${a.achieved} / ${Math.max(a.total,1)}</span>
              <span style="display:flex;align-items:center;gap:8px;flex:1">
                <div style="flex:1;background:var(--bg3);border-radius:100px;height:5px;overflow:hidden">
                  <div style="height:5px;width:${a.avgProg}%;background:${a.color};border-radius:100px;transition:width 0.5s"></div>
                </div>
                <span style="font-size:12px;color:${a.color};font-weight:600;width:36px;text-align:right">${a.avgProg}%</span>
              </span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- ── Top Priorities ── -->
      <div class="card" style="margin-bottom:20px">
        <div class="card-title">⭐ Top Priorities</div>
        <div class="priorities-list" id="prioritiesList">
          ${priorities.map((p, i) => `
            <div class="priority-row ${p.done ? 'done' : ''}" data-idx="${i}">
              <div class="priority-check">${p.done ? '✓' : ''}</div>
              <span class="priority-text">${p.text}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- ── Goal Cards ── -->
      <div class="goals-cards-grid" id="goalsGrid">
        ${goals.map((g, i) => renderGoalCard(g, i)).join('')}
      </div>

    </div>

    <!-- ── Add / Edit Goal Modal ── -->
    <div class="goal-modal-overlay" id="goalModalOverlay" style="display:none">
      <div class="goal-modal" id="goalModal">
        <div class="goal-modal-header">
          <h2 class="goal-modal-title" id="modalTitle">Add New Goal</h2>
          <button class="goal-modal-close" id="modalClose">✕</button>
        </div>
        <div class="goal-modal-body" id="modalBody">
          <!-- filled dynamically -->
        </div>
      </div>
    </div>
  `;

  // ── Wire up events ──

  // Priorities
  container.querySelectorAll('.priority-row').forEach(row => {
    row.addEventListener('click', () => {
      const idx = parseInt(row.dataset.idx);
      state.data.priorities[idx].done = !state.data.priorities[idx].done;
      callbacks.save();
      callbacks.rerender();
    });
  });

  // Step checkboxes on goal cards
  container.querySelectorAll('.step-check-row').forEach(row => {
    row.addEventListener('click', () => {
      const gi = parseInt(row.dataset.goalIdx);
      const si = parseInt(row.dataset.stepIdx);
      state.data.goals[gi].stepsCompleted[si] = !state.data.goals[gi].stepsCompleted[si];
      // Auto-update status
      const prog = goalProgress(state.data.goals[gi]);
      if (prog === 100) state.data.goals[gi].status = 'completed';
      else if (prog > 0) state.data.goals[gi].status = 'in_progress';
      callbacks.save();
      callbacks.rerender();
    });
  });

  // Status cycle on goal cards
  container.querySelectorAll('.goal-status-badge').forEach(badge => {
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      const gi = parseInt(badge.dataset.goalIdx);
      const statuses = ['not_started', 'in_progress', 'completed'];
      const cur = state.data.goals[gi].status;
      const next = statuses[(statuses.indexOf(cur) + 1) % statuses.length];
      state.data.goals[gi].status = next;
      callbacks.save();
      callbacks.rerender();
    });
  });

  // Edit goal button
  container.querySelectorAll('.goal-edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const gi = parseInt(btn.dataset.goalIdx);
      openGoalModal(container, state, gi, callbacks);
    });
  });

  // Delete goal button
  container.querySelectorAll('.goal-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const gi = parseInt(btn.dataset.goalIdx);
      if (confirm(`Delete goal "${state.data.goals[gi].title}"?`)) {
        state.data.goals.splice(gi, 1);
        callbacks.save();
        callbacks.rerender();
      }
    });
  });

  // Add goal
  container.querySelector('#addGoalBtn')?.addEventListener('click', () => {
    openGoalModal(container, state, null, callbacks);
  });

  // Modal close
  container.querySelector('#modalClose')?.addEventListener('click', () => closeModal(container));
  container.querySelector('#goalModalOverlay')?.addEventListener('click', (e) => {
    if (e.target === container.querySelector('#goalModalOverlay')) closeModal(container);
  });
}

// ============================================================
// Goal Card
// ============================================================

function renderGoalCard(g, goalIdx) {
  const area   = getGoalArea(g.area);
  const prog   = goalProgress(g);
  const status = statusLabel(g.status);
  const dl     = daysLeft(g.deadline);
  const filledSteps = g.steps.map((s, i) => ({ text: s, done: g.stepsCompleted[i], idx: i })).filter(s => s.text && s.text.trim());

  return `
    <div class="goal-card" data-goal-idx="${goalIdx}">
      <!-- Card header -->
      <div class="goal-card-header" style="border-left: 4px solid ${area.color}">
        <div style="flex:1;min-width:0">
          <div class="goal-area-tag" style="color:${area.color};background:${area.color}18">
            ${area.icon} ${area.label}
          </div>
          <div class="goal-title">${g.title || 'Untitled Goal'}</div>
          ${g.reward ? `<div class="goal-reward">🎁 ${g.reward}</div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0">
          <div class="goal-card-actions">
            <button class="goal-edit-btn icon-btn" data-goal-idx="${goalIdx}" title="Edit">✏️</button>
            <button class="goal-delete-btn icon-btn" data-goal-idx="${goalIdx}" title="Delete">🗑️</button>
          </div>
          <div class="goal-status-badge" data-goal-idx="${goalIdx}" style="background:${status.bg};color:${status.color}" title="Click to change status">
            ${status.text}
          </div>
        </div>
      </div>

      <!-- Progress bar -->
      <div style="padding:0 16px 12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="font-size:12px;color:var(--text3)">Progress</span>
          <span style="font-size:13px;font-weight:700;color:${area.color}">${prog}%</span>
        </div>
        <div class="goal-progress-track">
          <div class="goal-progress-fill" style="width:${prog}%;background:${area.color}"></div>
        </div>
      </div>

      <!-- Deadline -->
      ${g.deadline ? `
        <div class="goal-deadline-row">
          <span style="font-size:12px;color:var(--text3)">🗓️ Deadline: ${formatDeadline(g.deadline)}</span>
          ${dl ? `<span style="font-size:11px;font-weight:600;color:${dl.color}">${dl.text}</span>` : ''}
        </div>
      ` : ''}

      <!-- Steps -->
      ${filledSteps.length > 0 ? `
        <div class="goal-steps">
          <div style="font-size:11px;font-weight:600;letter-spacing:0.5px;color:var(--text3);text-transform:uppercase;margin-bottom:8px">
            Steps to reach goal (${filledSteps.filter(s=>s.done).length}/${filledSteps.length})
          </div>
          ${filledSteps.map(s => `
            <div class="step-check-row ${s.done ? 'done' : ''}" data-goal-idx="${goalIdx}" data-step-idx="${s.idx}">
              <div class="step-check">${s.done ? '✓' : ''}</div>
              <span class="step-label">${s.text}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

// ============================================================
// SVG Ring
// ============================================================

function renderRing(pct, color) {
  const r = 32, circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return `<svg width="80" height="80" viewBox="0 0 70 70">
    <circle fill="none" stroke="var(--bg3)" stroke-width="7" cx="35" cy="35" r="${r}"/>
    <circle fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round"
      cx="35" cy="35" r="${r}"
      stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
      transform="rotate(-90 35 35)" style="transition:stroke-dashoffset 0.5s ease"/>
  </svg>`;
}

// ============================================================
// Add / Edit Modal
// ============================================================

function openGoalModal(container, state, goalIdx, callbacks) {
  const isEdit = goalIdx !== null;
  const g = isEdit ? state.data.goals[goalIdx] : {
    id: 'goal_' + Date.now(),
    area: 'finances', title: '', reward: '', status: 'not_started',
    deadline: '', steps: Array(8).fill(''), stepsCompleted: Array(8).fill(false),
  };

  container.querySelector('#modalTitle').textContent = isEdit ? 'Edit Goal' : 'Add New Goal';

  const areaOptions = GOAL_AREAS.map(a =>
    `<option value="${a.id}" ${g.area === a.id ? 'selected' : ''}>${a.icon} ${a.label}</option>`
  ).join('');

  const stepsHTML = g.steps.map((s, i) => `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <span style="font-size:12px;color:var(--text3);width:16px;text-align:center">${i+1}</span>
      <input class="modal-input step-input" type="text" placeholder="Step ${i+1}" value="${s || ''}" data-step="${i}" />
    </div>
  `).join('');

  container.querySelector('#modalBody').innerHTML = `
    <div class="modal-field">
      <label class="modal-label">Area of Life</label>
      <select class="modal-input" id="mArea">${areaOptions}</select>
    </div>
    <div class="modal-field">
      <label class="modal-label">Goal Title</label>
      <input class="modal-input" id="mTitle" type="text" placeholder="e.g. Became a Millioner" value="${g.title || ''}"/>
    </div>
    <div class="modal-field">
      <label class="modal-label">Reward 🎁</label>
      <input class="modal-input" id="mReward" type="text" placeholder="e.g. Go on a weekend getaway" value="${g.reward || ''}"/>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="modal-field">
        <label class="modal-label">Status</label>
        <select class="modal-input" id="mStatus">
          <option value="not_started" ${g.status==='not_started'?'selected':''}>○ Not Started</option>
          <option value="in_progress" ${g.status==='in_progress'?'selected':''}>⏳ In Progress</option>
          <option value="completed"   ${g.status==='completed'?'selected':''}>✅ Completed</option>
        </select>
      </div>
      <div class="modal-field">
        <label class="modal-label">Deadline</label>
        <input class="modal-input" id="mDeadline" type="date" value="${g.deadline || ''}"/>
      </div>
    </div>
    <div class="modal-field">
      <label class="modal-label">Steps to Reach Goal</label>
      <div id="stepsWrap">${stepsHTML}</div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
      <button class="modal-cancel-btn" id="modalCancel">Cancel</button>
      <button class="modal-save-btn" id="modalSave">${isEdit ? 'Save Changes' : 'Add Goal'}</button>
    </div>
  `;

  container.querySelector('#goalModalOverlay').style.display = 'flex';

  container.querySelector('#modalCancel').addEventListener('click', () => closeModal(container));

  container.querySelector('#modalSave').addEventListener('click', () => {
    const newSteps = Array.from(container.querySelectorAll('.step-input')).map(i => i.value.trim());
    const updated = {
      ...g,
      area:     container.querySelector('#mArea').value,
      title:    container.querySelector('#mTitle').value.trim() || 'Untitled Goal',
      reward:   container.querySelector('#mReward').value.trim(),
      status:   container.querySelector('#mStatus').value,
      deadline: container.querySelector('#mDeadline').value,
      steps:    newSteps,
      stepsCompleted: isEdit ? g.stepsCompleted : Array(8).fill(false),
    };
    if (isEdit) {
      state.data.goals[goalIdx] = updated;
    } else {
      state.data.goals.push(updated);
    }
    callbacks.save();
    closeModal(container);
    callbacks.rerender();
  });
}

function closeModal(container) {
  container.querySelector('#goalModalOverlay').style.display = 'none';
}
