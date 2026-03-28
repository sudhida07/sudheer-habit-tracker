// ============================================================
// Sudheer's Habit Tracker — Data & Storage
// ============================================================

export const DAILY_HABITS = [
  // --- Morning Routine ---
  { id: 'wake_on_time',     block: 'Morning Routine',          label: 'Wake Up On Time',         icon: '🌅' },
  { id: 'meditation',       block: 'Morning Routine',          label: 'Meditation / Mindfulness', icon: '🧘' },
  { id: 'morning_exercise', block: 'Morning Routine',          label: 'Morning Exercise',         icon: '🏃' },
  { id: 'healthy_breakfast',block: 'Morning Routine',          label: 'Healthy Breakfast',        icon: '🥣' },
  { id: 'morning_journal',  block: 'Morning Routine',          label: 'Morning Journaling',       icon: '📓' },

  // --- Productivity Hours ---
  { id: 'deep_work_1',      block: 'Productivity Hours',       label: 'Deep Work Session 1',      icon: '💻' },
  { id: 'email_messages',   block: 'Productivity Hours',       label: 'Email & Messages',         icon: '📬' },
  { id: 'learning',         block: 'Productivity Hours',       label: 'Learning / Upskilling',    icon: '📚' },
  { id: 'task_planning',    block: 'Productivity Hours',       label: 'Task Planning',            icon: '📋' },

  // --- Lunch Break ---
  { id: 'healthy_lunch',    block: 'Lunch Break',              label: 'Healthy Lunch',            icon: '🥗' },
  { id: 'lunch_walk',       block: 'Lunch Break',              label: 'Short Walk',               icon: '🚶' },
  { id: 'power_nap',        block: 'Lunch Break',              label: 'Power Nap / Rest',         icon: '😴' },

  // --- Afternoon Productivity ---
  { id: 'deep_work_2',      block: 'Afternoon Productivity',   label: 'Deep Work Session 2',      icon: '⚡' },
  { id: 'reading',          block: 'Afternoon Productivity',   label: 'Reading',                  icon: '📖' },
  { id: 'side_project',     block: 'Afternoon Productivity',   label: 'Side Project Work',        icon: '🛠️' },
  { id: 'review_progress',  block: 'Afternoon Productivity',   label: 'Review Progress',          icon: '✅' },

  // --- Evening Activities ---
  { id: 'evening_exercise', block: 'Evening Activities',       label: 'Evening Exercise / Gym',   icon: '🏋️' },
  { id: 'cook_dinner',      block: 'Evening Activities',       label: 'Cook / Healthy Dinner',    icon: '🍳' },
  { id: 'social_family',    block: 'Evening Activities',       label: 'Social / Family Time',     icon: '👥' },
  { id: 'evening_walk',     block: 'Evening Activities',       label: 'Evening Walk',             icon: '🌆' },

  // --- Relaxation Time ---
  { id: 'screen_free',      block: 'Relaxation Time',          label: 'Screen-Free Wind Down',    icon: '🌙' },
  { id: 'sleep_on_time',    block: 'Relaxation Time',          label: 'Sleep By 11 PM',           icon: '💤' },
];

export const BLOCK_META = {
  'Morning Routine':        { color: '#f59e0b', bg: '#fffbeb', dark: '#92400e', emoji: '🌅', time: '6:00 – 9:00 AM' },
  'Productivity Hours':     { color: '#3b82f6', bg: '#eff6ff', dark: '#1e40af', emoji: '💻', time: '9:00 AM – 1:00 PM' },
  'Lunch Break':            { color: '#10b981', bg: '#ecfdf5', dark: '#065f46', emoji: '🥗', time: '1:00 – 2:00 PM' },
  'Afternoon Productivity': { color: '#8b5cf6', bg: '#f5f3ff', dark: '#4c1d95', emoji: '⚡', time: '2:00 – 6:00 PM' },
  'Evening Activities':     { color: '#ef4444', bg: '#fef2f2', dark: '#7f1d1d', emoji: '🌇', time: '6:00 – 9:00 PM' },
  'Relaxation Time':        { color: '#06b6d4', bg: '#ecfeff', dark: '#164e63', emoji: '🌙', time: '9:00 – 11:00 PM' },
};

export const WEEKLY_HABITS = [
  { id: 'groceries',      label: 'Grocery Shopping',       icon: '🛒', day: 'Saturday' },
  { id: 'meal_planning',  label: 'Meal Planning',          icon: '🍱', day: 'Sunday' },
  { id: 'partner_search', label: 'Partner Search',         icon: '💝', day: 'Any' },
  { id: 'haircut',        label: 'Haircut / Grooming',     icon: '✂️', day: 'Saturday' },
  { id: 'skincare',       label: 'Full Skincare Routine',  icon: '🧴', day: 'Sunday' },
  { id: 'swimming',       label: 'Swimming Session',       icon: '🏊', day: 'Any' },
  { id: 'house_cleaning', label: 'House Cleaning',         icon: '🧹', day: 'Saturday' },
  { id: 'laundry',        label: 'Laundry',                icon: '👕', day: 'Sunday' },
  { id: 'weekly_review',  label: 'Weekly Review',          icon: '📊', day: 'Sunday' },
  { id: 'budget_review',  label: 'Budget Review',          icon: '💰', day: 'Sunday' },
];

export const MONTHLY_GOALS = [
  { id: 'kotak_bill',      label: 'Kotak Credit Card Bill',  icon: '💳', category: 'Bills' },
  { id: 'axis_bill',       label: 'Axis Credit Card Bill',   icon: '💳', category: 'Bills' },
  { id: 'hdfc_bill',       label: 'HDFC Credit Card Bill',   icon: '💳', category: 'Bills' },
  { id: 'milk_sub',        label: 'Milk Subscription',       icon: '🥛', category: 'Bills' },
  { id: 'cable_bill',      label: 'Cable / Internet Bill',   icon: '📡', category: 'Bills' },
  { id: 'car_check',       label: 'Car Service Check',       icon: '🚗', category: 'Maintenance' },
  { id: 'bike_check',      label: 'Bike Service Check',      icon: '🏍️', category: 'Maintenance' },
  { id: 'deep_cleaning',   label: 'Deep House Cleaning',     icon: '🧽', category: 'Maintenance' },
  { id: 'health_checkup',  label: 'Health Check-up',         icon: '🏥', category: 'Health' },
  { id: 'subscriptions',   label: 'Renew Subscriptions',     icon: '🔄', category: 'Admin' },
  { id: 'investments',     label: 'Investment Review',       icon: '📈', category: 'Finance' },
  { id: 'monthly_review',  label: 'Monthly Goal Review',     icon: '🎯', category: 'Review' },
];

// ============================================================
// Storage helpers
// ============================================================

const STORAGE_KEY = 'sudheer_habit_tracker_v1';

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return getDefaultData();
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (_) {}
}

function getDefaultData() {
  return {
    daily: getSeededDailyData(),
    weekly: getSeededWeeklyData(),
    monthly: getSeededMonthlyData(),
    goals: DEFAULT_GOALS.map(g => ({ ...g, steps: [...g.steps], stepsCompleted: [...g.stepsCompleted] })),
    priorities: TOP_PRIORITIES.map(t => ({ text: t, done: false })),
  };
}

// March 2025 seed — days 11 & 12 have real completions
function getSeededDailyData() {
  const data = {};

  const seedDay11 = ['wake_on_time','meditation','healthy_breakfast','deep_work_1',
    'email_messages','task_planning','healthy_lunch','deep_work_2','reading',
    'review_progress','evening_exercise','cook_dinner','sleep_on_time'];

  const seedDay12 = ['wake_on_time','meditation','morning_exercise','healthy_breakfast',
    'morning_journal','deep_work_1','email_messages','learning','task_planning',
    'healthy_lunch','lunch_walk','deep_work_2','side_project','review_progress',
    'evening_exercise','cook_dinner','social_family','screen_free','sleep_on_time'];

  const mk = (d, ids) => {
    const obj = {};
    DAILY_HABITS.forEach(h => { obj[h.id] = ids.includes(h.id); });
    return obj;
  };

  data['2025-03-11'] = mk(11, seedDay11);
  data['2025-03-12'] = mk(12, seedDay12);

  return data;
}

function getSeededWeeklyData() {
  // Week of Mar 9–15 (week 11) and Mar 16–22 (week 12)
  return {
    '2025-W11': { groceries: true, meal_planning: true, laundry: true, weekly_review: true, budget_review: false, partner_search: false, haircut: false, skincare: true, swimming: false, house_cleaning: true },
    '2025-W12': { groceries: true, meal_planning: true, laundry: false, weekly_review: true, budget_review: true, partner_search: true, haircut: true, skincare: true, swimming: true, house_cleaning: false },
  };
}

function getSeededMonthlyData() {
  return {
    '2025-03': { kotak_bill: true, axis_bill: true, hdfc_bill: false, milk_sub: true, cable_bill: true, car_check: false, bike_check: false, deep_cleaning: false, health_checkup: false, subscriptions: false, investments: false, monthly_review: false },
  };
}

// ============================================================
// Date helpers
// ============================================================

export function dateKey(year, month, day) {
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

export function weekKey(date) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() + 4 - (d.getDay()||7));
  const yearStart = new Date(d.getFullYear(),0,1);
  const weekNo = Math.ceil((((d-yearStart)/86400000)+1)/7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2,'0')}`;
}

export function monthKey(year, month) {
  return `${year}-${String(month).padStart(2,'0')}`;
}

export function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

export function today() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth()+1, day: d.getDate() };
}

export function formatDate(year, month, day) {
  return new Date(year, month-1, day).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export function completionRate(habits, completed) {
  if (!habits || habits.length === 0) return 0;
  const done = habits.filter(h => completed && completed[h.id]).length;
  return Math.round((done / habits.length) * 100);
}

export function getDayCompletionRate(dailyData, year, month, day) {
  const key = dateKey(year, month, day);
  const dayData = dailyData[key];
  if (!dayData) return null;
  const done = DAILY_HABITS.filter(h => dayData[h.id]).length;
  return Math.round((done / DAILY_HABITS.length) * 100);
}

export function getMonthStats(dailyData, year, month) {
  const days = daysInMonth(year, month);
  let totalRate = 0, trackedDays = 0;
  const dailyRates = [];
  for (let d = 1; d <= days; d++) {
    const key = dateKey(year, month, d);
    if (dailyData[key]) {
      const rate = getDayCompletionRate(dailyData, year, month, d);
      totalRate += rate;
      trackedDays++;
      dailyRates.push({ day: d, rate });
    } else {
      dailyRates.push({ day: d, rate: null });
    }
  }
  return {
    overall: trackedDays > 0 ? Math.round(totalRate / trackedDays) : 0,
    trackedDays,
    dailyRates,
  };
}

// ============================================================
// Goal Tracker Data
// ============================================================

export const GOAL_AREAS = [
  { id: 'finances',       label: 'Finances',        icon: '💰', color: '#f59e0b' },
  { id: 'career',         label: 'Career',           icon: '🚀', color: '#3b82f6' },
  { id: 'personal_growth',label: 'Personal Growth',  icon: '🌱', color: '#10b981' },
  { id: 'health',         label: 'Health & Wellness',icon: '💪', color: '#ef4444' },
  { id: 'relationships',  label: 'Relationships',    icon: '❤️', color: '#ec4899' },
];

export const DEFAULT_GOALS = [
  {
    id: 'goal_finances',
    area: 'finances',
    title: 'Became a Millioner',
    reward: 'Go on a weekend getaway',
    status: 'in_progress',
    deadline: '2029-01-01',
    steps: [
      'Clear House Loan',
      'Clear All EMI Loans',
      'Clear All Debts',
      'Became a Millioner',
      '', '', '', '',
    ],
    stepsCompleted: [false, false, false, false, false, false, false, false],
  },
  {
    id: 'goal_career',
    area: 'career',
    title: 'Upskill to Get a Promotion',
    reward: 'Go for Maldives',
    status: 'in_progress',
    deadline: '2026-01-01',
    steps: [
      'Became manager in 2026',
      'Complete all Salesforce certifications',
      'Master in AI',
      'Master in AI trading',
      'Become a Tech Architect',
      '', '', '',
    ],
    stepsCompleted: [false, false, false, false, false, false, false, false],
  },
  {
    id: 'goal_personal',
    area: 'personal_growth',
    title: 'Earn 100 Cr Using AI Stock',
    reward: 'Go for Paris trip',
    status: 'in_progress',
    deadline: '2029-01-01',
    steps: [
      'Earn 100 cr in next 5 years (2029) using AI Stock',
      'Master in Technology and Demand Yourself',
      'Focus on your work, get regular income',
      'Buy Properties and shops',
      '', '', '', '',
    ],
    stepsCompleted: [false, false, false, false, false, false, false, false],
  },
  {
    id: 'goal_health',
    area: 'health',
    title: 'Get A Good Health and Be Extrovert',
    reward: 'Go for Singapore Trip',
    status: 'not_started',
    deadline: '2025-04-01',
    steps: [
      'Healthy Meal',
      'Skin Care',
      'Reading Book',
      'Swimming',
      'Dance',
      'Communicate well with community & maintain body language',
      'Work out',
      '',
    ],
    stepsCompleted: [false, false, false, false, false, false, false, false],
  },
  {
    id: 'goal_relationships',
    area: 'relationships',
    title: 'Get A Good Life Partner',
    reward: 'Go for Maldives trip',
    status: 'not_started',
    deadline: '2025-01-04',
    steps: [
      'Dating',
      'Active in Social Media',
      'Showcase your talent',
      'Be prepared for communication',
      'Be prepared, dress well',
      '', '', '',
    ],
    stepsCompleted: [false, false, false, false, false, false, false, false],
  },
];

export const TOP_PRIORITIES = [
  'Get A Good Health and Be Extrovert',
  'Get A Good Life Partner',
  'Pay Off Credit Card Debt',
  'Upskill to Get a Promotion',
  'Became a Millioner',
];
