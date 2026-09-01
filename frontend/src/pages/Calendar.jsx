import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';

function Calendar() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await api.get('/tasks');
        setTasks(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load calendar tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const deadlines = useMemo(() => {
    return tasks
      .filter((task) => task.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [tasks]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl">
        <h2 className="text-2xl font-semibold text-white">Calendar</h2>
        <p className="mt-2 text-slate-300">
          See deadlines and plan your schedule.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
        {loading ? (
          <p className="text-slate-300">Loading deadlines...</p>
        ) : error ? (
          <p className="text-rose-400">{error}</p>
        ) : deadlines.length === 0 ? (
          <p className="text-slate-400">No deadlines yet.</p>
        ) : (
          <div className="space-y-3">
            {deadlines.map((task) => (
              <div key={task._id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                <div>
                  <p className="font-semibold text-white">{task.title}</p>
                  <p className="text-sm text-slate-400">{task.description || 'No description provided'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-sky-300">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-slate-400">{task.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Calendar;
