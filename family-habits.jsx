/* global React */
// Family Dashboard — dynamic Habit Tracker (CRUD + streaks)
const { useState: useStateFH, useMemo: useMemoFH } = React;

const FH_CATEGORIES = ["Wellness", "Fitness", "Learning", "Chores", "Money", "Other"];
const FH_CAT_COLOR = { Wellness: "var(--fd-teal)", Fitness: "var(--fd-coral)", Learning: "var(--fd-purple)", Chores: "var(--fd-gold)", Money: "var(--fd-green)", Other: "var(--fd-ink-3)" };

function fhDateStr(offset) {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toISOString().slice(0, 10);
}

function fhStreak(dates) {
  let s = 0;
  for (let i = 0; i < 365; i++) {
    if (dates.includes(fhDateStr(i))) s++;
    else if (i === 0) continue; // today not done yet doesn't break streak
    else break;
  }
  return s;
}

function HabitForm({ initial, onSave, onCancel }) {
  const [name, setName] = useStateFH(initial ? initial.habitName : "");
  const [cat, setCat] = useStateFH(initial ? initial.category : "Wellness");
  return (
    <div className="fd-overlay" onClick={onCancel}>
      <div className="fd-modal" onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>{initial ? "Edit habit" : "New habit"}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div className="fd-label" style={{ marginBottom: 6 }}>Habit name</div>
            <input className="fd-input" autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Drink 2L water" />
          </div>
          <div>
            <div className="fd-label" style={{ marginBottom: 6 }}>Category</div>
            <select className="fd-input" value={cat} onChange={e => setCat(e.target.value)}>
              {FH_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
            <button className="fd-btn fd-btn-ghost" onClick={onCancel}>Cancel</button>
            <button className="fd-btn fd-btn-primary" disabled={!name.trim()} style={{ opacity: name.trim() ? 1 : 0.5 }}
              onClick={() => name.trim() && onSave(name.trim(), cat)}>{initial ? "Save" : "Add habit"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HabitRow({ h, onToggle, onEdit, onDelete }) {
  const week = [6, 5, 4, 3, 2, 1, 0].map(off => ({ date: fhDateStr(off), off }));
  const streak = fhStreak(h.completedDates);
  const monthCount = h.completedDates.filter(d => d >= fhDateStr(29)).length;
  const col = FH_CAT_COLOR[h.category] || "var(--fd-ink-3)";
  return (
    <div className="fd-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700 }}>{h.habitName}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
            <span className="fd-chip" style={{ background: col + "1A", color: col }}>{h.category}</span>
            <span style={{ fontSize: 11, color: "var(--fd-ink-3)", fontWeight: 600 }}>🔥 {streak}d streak · {monthCount}/30 this month</span>
          </div>
        </div>
        <button className="fd-btn fd-btn-ghost" style={{ height: 28, padding: "0 8px" }} onClick={onEdit} title="Edit"><window.Icons.Settings size={13} /></button>
        <button className="fd-btn fd-btn-ghost fd-btn-danger" style={{ height: 28, padding: "0 8px" }} onClick={onDelete} title="Delete"><window.Icons.X size={13} /></button>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {week.map(({ date, off }) => {
          const done = h.completedDates.includes(date);
          const label = off === 0 ? "Today" : new Date(date).toLocaleDateString("en-GB", { weekday: "short" });
          return (
            <button key={date} onClick={() => onToggle(date)} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
              padding: "8px 2px", borderRadius: 10,
              background: done ? "var(--fd-teal-soft)" : "var(--fd-bg)",
              border: `1.5px solid ${done ? "var(--fd-teal)" : "var(--fd-line)"}`,
              transition: "all 130ms var(--fd-ease)",
            }}>
              <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", color: done ? "var(--fd-teal)" : "var(--fd-ink-3)" }}>{label}</span>
              <span style={{
                width: 18, height: 18, borderRadius: 999,
                background: done ? "var(--fd-teal)" : "var(--fd-line)",
                display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
              }}>{done && <window.Icons.Check size={11} />}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FamilyHabits() {
  const fd = window.useFD();
  const [modal, setModal] = useStateFH(null); // null | "new" | habit object
  const mine = fd.db.habits.filter(h => h.userId === fd.user.uid);
  const today = fd.todayStr();
  const doneToday = mine.filter(h => h.completedDates.includes(today)).length;

  return (
    <div className="fd-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Habit Tracker</h1>
          <div style={{ fontSize: 13, color: "var(--fd-ink-2)" }}>{doneToday} of {mine.length} done today · your habits, your rules</div>
        </div>
        <button className="fd-btn fd-btn-primary" onClick={() => setModal("new")}><window.Icons.Plus size={14} /> Add habit</button>
      </div>

      {mine.length === 0 && (
        <div className="fd-card" style={{ padding: 40, textAlign: "center", color: "var(--fd-ink-3)" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🌱</div>
          <div style={{ fontWeight: 700, color: "var(--fd-ink-2)" }}>No habits yet</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Add your first habit to start building streaks.</div>
        </div>
      )}

      <div className="fd-grid-2">
        {mine.map(h => (
          <HabitRow key={h.habitId} h={h}
            onToggle={(date) => fd.toggleHabitDate(h.habitId, date)}
            onEdit={() => setModal(h)}
            onDelete={() => fd.deleteHabit(h.habitId)}
          />
        ))}
      </div>

      {modal && (
        <HabitForm
          initial={modal === "new" ? null : modal}
          onCancel={() => setModal(null)}
          onSave={(name, cat) => {
            if (modal === "new") fd.addHabit(fd.user.uid, name, cat);
            else fd.editHabit(modal.habitId, { habitName: name, category: cat });
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

window.FamilyHabits = FamilyHabits;
