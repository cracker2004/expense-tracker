import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [showPwd, setShowPwd] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'At least 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    const res = await register(form.name, form.email, form.password);
    if (res.success) { toast.success('Account created!'); navigate('/'); }
    else toast.error(res.message);
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const pwdStrength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return Math.min(s, 3);
  })();

  const strengthMeta = [
    null,
    { label: 'Weak', color: 'bg-red-500' },
    { label: 'Fair', color: 'bg-yellow-500' },
    { label: 'Strong', color: 'bg-green-500' },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0d0f14] flex items-center justify-center p-6">
      <div className="w-full max-w-[400px] anim-scale-in">

        <div className="flex items-center gap-2 mb-8">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-semibold text-gray-900 dark:text-white">ExpenseTracker</span>
        </div>

        <div className="mb-7">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Create account</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Start tracking your expenses for free.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input className={`input ${errors.name ? 'input-error' : ''}`} placeholder="John Doe" value={form.name} onChange={set('name')} autoComplete="name" />
            {errors.name && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.name}</p>}
          </div>

          <div>
            <label className="label">Email address</label>
            <input className={`input ${errors.email ? 'input-error' : ''}`} type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} autoComplete="email" />
            {errors.email && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.email}</p>}
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input className={`input pr-10 ${errors.password ? 'input-error' : ''}`} type={showPwd ? 'text' : 'password'} placeholder="Min. 6 characters" value={form.password} onChange={set('password')} />
              <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                  {[1,2,3].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= pwdStrength ? strengthMeta[pwdStrength]?.color : 'bg-gray-200 dark:bg-gray-700'}`} />
                  ))}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 w-12">{strengthMeta[pwdStrength]?.label}</span>
              </div>
            )}
            {errors.password && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.password}</p>}
          </div>

          <div>
            <label className="label">Confirm password</label>
            <input className={`input ${errors.confirm ? 'input-error' : ''}`} type="password" placeholder="Repeat your password" value={form.confirm} onChange={set('confirm')} />
            {errors.confirm && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.confirm}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-1">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…</>
              : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline underline-offset-2">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
