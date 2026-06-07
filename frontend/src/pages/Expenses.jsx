import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import api from '../api/axios';
import ExpenseModal from '../components/ExpenseModal';
import toast from 'react-hot-toast';

const CATEGORIES = ['All','Food','Transport','Shopping','Entertainment','Health','Education','Bills','Other'];
const CAT_EMOJI  = { Food:'🍔', Transport:'🚗', Shopping:'🛍️', Entertainment:'🎬', Health:'💊', Education:'📚', Bills:'📋', Other:'💼' };
const CAT_BADGE  = {
  Food:          'bg-amber-50  text-amber-700  dark:bg-amber-950/40  dark:text-amber-400  border border-amber-200  dark:border-amber-900',
  Transport:     'bg-blue-50   text-blue-700   dark:bg-blue-950/40   dark:text-blue-400   border border-blue-200   dark:border-blue-900',
  Shopping:      'bg-pink-50   text-pink-700   dark:bg-pink-950/40   dark:text-pink-400   border border-pink-200   dark:border-pink-900',
  Entertainment: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200 dark:border-purple-900',
  Health:        'bg-green-50  text-green-700  dark:bg-green-950/40  dark:text-green-400  border border-green-200  dark:border-green-900',
  Education:     'bg-cyan-50   text-cyan-700   dark:bg-cyan-950/40   dark:text-cyan-400   border border-cyan-200   dark:border-cyan-900',
  Bills:         'bg-red-50    text-red-700    dark:bg-red-950/40    dark:text-red-400    border border-red-200    dark:border-red-900',
  Other:         'bg-gray-100  text-gray-600   dark:bg-gray-800      dark:text-gray-400   border border-gray-200   dark:border-gray-700',
};

const inr = n => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', minimumFractionDigits:2 }).format(n);

export default function Expenses() {
  const [expenses, setExpenses]       = useState([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [debSearch, setDebSearch]     = useState('');
  const [category, setCategory]       = useState('All');
  const [sort, setSort]               = useState('date');
  const [order, setOrder]             = useState('desc');
  const [modalOpen, setModalOpen]     = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [deleteId, setDeleteId]       = useState(null);
  const [deleting, setDeleting]       = useState(false);
  const [filterOpen, setFilterOpen]   = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchExpenses = useCallback(() => {
    setLoading(true);
    const params = { sort, order };
    if (debSearch) params.search = debSearch;
    if (category !== 'All') params.category = category;
    api.get('/expenses', { params })
      .then(r => { setExpenses(r.data.expenses); setTotal(r.data.total); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [debSearch, category, sort, order]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const toggleSort = col => {
    if (sort === col) setOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSort(col); setOrder('desc'); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await api.delete(`/expenses/${deleteId}`); toast.success('Deleted'); setDeleteId(null); fetchExpenses(); }
    catch { toast.error('Failed to delete'); }
    finally { setDeleting(false); }
  };

  const SortIcon = ({ col }) => sort === col
    ? (order === 'asc' ? <ChevronUp size={12} className="text-blue-600 dark:text-blue-400" /> : <ChevronDown size={12} className="text-blue-600 dark:text-blue-400" />)
    : <ChevronDown size={12} className="text-gray-300 dark:text-gray-600" />;

  const totalShown = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-5 anim-fade-in">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Expenses</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{total} record{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setEditExpense(null); setModalOpen(true); }} className="btn-primary text-sm">
          <Plus size={15} /> Add expense
        </button>
      </div>

      {/* Search + filter */}
      <div className="card !p-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9 !py-2 text-sm"
              placeholder="Search expenses…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setFilterOpen(f => !f)}
            className={`btn-secondary text-sm !py-2 gap-1.5 ${filterOpen || category !== 'All' ? 'border-blue-500 dark:border-blue-500 text-blue-600 dark:text-blue-400' : ''}`}>
            <Filter size={14} />
            Filter
            {category !== 'All' && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
          </button>
        </div>

        {filterOpen && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Category</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors
                    ${category === c
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                  {c !== 'All' && CAT_EMOJI[c] + ' '}{c}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 dark:border-gray-800">
            <tr>
              {[['Expense','title'],['Category',null],['Date','date'],['Amount','amount'],['',null]].map(([h, col]) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {col ? (
                    <button onClick={() => toggleSort(col)} className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                      {h} <SortIcon col={col} />
                    </button>
                  ) : h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/80">
            {loading ? (
              [...Array(5)].map((_,i) => (
                <tr key={i}>
                  {[...Array(5)].map((_,j) => (
                    <td key={j} className="px-4 py-3.5"><div className="h-3.5 skeleton rounded" /></td>
                  ))}
                </tr>
              ))
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-14 text-center">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No expenses found</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {search || category !== 'All' ? 'Try clearing your filters.' : 'Add your first expense to get started.'}
                  </p>
                  {(search || category !== 'All') && (
                    <button onClick={() => { setSearch(''); setCategory('All'); }}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2 underline-offset-2">
                      Clear filters
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              expenses.map(e => (
                <tr key={e._id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm flex-shrink-0">
                        {CAT_EMOJI[e.category] || '💼'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate max-w-[180px]">{e.title}</p>
                        {e.description && <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[180px]">{e.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${CAT_BADGE[e.category] || ''}`}>{e.category}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{e.date}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">{inr(e.amount)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditExpense(e); setModalOpen(true); }}
                        className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => setDeleteId(e._id)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {expenses.length > 0 && (
          <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/60 dark:bg-gray-800/20">
            <p className="text-xs text-gray-400 dark:text-gray-500">{expenses.length} shown</p>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Total: <span className="text-gray-900 dark:text-white">{inr(totalShown)}</span>
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {modalOpen && (
        <ExpenseModal
          expense={editExpense}
          onClose={() => { setModalOpen(false); setEditExpense(null); }}
          onSaved={() => { setModalOpen(false); setEditExpense(null); fetchExpenses(); }}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="bg-white dark:bg-[#161b27] rounded-xl shadow-dropdown w-full max-w-xs p-5 border border-gray-200 dark:border-gray-800 anim-scale-in">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Delete expense?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-5">This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1 text-sm !py-2">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="btn-danger flex-1 text-sm !py-2">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
