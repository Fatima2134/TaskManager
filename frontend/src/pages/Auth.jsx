import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const response = await api.post(endpoint, form);
      const data = response.data;

      localStorage.setItem('token', data.token);
      setForm({ name: '', email: '', password: '' });
      navigate('/');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 px-4 py-10">
      <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center">
      <div className="grid w-full overflow-hidden rounded-3xl border border-red-800 bg-white/90 shadow-2xl backdrop-blur lg:grid-cols-[1.05fr_0.95fr]">
        <div className="bg-gradient-to-br from-red-700 to-red-950 p-8 text-white">
          <h2 className="text-3xl font-semibold">Welcome to Task Manager</h2>
          <p className="mt-3 text-sm text-red-50">
            Sign in to manage your work, track progress, and stay on top of your tasks.
          </p>
          <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-4 text-sm text-red-50">
            <p className="font-medium">New here?</p>
            <p className="mt-1">Switch to sign up and create your account in seconds.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-8 text-red-950">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold">{isLogin ? 'Login' : 'Sign Up'}</h3>
            <button
              type="button"
              className="text-sm font-medium text-red-700"
              onClick={() => setIsLogin((prev) => !prev)}
            >
              {isLogin ? 'Need an account?' : 'Already have one?'}
            </button>
          </div>

          {!isLogin && (
            <div>
              <label className="mb-1 block text-sm text-red-700">Full Name</label>
              <input
                className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 outline-none"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter your name"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm text-red-700">Email</label>
            <input
              type="email"
              className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 outline-none"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-red-700">Password</label>
            <input
              type="password"
              className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 outline-none"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-red-700 px-4 py-2 font-medium text-white transition hover:bg-red-600 disabled:opacity-60"
          >
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create account'}
          </button>

          {message && <p className="text-sm text-red-700">{message}</p>}
        </form>
      </div>
      </div>
    </div>
  );
}

export default Auth;
