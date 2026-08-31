import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toLocalDateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function Calendar() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentMonth, setCurrentMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => localStorage.getItem('taskDraftDueDate') || '');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await api.get('/tasks/mine').catch(() => api.get('/tasks'));
        setTasks(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load calendar tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const monthTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const date = new Date(task.dueDate);
      const key = toLocalDateKey(date);
      const [year, month] = key.split('-').map(Number);
      return month === currentMonth.getMonth() + 1 && year === currentMonth.getFullYear();
    });
  }, [tasks, currentMonth]);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const totalCells = Math.ceil((daysInMonth + firstDayOfMonth) / 7) * 7;

  const tasksByDate = useMemo(() => {
    return monthTasks.reduce((acc, task) => {
      const dateKey = toLocalDateKey(new Date(task.dueDate));
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(task);
      return acc;
    }, {});
  }, [monthTasks]);

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const calendarCells = Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - firstDayOfMonth + 1;
    const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
    const date = isCurrentMonth ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNumber) : null;
    const dateKey = date ? toLocalDateKey(date) : null;
    const items = dateKey ? tasksByDate[dateKey] || [] : [];

    return { dayNumber, isCurrentMonth, date, dateKey, items };
  });

  const handleDateSelect = (dateKey) => {
    if (!dateKey) return;
    setSelectedDate(dateKey);
    localStorage.setItem('taskDraftDueDate', dateKey);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl">
        <h2 className="text-2xl font-semibold text-white">Calendar</h2>
        <p className="mt-2 text-slate-300">See task deadlines across the month.</p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
        {loading ? (
          <p className="text-slate-300">Loading deadlines...</p>
        ) : error ? (
          <p className="text-rose-400">{error}</p>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
              >
                Prev
              </button>
              <h3 className="text-xl font-semibold text-white">
                {currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                type="button"
                onClick={goToNextMonth}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
              >
                Next
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-wide text-slate-400">
              {weekdayLabels.map((day) => (
                <div key={day} className="py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-2">
              {calendarCells.map((cell, index) => (
                <button
                  type="button"
                  key={`${cell.date ? cell.date.toISOString() : 'empty'}-${index}`}
                  onClick={() => handleDateSelect(cell.dateKey)}
                  className={`min-h-28 rounded-xl border p-2 text-left transition ${
                    cell.isCurrentMonth
                      ? 'border-slate-800 bg-slate-950/70 hover:border-sky-500'
                      : 'border-slate-900 bg-slate-900/40 text-slate-500'
                  } ${
                    cell.dateKey && selectedDate === cell.dateKey ? 'border-sky-500 ring-2 ring-sky-500/40' : ''
                  }`}
                  disabled={!cell.isCurrentMonth}
                >
                  {cell.isCurrentMonth && (
                    <>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{cell.dayNumber}</span>
                        {selectedDate === cell.dateKey && <span className="text-[10px] uppercase tracking-wide text-sky-300">Selected</span>}
                      </div>

                      <div className="space-y-1">
                        {cell.items.slice(0, 3).map((task) => (
                          <div key={task._id} className="rounded bg-sky-500/20 px-2 py-1 text-left text-[10px] text-sky-200">
                            {task.title}
                          </div>
                        ))}
                        {cell.items.length > 3 && (
                          <div className="text-[10px] text-slate-400">+{cell.items.length - 3} more</div>
                        )}
                      </div>
                    </>
                  )}
                </button>
              ))}
            </div>

            {monthTasks.length === 0 && (
              <p className="mt-4 text-slate-400">No deadlines in this month.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Calendar;
