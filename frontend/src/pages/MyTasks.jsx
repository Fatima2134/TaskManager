import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';

const statusStyles = {
  todo: 'bg-slate-600 text-slate-100',
  'in-progress': 'bg-sky-600 text-sky-100',
  done: 'bg-emerald-600 text-emerald-100',
};

const priorityStyles = {
  low: 'bg-emerald-600/20 text-emerald-300',
  medium: 'bg-amber-600/20 text-amber-300',
  high: 'bg-rose-600/20 text-rose-300',
};

function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [checklistInput, setChecklistInput] = useState('');
  const [savingChecklist, setSavingChecklist] = useState(false);

  const refreshTasks = async () => {
    try {
      const [profileRes, tasksRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/tasks/mine').catch(() => api.get('/tasks')),
      ]);
      const user = profileRes.data.user;
      const taskList = Array.isArray(tasksRes.data) ? tasksRes.data : [];
      const myTasks = taskList.filter((task) => {
        const createdById = task.createdBy?._id || task.createdBy;
        const assignedToId = task.assignedTo?._id || task.assignedTo;
        return String(createdById) === String(user._id) || String(assignedToId) === String(user._id);
      });

      setCurrentUser(user);
      setTasks(myTasks.length > 0 ? myTasks : taskList);
      setSelectedTask((prev) => {
        if (!prev) return myTasks[0] || null;
        return myTasks.find((task) => task._id === prev._id) || myTasks[0] || null;
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTasks();

    const handleTasksUpdated = () => {
      refreshTasks();
    };

    const handleStorageUpdate = (event) => {
      if (event.key === 'tasks:updated') {
        refreshTasks();
      }
    };

    const refreshInterval = window.setInterval(() => {
      refreshTasks();
    }, 3000);

    window.addEventListener('tasks:updated', handleTasksUpdated);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener('tasks:updated', handleTasksUpdated);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  const summary = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === 'done').length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [tasks]);

  const updateTaskStatus = async (taskId, status) => {
    try {
      const response = await api.patch(`/tasks/${taskId}/status`, { status });
      const updatedTask = response.data;
      setTasks((prev) => prev.map((task) => (task._id === taskId ? updatedTask : task)));
      setSelectedTask(updatedTask);
      await refreshTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task status');
    }
  };

  const saveChecklist = async (updatedChecklist) => {
    if (!selectedTask) return;

    try {
      setSavingChecklist(true);
      const response = await api.put(`/tasks/${selectedTask._id}`, {
        ...selectedTask,
        checklist: updatedChecklist,
      });
      const updatedTask = response.data;
      setTasks((prev) => prev.map((task) => (task._id === selectedTask._id ? updatedTask : task)));
      setSelectedTask(updatedTask);
      await refreshTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update checklist');
    } finally {
      setSavingChecklist(false);
    }
  };

  const addChecklistItem = async () => {
    const text = checklistInput.trim();
    if (!text || !selectedTask) return;

    const nextChecklist = [...(selectedTask.checklist || []), { text, completed: false }];
    setChecklistInput('');
    await saveChecklist(nextChecklist);
  };

  const toggleChecklistItem = async (index) => {
    if (!selectedTask) return;
    const nextChecklist = (selectedTask.checklist || []).map((item, itemIndex) =>
      itemIndex === index ? { ...item, completed: !item.completed } : item,
    );
    await saveChecklist(nextChecklist);
  };

  if (loading) {
    return <div className="text-slate-300">Loading your tasks...</div>;
  }

  if (error) {
    return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-sky-400">Workspace</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">My Tasks</h2>
        <p className="mt-3 max-w-2xl text-slate-300">
          Focus on the work assigned to you and keep track of what is moving forward.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Total', value: summary.total, tone: 'from-sky-500 to-cyan-500' },
          { label: 'Completed', value: summary.completed, tone: 'from-emerald-500 to-green-500' },
          { label: 'Pending', value: summary.pending, tone: 'from-amber-500 to-orange-500' },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg">
            <div className={`h-2 w-20 rounded-full bg-gradient-to-r ${card.tone}`} />
            <p className="mt-4 text-sm text-slate-400">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Your Task List</h3>
              <p className="text-sm text-slate-400">Pick a task to open the full detail panel.</p>
            </div>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <button
                key={task._id}
                type="button"
                onClick={() => setSelectedTask(task)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  selectedTask?._id === task._id
                    ? 'border-sky-500 bg-slate-800/80'
                    : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white">{task.title}</p>
                  <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${statusStyles[task.status] || 'bg-slate-700 text-slate-200'}`}>
                    {task.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-400">{task.description || 'No description provided'}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${priorityStyles[task.priority] || 'bg-slate-700 text-slate-200'}`}>
                    {task.priority}
                  </span>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-wide text-slate-300">
                    {task.category}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl">
          {selectedTask ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.3em] text-sky-400">Task Details</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">{selectedTask.title}</h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${statusStyles[selectedTask.status] || 'bg-slate-700 text-slate-200'}`}>
                  {selectedTask.status}
                </span>
              </div>

              <p className="text-slate-300">{selectedTask.description || 'No additional details provided.'}</p>

              <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">Priority</p>
                  <p className="mt-1 font-medium text-white">{selectedTask.priority}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Category</p>
                  <p className="mt-1 font-medium text-white">{selectedTask.category}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Due Date</p>
                  <p className="mt-1 font-medium text-white">{selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : 'No due date'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Assigned To</p>
                  <p className="mt-1 font-medium text-white">{selectedTask.assignedTo?.name || 'Unassigned'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Created By</p>
                  <p className="mt-1 font-medium text-white">{selectedTask.createdBy?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Owner</p>
                  <p className="mt-1 font-medium text-white">{currentUser?.name || 'You'}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-400">Update status</p>
                    <p className="text-sm text-slate-500">Change the workflow state for this task.</p>
                  </div>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => updateTaskStatus(selectedTask._id, e.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  >
                    <option value="todo">Todo</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-400">To-do checklist</p>
                    <p className="text-sm text-slate-500">Track small steps for this task.</p>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    value={checklistInput}
                    onChange={(e) => setChecklistInput(e.target.value)}
                    placeholder="Add a checklist item"
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={addChecklistItem}
                    className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-medium text-white"
                  >
                    Add
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {(selectedTask.checklist || []).map((item, index) => (
                    <label key={`${item.text}-${index}`} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={Boolean(item.completed)}
                        onChange={() => toggleChecklistItem(index)}
                        className="rounded border-slate-700 bg-slate-900"
                      />
                      <span className={item.completed ? 'text-slate-500 line-through' : ''}>{item.text}</span>
                    </label>
                  ))}
                </div>

                {savingChecklist && <p className="mt-3 text-sm text-sky-400">Saving checklist...</p>}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
              Select a task to view more details.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default MyTasks;
