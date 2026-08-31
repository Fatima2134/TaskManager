import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';

const priorityColors = {
  high: '#f87171',
  medium: '#fbbf24',
  low: '#34d399',
};

function getDayKey(dateValue) {
  const date = new Date(dateValue);
  date.setHours(12, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

function getWeekWindow(referenceDate = new Date()) {
  const day = referenceDate.getDay();
  const saturday = new Date(referenceDate);
  saturday.setHours(12, 0, 0, 0);
  saturday.setDate(referenceDate.getDate() - ((day + 1) % 7));

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(saturday);
    current.setDate(saturday.getDate() + index);
    return current;
  });
}

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/tasks/mine').catch(() => api.get('/tasks'));
        setTasks(Array.isArray(response.data) ? response.data : []);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const priorityData = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    tasks.forEach((task) => {
      const priority = (task.priority || 'medium').toLowerCase();
      if (counts[priority] !== undefined) {
        counts[priority] += 1;
      }
    });
    const total = Object.values(counts).reduce((sum, value) => sum + value, 0) || 1;

    return Object.entries(counts).map(([name, value], index, arr) => {
      const previous = arr.slice(0, index).reduce((sum, [, item]) => sum + item, 0);
      const start = (previous / total) * 100;
      const end = ((previous + value) / total) * 100;
      return {
        name,
        value,
        color: priorityColors[name],
        start,
        end,
      };
    });
  }, [tasks]);

  const weekDates = useMemo(() => getWeekWindow(), []);

  const weeklyData = useMemo(() => {
    const counts = weekDates.map((date) => {
      const currentKey = getDayKey(date);
      const count = tasks.filter((task) => {
        const taskDate = task.dueDate ? getDayKey(task.dueDate) : null;
        return taskDate === currentKey;
      }).length;
      return { label: date.toLocaleDateString('en-US', { weekday: 'short' }), count };
    });

    const total = counts.reduce((sum, item) => sum + item.count, 0);
    const completed = tasks.filter((task) => task.status === 'done' && task.dueDate && weekDates.some((date) => getDayKey(date) === getDayKey(task.dueDate))).length;

    return {
      counts,
      total,
      completed,
      percentage: total ? Math.round((completed / total) * 100) : 0,
    };
  }, [tasks, weekDates]);

  const pieRadius = 52;
  const circumference = 2 * Math.PI * pieRadius;

  const donutSegments = priorityData.filter((segment) => segment.value > 0);
  const donutTotal = donutSegments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const donutStroke = donutSegments.map((segment) => {
    const dash = (segment.value / donutTotal) * circumference;
    const offset = -donutSegments.slice(0, donutSegments.indexOf(segment)).reduce((sum, item) => sum + (item.value / donutTotal) * circumference, 0);
    return { ...segment, dash, offset };
  });

  if (loading) return <div className="text-slate-300">Loading dashboard...</div>;
  if (error) return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-sky-400">Overview</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">My Dashboard</h2>
        <p className="mt-3 text-slate-300">Track priorities, deadlines, and completion across the week.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Total Tasks', value: tasks.length, tone: 'bg-sky-500' },
          { label: 'Completed', value: tasks.filter((task) => task.status === 'done').length, tone: 'bg-emerald-500' },
          { label: 'Pending', value: tasks.filter((task) => task.status !== 'done').length, tone: 'bg-amber-500' },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg">
            <div className={`mb-4 h-2 w-20 rounded-full ${card.tone}`} />
            <p className="text-sm text-slate-400">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl lg:col-span-1">
          <h3 className="text-xl font-semibold text-white">Priority Distribution</h3>
          <div className="mt-4 flex items-center gap-6">
            <svg viewBox="0 0 160 160" className="h-36 w-36">
              <circle cx="80" cy="80" r={pieRadius} fill="none" stroke="#1e293b" strokeWidth="26" />
              {donutStroke.map((segment) => (
                <circle
                  key={segment.name}
                  cx="80"
                  cy="80"
                  r={pieRadius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="26"
                  strokeDasharray={`${segment.dash} ${circumference - segment.dash}`}
                  strokeDashoffset={-segment.offset}
                  strokeLinecap="round"
                  transform="rotate(-90 80 80)"
                />
              ))}
            </svg>

            <div className="space-y-3 text-sm">
              {priorityData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-slate-300">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="capitalize">{item.name}</span>
                  <span className="ml-auto font-medium text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl lg:col-span-2">
          <h3 className="text-xl font-semibold text-white">Tasks This Week</h3>
          <div className="mt-6 flex h-48 items-end gap-3">
            {weeklyData.counts.map((day) => (
              <div key={day.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-32 w-full items-end justify-center">
                  <div
                    className="w-full rounded-t-xl bg-linear-to-t from-sky-500 to-cyan-400"
                    style={{ height: `${Math.max(day.count * 22, day.count ? 18 : 6)}%` }}
                    title={`${day.label}: ${day.count}`}
                  />
                </div>
                <span className="text-xs text-slate-400">{day.label}</span>
                <span className="text-xs font-medium text-slate-200">{day.count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl lg:col-span-3">
          <h3 className="text-xl font-semibold text-white">Weekly Completion</h3>
          <div className="mt-5 flex items-center gap-6">
            <div
              className="relative flex h-28 w-28 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#34d399 ${weeklyData.percentage * 3.6}deg, #1e293b 0deg)`,
              }}
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 text-xl font-semibold text-white">
                {weeklyData.percentage}%
              </div>
            </div>
            <div className="space-y-2 text-slate-300">
              <p><span className="text-white font-semibold">{weeklyData.completed}</span> tasks completed</p>
              <p><span className="text-white font-semibold">{weeklyData.total}</span> tasks in the selected week</p>
              <p className="text-sm text-slate-400">Week range: {weekDates[0].toLocaleDateString()} to {weekDates[6].toLocaleDateString()}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
