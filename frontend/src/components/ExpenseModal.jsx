import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const CATEGORIES = ['Food','Transport','Shopping','Entertainment','Health','Education','Bills','Other'];
const CAT_EMOJI  = { Food:'🍔', Transport:'🚗', Shopping:'🛍️', Entertainment:'🎬', Health:'💊', Education:'📚', Bills:'📋', Other:'💼' };

const blank = { title:'', amount:'', category:'Food', date: new Date().toISOString().split('T')[0], description:'' };

export default function ExpenseModal({ expense, onClose, onSaved }) {
  const [form, setForm]   = useState(blank);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const isEdit = !!expense;

  useEffect(() => {
    setForm(expense
      ? { title: expense.title, amount: String(expense.amount), category: expense.category, date: expense.date, description: expense.description || '' }
      : blank);
    setErrors({});
  }, [expense]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.amount || isNaN(form.amount) || +form.amount <= 0) e.amount = 'Enter a valid amount';
    if (!form.date) e.date = 'Date is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (isEdit) { await api.put(`/expenses/${expense._id}`, payload); toast.success('Updated'); }
      else        { await api.post('/expenses', payload);               toast.success('Added');   }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-[#161b27] w-full sm:max-w-md rounded-t-2xl sm:rounded-xl border-0 sm:border border-gray-200 dark:border-gray-800 shadow-dropdown anim-scale-in overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">{isEdit ? 'Edit expense' : 'New expense'}</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{isEdit ? 'Update details below' : 'Fill in the details below'}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="label">Title</label>
            <input className={`input ${errors.title ? 'input-error' : ''}`} placeholder="e.g. Grocery run" value={form.title} onChange={set('title')} autoFocus />
            {errors.title && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                <input className={`input pl-7 ${errors.amount ? 'input-error' : ''}`} type="number" step="0.01" min="0.01" placeholder="0.00" value={form.amount} onChange={set('amount')} />
              </div>
              {errors.amount && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.amount}</p>}
            </div>
            <div>
              <label className="label">Date</label>
              <input className={`input ${errors.date ? 'input-error' : ''}`} type="date" value={form.date} onChange={set('date')} />
              {errors.date && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.date}</p>}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="label">Category</label>
            <div className="grid grid-cols-4 gap-1.5">
              {CATEGORIES.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, category: c }))}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-xs font-medium transition-all
                    ${form.category === c
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                  <span className="text-base leading-none">{CAT_EMOJI[c]}</span>
                  <span className="leading-none text-[10px]">{c}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Note <span className="text-gray-400 dark:text-gray-500 font-normal normal-case">(optional)</span></label>
            <textarea className="input resize-none" rows={2} placeholder="Any additional details…" value={form.description} onChange={set('description')} />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{isEdit ? 'Saving…' : 'Adding…'}</> : isEdit ? 'Save changes' : 'Add expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
