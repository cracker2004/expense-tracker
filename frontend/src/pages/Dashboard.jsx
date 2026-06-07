import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../api/axios';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend);

const CAT_COLOR = { Food:'#f59e0b', Transport:'#3b82f6', Shopping:'#ec4899', Entertainment:'#8b5cf6', Health:'#10b981', Education:'#06b6d4', Bills:'#ef4444', Other:'#94a3b8' };
const CAT_EMOJI = { Food:'🍔', Transport:'🚗', Shopping:'🛍️', Entertainment:'🎬', Health:'💊', Education:'📚', Bills:'📋', Other:'💼' };

const inr = (n, compact = false) => {
  if (compact && n >= 100000) return `₹${(n/100000).toFixed(1)}L`;
  if (compact && n >= 1000) return `₹${(n/1000).toFixed(0)}k`;
  return new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', minimumFractionDigits:0, maximumFractionDigits:0 }).format(n);
};

function StatCard({ label, value, sub, trend, trendLabel }) {
  return (
    <div className="card">
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-3">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">{value}</p>
      <div className="flex items-center gap-2 mt-2">
        {trend != null && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${trend >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { dark } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    api.get('/expenses/stats')
      .then(r => setStats(r.data.stats))
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  const tick   = dark ? '#4b5563' : '#e5e7eb';
  const label  = dark ? '#6b7280' : '#9ca3af';
  const tipBg  = dark ? '#1f2937' : '#111827';

  const barData = {
    labels: stats?.last6Months?.map(m => {
      const [y,mo] = m.month.split('-');
      return new Date(+y, +mo-1).toLocaleString('default', { month:'short' });
    }) || [],
    datasets: [{
      label: 'Spend',
      data: stats?.last6Months?.map(m => m.total) || [],
      backgroundColor: (ctx) => {
        const i = ctx.dataIndex;
        const total = ctx.dataset.data.length;
        return i === total - 1 ? '#2563eb' : dark ? '#1e3a5f' : '#dbeafe';
      },
      borderRadius: { topLeft:5, topRight:5 },
      borderSkipped: false,
    }]
  };

  const donutData = {
    labels: stats?.byCategory?.map(c => c.category) || [],
    datasets: [{
      data: stats?.byCategory?.map(c => c.total) || [],
      backgroundColor: stats?.byCategory?.map(c => CAT_COLOR[c.category] || '#94a3b8') || [],
      borderWidth: 2,
      borderColor: dark ? '#161b27' : '#ffffff',
      hoverOffset: 4,
    }]
  };

  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: tipBg, padding: 10, cornerRadius: 6, callbacks: { label: c => ` ${inr(c.parsed.y)}` } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: label, font: { size: 11 } }, border: { display: false } },
      y: { grid: { color: tick }, ticks: { color: label, font: { size: 11 }, callback: v => inr(v, true) }, border: { display: false } }
    }
  };

  const donutOpts = {
    responsive: true, maintainAspectRatio: false, cutout: '70%',
    plugins: {
      legend: { position: 'bottom', labels: { color: label, padding: 12, boxWidth: 9, boxHeight: 9, usePointStyle: true, font: { size: 11 } } },
      tooltip: { backgroundColor: tipBg, padding: 10, cornerRadius: 6, callbacks: { label: c => ` ${c.label}: ${inr(c.parsed)}` } }
    }
  };

  if (loading) return (
    <div className="space-y-6 anim-fade-in">
      <div className="h-7 w-48 skeleton rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_,i) => <div key={i} className="h-28 skeleton rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 h-72 skeleton rounded-xl" />
        <div className="h-72 skeleton rounded-xl" />
      </div>
    </div>
  );

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();

  return (
    <div className="space-y-6 anim-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{greeting}, {user?.name?.split(' ')[0]}</p>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mt-0.5">Your financial overview</h1>
        </div>
        <Link to="/expenses" className="btn-primary text-sm">
          Add expense <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total expenses" value={inr(stats?.totalExpenses || 0)} sub={`${stats?.totalCount || 0} transactions`} />
        <StatCard label="This month" value={inr(stats?.monthlyExpenses || 0)} sub={new Date().toLocaleString('default',{month:'long',year:'numeric'})} />
        <StatCard label="Top category" value={stats?.byCategory?.[0]?.category || '—'} sub={stats?.byCategory?.[0] ? inr(stats.byCategory[0].total) : 'No data'} />
        <StatCard label="Categories" value={stats?.byCategory?.length || 0} sub="tracked" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Bar */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Monthly spending</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Last 6 months</p>
            </div>
          </div>
          <div className="h-56">
            {stats?.last6Months?.length
              ? <Bar data={barData} options={barOpts} />
              : <Empty msg="No monthly data yet" />}
          </div>
        </div>

        {/* Donut */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">By category</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">All time</p>
          <div className="h-56">
            {stats?.byCategory?.length
              ? <Doughnut data={donutData} options={donutOpts} />
              : <Empty msg="No categories yet" />}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent transactions</h2>
            <Link to="/expenses" className="text-xs text-blue-600 dark:text-blue-400 hover:underline underline-offset-2 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {!stats?.recentTransactions?.length ? (
            <div className="py-10 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">No transactions yet.</p>
              <Link to="/expenses" className="text-sm text-blue-600 dark:text-blue-400 hover:underline underline-offset-2 mt-1 inline-block">
                Add your first expense →
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {stats.recentTransactions.map((e, i) => (
                <div key={e._id || i} className="flex items-center gap-3 py-2.5 px-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm flex-shrink-0">
                    {CAT_EMOJI[e.category] || '💼'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{e.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{e.category} · {e.date}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white flex-shrink-0">
                    {inr(e.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category breakdown */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Category breakdown</h2>
          {!stats?.byCategory?.length ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">No data yet</p>
          ) : (
            <div className="space-y-3.5">
              {stats.byCategory.slice(0, 6).map(cat => {
                const pct = stats.totalExpenses > 0 ? (cat.total / stats.totalExpenses * 100) : 0;
                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        <span className="text-sm">{CAT_EMOJI[cat.category]}</span>
                        {cat.category}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: CAT_COLOR[cat.category] || '#94a3b8' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Empty({ msg }) {
  return (
    <div className="h-full flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">{msg}</div>
  );
}
