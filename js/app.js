// ============================================================
// Sudheer's Habit Tracker — Main App Controller
// ============================================================
import {
  loadData, saveData, today, dateKey, weekKey, monthKey, daysInMonth
} from './data.js';
import { renderDashboard } from './dashboard.js';
import { renderDaily }     from './daily.js';
import { renderWeekly }    from './weekly.js';
import { renderMonthly }   from './monthly.js';
import { renderGoals }     from './goals.js';

// ============================================================
// State
// ============================================================

const t = today();

const state = {
  activeView: 'dashboard',
  data: loadData(),
  currentDay: { year: t.year, month: t.month, day: t.day },
  currentWeekKey: weekKey(new Date()),
  currentMonthKey: monthKey(t.year, t.month),
  currentMonth: { year: t.year, month: t.month },
};

// ============================================================
// View Management
// ============================================================

const views = document.querySelectorAll('.view');
const navItems = document.querySelectorAll('.nav-item');

function switchView(viewName) {
  state.activeView = viewName;

  views.forEach(v => v.classList.remove('active'));
  navItems.forEach(n => n.classList.remove('active'));

  document.getElementById(`view-${viewName}`)?.classList.add('active');
  document.querySelector(`.nav-item[data-view="${viewName}"]`)?.classList.add('active');

  renderCurrentView();
  closeSidebar();
}

function renderCurrentView() {
  switch (state.activeView) {
    case 'dashboard':
      renderDashboard(document.getElementById('view-dashboard'), state);
      break;
    case 'daily':
      renderDaily(
        document.getElementById('view-daily'), state,
        onToggle, onNavigate
      );
      break;
    case 'weekly':
      renderWeekly(
        document.getElementById('view-weekly'), state,
        onToggle, onNavigate
      );
      break;
    case 'monthly':
      renderMonthly(
        document.getElementById('view-monthly'), state,
        onToggle, onNavigate
      );
      break;
    case 'goals':
      renderGoals(
        document.getElementById('view-goals'), state,
        {
          save: () => saveData(state.data),
          rerender: () => renderCurrentView(),
        }
      );
      break;
  }
}

// ============================================================
// Toggle Habit / Goal
// ============================================================

function onToggle(type, id, key) {
  if (type === 'daily') {
    if (!state.data.daily[key]) state.data.daily[key] = {};
    state.data.daily[key][id] = !state.data.daily[key][id];
  } else if (type === 'weekly') {
    if (!state.data.weekly[key]) state.data.weekly[key] = {};
    state.data.weekly[key][id] = !state.data.weekly[key][id];
  } else if (type === 'monthly') {
    if (!state.data.monthly[key]) state.data.monthly[key] = {};
    state.data.monthly[key][id] = !state.data.monthly[key][id];
  }

  saveData(state.data);
  renderCurrentView();
  showToast(state.data[type]?.[key]?.[id] ? '✅ Marked as done!' : '↩️ Marked as incomplete');
}

// ============================================================
// Navigation (day / week / month)
// ============================================================

function onNavigate(unit, delta) {
  if (unit === 'today') {
    const t2 = today();
    state.currentDay = { year: t2.year, month: t2.month, day: t2.day };

  } else if (unit === 'day') {
    const { year, month, day } = state.currentDay;
    const d = new Date(year, month - 1, day + delta);
    state.currentDay = { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };

  } else if (unit === 'week') {
    const [yr, wn] = state.currentWeekKey.split('-W').map(Number);
    const d = new Date(yr, 0, 4); // Jan 4 = week 1
    d.setDate(d.getDate() - (d.getDay() || 7) + 1 + (wn - 1 + delta) * 7);
    state.currentWeekKey = weekKey(d);

  } else if (unit === 'month') {
    const [yr, mo] = state.currentMonthKey.split('-').map(Number);
    let nm = mo + delta, ny = yr;
    if (nm > 12) { nm = 1; ny++; }
    if (nm < 1)  { nm = 12; ny--; }
    state.currentMonthKey = monthKey(ny, nm);
    state.currentMonth = { year: ny, month: nm };
  }

  renderCurrentView();
}

// ============================================================
// Toast
// ============================================================

let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

// ============================================================
// Sidebar (mobile)
// ============================================================

function openSidebar() {
  document.querySelector('.sidebar').classList.add('open');
  document.querySelector('.sidebar-overlay').classList.add('open');
}

function closeSidebar() {
  document.querySelector('.sidebar').classList.remove('open');
  document.querySelector('.sidebar-overlay').classList.remove('open');
}

// ============================================================
// Init
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // Nav item click
  navItems.forEach(item => {
    item.addEventListener('click', () => switchView(item.dataset.view));
  });

  // Mobile hamburger
  document.querySelector('.hamburger')?.addEventListener('click', openSidebar);
  document.querySelector('.sidebar-overlay')?.addEventListener('click', closeSidebar);

  // Sidebar footer month badge
  const now = new Date();
  const badge = document.querySelector('.month-badge');
  if (badge) {
    badge.innerHTML = `
      <strong>${now.toLocaleString('en-IN', { month: 'long' })} ${now.getFullYear()}</strong>
      ${now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric' })}
    `;
  }

  // Initial render
  switchView('dashboard');
});
