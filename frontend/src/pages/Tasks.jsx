import { useEffect, useState } from 'react';
import api from '../api/axios';

const initialState = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
};

const statusStyles = {
  todo: 'bg-slate-700 text-slate-100',
  'in-progress': 'bg-sky-700 text-sky-100',
  done: 'bg-emerald-700 text-emerald-100',
};

const priorityStyles = {
  low: 'bg-emerald-600/20 text-emerald-300',
  medium: 'bg-amber-600/20 text-amber-300',
  high: 'bg-rose-600/20 text-rose-300',
};

function Tasks() {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [tasks, setTasks] = useState([]);
  const [taskLoading, setTaskLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      setTaskLoading(true);
      const response = await api.get('/tasks/mine').catch(() => api.get('/tasks'));
      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setTaskLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setMessage('Please enter a task title');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await api.post('/tasks', {
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate || '',
        category: 'general',
      });
      setMessage('Task created');
      setForm(initialState);
      await fetchTasks();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      await fetchTasks();
      setMessage('Task deleted');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const toggleDone = async (task) => {
    try {
      const nextStatus = task.status === 'done' ? 'todo' : 'done';
      await api.patch(`/tasks/${task._id}/status`, { status: nextStatus });
      await fetchTasks();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update task');
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-red-800 bg-red-900/70 p-6 shadow-xl">
        <h2 className="text-2xl font-semibold text-white">Simple Task Manager</h2>
        <p className="mt-2 text-red-100">Add a task and keep track of what still needs to be done.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-red-800 bg-red-900/70 p-6 shadow-xl">
        <label className="mb-1 block text-sm text-red-100">Task title</label>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-lg border border-red-700 bg-red-950 px-3 py-2 text-white"
          placeholder="What needs to be done?"
        />

        <label className="mt-4 mb-1 block text-sm text-red-100">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="min-h-24 w-full rounded-lg border border-red-700 bg-red-950 px-3 py-2 text-white"
          placeholder="Optional details"
        />

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm text-red-100">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-lg border border-red-700 bg-red-950 px-3 py-2 text-white"
            >
              <option value="todo">To do</option>
              <option value="in-progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-red-100">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full rounded-lg border border-red-700 bg-red-950 px-3 py-2 text-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-red-100">Deadline</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full rounded-lg border border-red-700 bg-red-950 px-3 py-2 text-white"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button type="submit" disabled={loading} className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white disabled:opacity-60">
            {loading ? 'Adding...' : 'Add Task'}
          </button>
          {message && <p className="text-sm text-red-100">{message}</p>}
        </div>
      </form>

      <div className="rounded-2xl border border-red-800 bg-red-900/70 p-6 shadow-xl">
        <h3 className="text-xl font-semibold text-white">Your Tasks</h3>
        {taskLoading ? (
          <p className="mt-4 text-red-100">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="mt-4 text-red-100">No tasks yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {tasks.map((task) => (
              <div key={task._id} className="rounded-xl border border-red-800 bg-red-950/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{task.title}</p>
                    {task.description && <p className="mt-1 text-sm text-red-100">{task.description}</p>}
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${statusStyles[task.status] || 'bg-red-800 text-white'}`}>
                    {task.status === 'in-progress' ? 'In progress' : task.status}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${priorityStyles[task.priority] || 'bg-slate-700 text-slate-200'}`}>
                    {task.priority || 'medium'}
                  </span>
                  {task.dueDate && (
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-wide text-slate-300">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => toggleDone(task)} className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-red-700">
                    {task.status === 'done' ? 'Undo' : 'Done'}
                  </button>
                  <button type="button" onClick={() => handleDelete(task._id)} className="rounded-lg bg-red-700 px-3 py-2 text-sm font-medium text-white">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Tasks;
