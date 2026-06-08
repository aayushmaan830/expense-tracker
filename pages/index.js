import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';

export default function PremiumFintechApp() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Authentication States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-[#3B82F6] font-semibold tracking-wide">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#3B82F6]"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 font-sans">
        <div className="bg-[#1E293B]/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-[#3B82F6]/10 w-full max-w-md transition-all duration-300">
          <div className="flex justify-center mb-6">
            <div className="bg-[#3B82F6]/10 p-3 rounded-xl border border-[#3B82F6]/20">
              <svg className="w-8 h-8 text-[#3B82F6]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
            </div>
          </div>
          <h1 className="text-3xl font-black text-[#F8FAFC] tracking-tight mb-2 text-center">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-center text-[#94A3B8] text-sm mb-8 font-medium">
            Log in to manage your secure financial tracker.
          </p>

          {authError && <p className="text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 p-4 rounded-xl text-xs font-bold mb-5 text-center">{authError}</p>}

          <form onSubmit={async (e) => {
            e.preventDefault();
            setAuthError(null);
            try {
              if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                alert('Account created successfully!');
              } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
              }
            } catch (err) { setAuthError(err.message); }
          }} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 bg-[#0F172A] text-[#F8FAFC] border border-[#3B82F6]/10 rounded-xl focus:outline-none focus:border-[#3B82F6] transition-all font-medium text-sm" placeholder="user@example.com" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 bg-[#0F172A] text-[#F8FAFC] border border-[#3B82F6]/10 rounded-xl focus:outline-none focus:border-[#3B82F6] transition-all font-medium text-sm" placeholder="••••••••" required />
            </div>
            <button type="submit" className="w-full py-4 mt-2 bg-[#3B82F6] hover:bg-[#2563EB] text-[#F8FAFC] text-sm font-bold rounded-xl shadow-lg shadow-[#3B82F6]/20 transform hover:-translate-y-0.5 transition-all duration-200">
              {isSignUp ? 'Sign Up' : 'Log In'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs font-semibold text-[#94A3B8]">
            {isSignUp ? 'Already have an account?' : 'Need a new account?'}
            <button onClick={() => setIsSignUp(!isSignUp)} className="ml-2 text-[#3B82F6] font-bold hover:underline">
              {isSignUp ? 'Log In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return <MainDashboardLayout session={session} />;
}

function MainDashboardLayout({ session }) {
  const [expenses, setExpenses] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Input Transaction Fields
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [type, setType] = useState('expense'); 
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Settings
  const [budget, setBudget] = useState(3500);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortField, setSortField] = useState('date'); 
  const [sortDirection, setSortDirection] = useState('desc');

  const [Charts, setCharts] = useState(null);

  useEffect(() => {
    import('recharts').then((mod) => setCharts(mod));
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      const expenseResponse = await supabase.from('expenses').select('*').order('date', { ascending: false });
      if (expenseResponse.error) throw expenseResponse.error;
      setExpenses(expenseResponse.data || []);

      const catResponse = await supabase.from('categories').select('*');
      if (catResponse.error) throw catResponse.error;
      setCustomCategories(catResponse.data || []);
    } catch (err) {
      alert('Error fetching data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRecordTransaction(e) {
    e.preventDefault();
    if (!title.trim() || parseFloat(amount) <= 0) return alert('Please enter a valid title and amount.');

    try {
      if (editingId) {
        const { error } = await supabase.from('expenses').update({
          title: title.trim(), amount: parseFloat(amount), category, type, date, is_recurring: isRecurring
        }).eq('id', editingId);
        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase.from('expenses').insert([{
          user_id: session.user.id, title: title.trim(), amount: parseFloat(amount), category, type, date, is_recurring: isRecurring
        }]);
        if (error) throw error;
      }
      setTitle(''); setAmount(''); setIsRecurring(false);
      fetchDashboardData();
    } catch (err) { alert(err.message); }
  }

  // FIXED: Changed popup alert message to use "Delete" wording
  async function handleDeleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      setExpenses(expenses.filter(i => i.id !== id));
    } catch (err) { alert(err.message); }
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const { error } = await supabase.from('categories').insert([{ user_id: session.user.id, name: newCategoryName.trim() }]);
      if (error) throw error;
      setNewCategoryName('');
      fetchDashboardData();
    } catch (err) { alert(err.message); }
  }

  async function handleDeleteCategory(id) {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      fetchDashboardData();
    } catch (err) { alert(err.message); }
  }

  // Basic Math Calculations
  const financialMetrics = useMemo(() => {
    let totalSpending = 0;
    let totalIncome = 0;
    expenses.forEach(item => {
      const val = Number(item.amount);
      if (item.type === 'income') totalIncome += val;
      else totalSpending += val;
    });
    const netSavings = totalIncome - totalSpending;
    const utilization = budget > 0 ? (totalSpending / budget) * 100 : 0;
    const remaining = budget - totalSpending;
    const healthScore = Math.max(100 - Math.floor(utilization * 0.6), 20);

    return { totalSpending, totalIncome, netSavings, utilization, remaining, healthScore };
  }, [expenses, budget]);

  // FIXED: Changed allocation chart data to group by Credit vs Debit only
  const creditDebitAllocation = useMemo(() => {
    let debits = 0;
    let credits = 0;
    
    expenses.forEach(item => {
      const val = Number(item.amount);
      if (item.type === 'income') credits += val;
      else debits += val;
    });

    const data = [];
    if (credits > 0) data.push({ name: 'Credit (Income)', value: parseFloat(credits.toFixed(2)) });
    if (debits > 0) data.push({ name: 'Debit (Expense)', value: parseFloat(debits.toFixed(2)) });
    return data;
  }, [expenses]);

  // Search and Filter logic
  const filteredLedger = useMemo(() => {
    return expenses.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
      const matchesType = typeFilter === 'All' || item.type === typeFilter;
      return matchesSearch && matchesCategory && matchesType;
    }).sort((a, b) => {
      let first = sortField === 'amount' ? Number(a.amount) : new Date(a.date).getTime();
      let second = sortField === 'amount' ? Number(b.amount) : new Date(b.date).getTime();
      return sortDirection === 'desc' ? second - first : first - second;
    });
  }, [expenses, searchQuery, categoryFilter, typeFilter, sortField, sortDirection]);

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#CBD5E1] flex font-sans selection:bg-[#3B82F6]/30">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#1E293B] border-r border-[#3B82F6]/10 flex flex-col justify-between hidden md:flex">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-[#3B82F6] p-2 rounded-lg text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
            </div>
            <span className="text-[#F8FAFC] font-black tracking-tight text-lg">NEXUS.FINANCE</span>
          </div>

          <nav className="space-y-1">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-[#3B82F6] text-white' : 'text-[#94A3B8] hover:bg-[#0F172A] hover:text-[#F8FAFC]'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"></path></svg>
              <span>Dashboard Overview</span>
            </button>
            <button onClick={() => setActiveTab('ledger')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'ledger' ? 'bg-[#3B82F6] text-white' : 'text-[#94A3B8] hover:bg-[#0F172A] hover:text-[#F8FAFC]'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
              <span>Transaction Ledger</span>
            </button>
            <button onClick={() => setActiveTab('categories')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'categories' ? 'bg-[#3B82F6] text-white' : 'text-[#94A3B8] hover:bg-[#0F172A] hover:text-[#F8FAFC]'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              <span>Custom Categories</span>
            </button>
          </nav>
        </div>

        <div className="p-6 border-t border-[#3B82F6]/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#3B82F6]/20 border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6] text-xs font-black">U</div>
            <div className="truncate w-36">
              <p className="text-xs font-bold text-[#F8FAFC] truncate">{session.user.email}</p>
              <p className="text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider">Free Account</p>
            </div>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="w-full py-2.5 bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs font-bold rounded-lg hover:bg-[#EF4444] hover:text-white transition-all">
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Panel Content Workspace */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#1E293B]/60 backdrop-blur-md p-6 rounded-2xl border border-[#3B82F6]/10">
          <div>
            <span className="text-[10px] font-bold text-[#3B82F6] uppercase tracking-widest bg-[#3B82F6]/10 px-2.5 py-1 rounded-md border border-[#3B82F6]/20">Active Workspace</span>
            <h1 className="text-3xl font-black text-[#F8FAFC] tracking-tight mt-2">Financial Command Node</h1>
          </div>
          <div className="bg-[#1E293B] px-4 py-2 rounded-xl border border-[#3B82F6]/10 text-xs font-bold text-[#CBD5E1]">
            Status: <span className="text-[#22C55E]">CONNECTED</span>
          </div>
        </header>

        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-[#1E293B] rounded-2xl border border-[#3B82F6]/10"></div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <>
                {/* Statistics Box Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-[#1E293B] p-6 rounded-2xl border border-[#3B82F6]/10 relative overflow-hidden group hover:border-[#3B82F6]/30 transition-all">
                    <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Monthly Budget Target</p>
                    <input type="number" value={budget} onChange={(e) => setBudget(parseFloat(e.target.value) || 0)} className="bg-transparent text-2xl font-black text-[#F8FAFC] focus:outline-none focus:border-b border-[#3B82F6] w-full mt-1" />
                    <span className="absolute bottom-3 right-4 text-[10px] font-bold text-[#94A3B8]">Type to Adjust</span>
                  </div>
                  <div className="bg-[#1E293B] p-6 rounded-2xl border border-[#3B82F6]/10 group hover:border-[#EF4444]/30 transition-all">
                    <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Total Debits (Expenses)</p>
                    <p className="text-2xl font-black text-[#EF4444] mt-1">${financialMetrics.totalSpending.toFixed(2)}</p>
                  </div>
                  <div className="bg-[#1E293B] p-6 rounded-2xl border border-[#3B82F6]/10 group hover:border-[#22C55E]/30 transition-all">
                    <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Total Credits (Income)</p>
                    <p className="text-2xl font-black text-[#22C55E] mt-1">${financialMetrics.totalIncome.toFixed(2)}</p>
                  </div>
                  <div className="bg-[#1E293B] p-6 rounded-2xl border border-[#3B82F6]/10 group hover:border-[#3B82F6]/30 transition-all">
                    <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Net Savings Delta</p>
                    <p className={`text-2xl font-black mt-1 ${financialMetrics.netSavings >= 0 ? 'text-[#3B82F6]' : 'text-[#EF4444]'}`}>
                      ${financialMetrics.netSavings.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Progress bars and Credit/Debit charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-[#1E293B] p-6 rounded-2xl border border-[#3B82F6]/10">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-md font-bold text-[#F8FAFC]">Budget Limits Bar</h3>
                        <p className="text-xs text-[#94A3B8]">Visual readout of how much budget space you have left.</p>
                      </div>
                      <span className="text-lg font-black text-[#F8FAFC]">{financialMetrics.utilization.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-[#0F172A] rounded-full h-3 overflow-hidden">
                      <div className={`h-3 rounded-full transition-all duration-500 ${financialMetrics.utilization > 90 ? 'bg-[#EF4444]' : 'bg-[#3B82F6]'}`} style={{ width: `${Math.min(financialMetrics.utilization, 100)}%` }}></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#3B82F6]/10">
                      <div>
                        <p className="text-[10px] text-[#94A3B8] uppercase font-bold">Remaining Cash Room</p>
                        <p className={`text-md font-bold ${financialMetrics.remaining >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>${financialMetrics.remaining.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#94A3B8] uppercase font-bold">Account Health Score</p>
                        <p className="text-md font-bold text-[#F59E0B]">{financialMetrics.healthScore} / 100</p>
                      </div>
                    </div>
                  </div>

                  {/* UPDATED CHART: Renders Credit vs Debit distributions only */}
                  <div className="bg-[#1E293B] p-6 rounded-2xl border border-[#3B82F6]/10 flex flex-col justify-between">
                    <div>
                      <h3 className="text-md font-bold text-[#F8FAFC]">Credit vs Debit Ratio</h3>
                      <p className="text-xs text-[#94A3B8] mb-4">Proportional display of cash moving in vs out.</p>
                    </div>
                    {creditDebitAllocation.length > 0 && Charts ? (
                      <div className="w-full h-32 flex justify-center">
                        <Charts.ResponsiveContainer width="100%" height="100%">
                          <Charts.PieChart>
                            <Charts.Pie data={creditDebitAllocation} innerRadius={35} outerRadius={50} paddingAngle={4} dataKey="value">
                              {creditDebitAllocation.map((entry, index) => (
                                <Charts.Cell key={`cell-${index}`} fill={entry.name.includes('Credit') ? '#22C55E' : '#EF4444'} />
                              ))}
                            </Charts.Pie>
                            <Charts.Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#3B82F6' }} />
                          </Charts.PieChart>
                        </Charts.ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-xs font-medium text-[#94A3B8] text-center my-auto">No transaction data rows recorded.</p>
                    )}
                  </div>
                </div>

                {/* Main Transaction Entry Form */}
                <div className="bg-[#1E293B] p-6 rounded-2xl border border-[#3B82F6]/10">
                  <h3 className="text-md font-bold text-[#F8FAFC] mb-4">{editingId ? 'Modify Transaction' : 'Record New Transaction'}</h3>
                  <form onSubmit={handleRecordTransaction} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div>
                      <label className="block text-[10px] font-bold text-[#94A3B8] uppercase mb-2">Item Name / Merchant</label>
                      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 bg-[#0F172A] text-[#F8FAFC] border border-[#3B82F6]/10 rounded-xl text-xs focus:outline-none focus:border-[#3B82F6]" placeholder="e.g. Hosting Bills" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#94A3B8] uppercase mb-2">Cash Amount ($)</label>
                      <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-3 bg-[#0F172A] text-[#F8FAFC] border border-[#3B82F6]/10 rounded-xl text-xs focus:outline-none focus:border-[#3B82F6]" placeholder="0.00" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#94A3B8] uppercase mb-2">Transaction Type</label>
                      <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-3 bg-[#0F172A] text-[#F8FAFC] border border-[#3B82F6]/10 rounded-xl text-xs focus:outline-none focus:border-[#3B82F6]">
                        <option value="expense">Debit (Expense)</option>
                        <option value="income">Credit (Income)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#94A3B8] uppercase mb-2">Category Tag</label>
                      <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-3 bg-[#0F172A] text-[#F8FAFC] border border-[#3B82F6]/10 rounded-xl text-xs focus:outline-none focus:border-[#3B82F6]">
                        <option value="Food">Food & Discretionary</option>
                        <option value="Utilities">Utilities & Bills</option>
                        <option value="Subscriptions">Software Subscriptions</option>
                        <option value="Transport">Logistics & Transport</option>
                        {customCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <button type="submit" className="w-full p-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold rounded-xl transition-all h-11">
                      {editingId ? 'Save Changes' : 'Record Row'}
                    </button>
                  </form>
                </div>
              </>
            )}

            {/* AUDIT TABLE LEDGER VIEW */}
            {(activeTab === 'ledger' || activeTab === 'dashboard') && (
              <div className="bg-[#1E293B] p-6 rounded-2xl border border-[#3B82F6]/10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-[#F8FAFC]">Transaction Audit Log</h3>
                    <p className="text-xs text-[#94A3B8]">Browse, search, or edit your secure account database lines.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search rows..." className="p-2.5 bg-[#0F172A] text-xs text-[#F8FAFC] border border-[#3B82F6]/10 rounded-xl focus:outline-none focus:border-[#3B82F6] w-full sm:w-44" />
                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="p-2.5 bg-[#0F172A] text-xs text-[#F8FAFC] border border-[#3B82F6]/10 rounded-xl focus:outline-none">
                      <option value="All">All Transactions</option>
                      <option value="expense">Debits Only</option>
                      <option value="income">Credits Only</option>
                    </select>
                  </div>
                </div>

                {filteredLedger.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-[#3B82F6]/10 rounded-xl bg-[#0F172A]/30">
                    <p className="text-xs font-bold text-[#94A3B8]">No data rows found matching parameters.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#3B82F6]/10 text-[#94A3B8] font-bold uppercase tracking-wider">
                          <th className="pb-3 px-3">Transaction Details</th>
                          <th className="pb-3 px-3">Category Type</th>
                          <th className="pb-3 px-3">Date</th>
                          <th className="pb-3 px-3 text-right">Cash Stream Magnitude</th>
                          <th className="pb-3 px-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#3B82F6]/5 font-medium text-[#CBD5E1]">
                        {filteredLedger.map((item) => (
                          <tr key={item.id} className="hover:bg-[#0F172A]/40 transition-colors group">
                            <td className="py-3.5 px-3 text-[#F8FAFC] font-bold">{item.title}</td>
                            <td className="py-3.5 px-3">
                              <span className="px-2.5 py-1 rounded-md bg-[#0F172A] border border-[#3B82F6]/10 text-[#94A3B8]">
                                {item.category}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-[#94A3B8]">{item.date}</td>
                            <td className={`py-3.5 px-3 text-right font-black ${item.type === 'income' ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                              {item.type === 'income' ? '+' : '-'}${Number(item.amount).toFixed(2)}
                            </td>
                            {/* FIXED: Actions changed to Edit and Delete */}
                            <td className="py-3.5 px-3 text-center flex items-center justify-center gap-2">
                              <button onClick={() => {
                                setEditingId(item.id); setTitle(item.title); setAmount(item.amount); setCategory(item.category); setType(item.type); setDate(item.date); setActiveTab('dashboard');
                              }} className="text-[#3B82F6] bg-[#3B82F6]/10 hover:bg-[#3B82F6] hover:text-white px-2.5 py-1 rounded-md transition-all">Edit</button>
                              <button onClick={() => handleDeleteTransaction(item.id)} className="text-[#EF4444] bg-[#EF4444]/10 hover:bg-[#EF4444] hover:text-white px-2.5 py-1 rounded-md transition-all">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* CATEGORIES VIEW */}
            {activeTab === 'categories' && (
              <div className="bg-[#1E293B] p-6 rounded-2xl border border-[#3B82F6]/10 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#F8FAFC]">Manage Custom Categories</h3>
                  <p className="text-xs text-[#94A3B8]">Add custom organizational categories to attach to your bills.</p>
                </div>
                <form onSubmit={handleAddCategory} className="flex gap-4 max-w-md">
                  <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Category label name..." className="w-full p-3 bg-[#0F172A] text-xs text-[#F8FAFC] border border-[#3B82F6]/10 rounded-xl focus:outline-none" required />
                  <button type="submit" className="px-5 py-3 bg-[#3B82F6] text-white text-xs font-bold rounded-xl whitespace-nowrap">Create Category</button>
                </form>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pt-4">
                  {customCategories.map(c => (
                    <div key={c.id} className="bg-[#0F172A] p-4 rounded-xl border border-[#3B82F6]/10 flex justify-between items-center">
                      <span className="text-xs font-bold text-[#F8FAFC]">{c.name}</span>
                      <button onClick={() => handleDeleteCategory(c.id)} className="text-[#EF4444] hover:underline text-[10px] font-bold">Delete</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}