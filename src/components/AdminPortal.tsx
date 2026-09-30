import React, { useState, useEffect } from 'react';
import {
  AuditLog,
  DashboardStats,
  Order,
  RechargePlan,
  SystemSettings,
  UtrSubmission,
} from '../types';
import { api } from '../services/api';
import {
  ShieldAlert,
  Lock,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
  ListOrdered,
  CreditCard,
  Zap,
  Tag,
  FileText,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Smartphone,
  ExternalLink,
  Sparkles,
  HelpCircle,
  Download,
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(api.getAdminToken());
  });

  const [email, setEmail] = useState('admin@recharge.in');
  const [password, setPassword] = useState('Admin@123');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'utr' | 'payments' | 'plans' | 'settings' | 'audit'
  >('overview');

  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [utrSubmissions, setUtrSubmissions] = useState<UtrSubmission[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [plans, setPlans] = useState<RechargePlan[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Plan modal state
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<RechargePlan | null>(null);
  const [planForm, setPlanForm] = useState({
    operatorId: 'jio' as 'jio' | 'airtel',
    category: 'Daily Data' as any,
    name: '',
    price: 299,
    validity: '28 Days',
    data: '1.5 GB/Day',
    voice: 'Truly Unlimited',
    sms: '100 SMS/Day',
    benefits: 'Unlimited 5G Data, JioCinema, JioTV',
    isPopular: false,
  });

  // Action status message
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Auto-refresh state (every 8 seconds for live payment/UTR detection)
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [showPaymentGuide, setShowPaymentGuide] = useState<boolean>(true);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      await api.adminLogin(password, email);
      setIsAuthenticated(true);
      fetchDashboardData();
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Invalid admin credentials');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    api.setAdminToken(null);
    setIsAuthenticated(false);
  };

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoadingData(true);
    try {
      const [
        statsData,
        ordersData,
        utrData,
        paymentsData,
        plansData,
        settingsData,
        auditData,
      ] = await Promise.all([
        api.getAdminStats(),
        api.getAdminOrders(),
        api.getAdminUtrSubmissions(),
        api.getAdminPayments(),
        api.getAdminPlans(),
        api.getSettings(),
        api.getAuditLogs(),
      ]);

      setStats(statsData);
      setOrders(ordersData);
      setUtrSubmissions(utrData);
      setPayments(paymentsData);
      setPlans(plansData);
      setSettings(settingsData);
      setAuditLogs(auditData);
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      if (!silent) setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchDashboardData();

    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 8000);

    return () => clearInterval(interval);
  }, [isAuthenticated, autoRefresh]);

  // Handle UTR Approval
  const handleVerifyUtr = async (submissionId: string) => {
    try {
      await api.verifyUtr(submissionId, 'Approved by Operations Admin via Dashboard');
      setActionMessage('UTR verified successfully! Payment marked SUCCESS & Recharge executed.');
      fetchDashboardData();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to verify UTR');
    }
  };

  // Handle UTR Reject
  const handleRejectUtr = async (submissionId: string) => {
    const reason = prompt('Enter rejection reason for customer:', 'Transaction not found in merchant bank account');
    if (!reason) return;

    try {
      await api.rejectUtr(submissionId, reason);
      setActionMessage('UTR submission marked as rejected.');
      fetchDashboardData();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to reject UTR');
    }
  };

  // Handle Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      setActionMessage('System settings and discount amount updated successfully!');
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update settings');
    }
  };

  // Save Plan (Create or Update)
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const benefitsArray = planForm.benefits
        .split(',')
        .map((b) => b.trim())
        .filter(Boolean);

      if (editingPlan) {
        await api.updatePlan(editingPlan.id, {
          ...planForm,
          benefits: benefitsArray,
        });
        setActionMessage('Plan updated successfully!');
      } else {
        await api.createPlan({
          ...planForm,
          benefits: benefitsArray,
        });
        setActionMessage('New recharge plan created!');
      }

      setIsPlanModalOpen(false);
      setEditingPlan(null);
      fetchDashboardData();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save plan');
    }
  };

  const handleEditPlan = (plan: RechargePlan) => {
    setEditingPlan(plan);
    setPlanForm({
      operatorId: plan.operatorId,
      category: plan.category,
      name: plan.name,
      price: plan.price,
      validity: plan.validity,
      data: plan.data,
      voice: plan.voice,
      sms: plan.sms,
      benefits: plan.benefits.join(', '),
      isPopular: Boolean(plan.isPopular),
    });
    setIsPlanModalOpen(true);
  };

  const handleTogglePlanActive = async (plan: RechargePlan) => {
    try {
      await api.updatePlan(plan.id, { isActive: !plan.isActive });
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-200 p-8 shadow-xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Admin Control Portal</h2>
          <p className="text-xs text-slate-500 mt-1">
            Secure access to orders, payment verification, UTR queues, plans & system settings.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          {loginError && (
            <p className="text-xs text-red-600 font-semibold">{loginError}</p>
          )}

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-purple-600/20 cursor-pointer"
          >
            {loginLoading ? 'Authenticating...' : 'Sign In to Admin Portal'}
          </button>

          <div className="pt-2 text-center space-y-2">
            <p className="text-[11px] text-slate-400">
              Default credentials pre-filled for evaluation: <code className="bg-slate-100 px-1 py-0.5 rounded">admin@recharge.in</code> / <code className="bg-slate-100 px-1 py-0.5 rounded">Admin@123</code>
            </p>

            <div className="bg-purple-50/70 border border-purple-200/70 rounded-xl p-3 text-left text-xs text-purple-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-purple-950">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Payment Tracking Note:</span>
              </span>
              <p className="text-[11px] text-purple-800 leading-relaxed">
                All UPI payments are deposited directly into your SBI account via <strong>rolexmars37-1@oksbi</strong>. Sign in to view all customer orders, live payment records, and verify customer UTR submissions.
              </p>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900">Admin Operations Dashboard</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              SUPER ADMIN
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Real-time management for Jio & Airtel recharge orders, UTR approvals, and dynamic discounts
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Auto-refresh Indicator & Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              autoRefresh
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-transparent'
            }`}
            title={autoRefresh ? 'Auto-refreshing every 8s. Click to pause.' : 'Auto-refresh paused. Click to enable.'}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span>{autoRefresh ? 'Live (8s)' : 'Paused'}</span>
          </button>

          <a
            href="/BharatRecharge.apk"
            download="BharatRecharge.apk"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Download Android APK (13 KB)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download APK</span>
          </a>

          <button
            onClick={() => fetchDashboardData(false)}
            disabled={loadingData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-red-50 hover:text-red-700 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-emerald-600 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Payment Tracking & Notification Guide Banner */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white rounded-2xl p-5 shadow-lg border border-indigo-900/60">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  Payment Detection &amp; Verification Guide
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {settings?.upiMerchantVpa || 'rolexmars37-1@oksbi'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  SBI Linked
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                How you find out when a customer pays and how orders get verified instantly
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowPaymentGuide(!showPaymentGuide)}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors cursor-pointer shrink-0"
          >
            {showPaymentGuide ? 'Hide Guide' : 'Show Guide'}
          </button>
        </div>

        {showPaymentGuide && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800">
            {/* 1. Direct Bank Credit & App Notification */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-[11px] font-black">1</span>
                <span>Bank SMS &amp; UPI App Alert</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                When a customer scans the dynamic QR in Google Pay, PhonePe, or Paytm, the money deposits <strong>directly into your State Bank of India account</strong> linked to <code className="text-indigo-300 font-mono font-semibold">rolexmars37-1@oksbi</code>.
              </p>
              <div className="bg-black/40 rounded-lg p-2 text-[11px] text-amber-200 font-mono">
                📱 Instant Bank SMS: &quot;Rs. 294.00 credited to SBI A/c ... UPI Ref/UTR: 123456789012&quot;
              </div>
            </div>

            {/* 2. Customer Enters 12-Digit UTR */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-300">
                <span className="w-5 h-5 rounded-full bg-sky-400/20 text-sky-300 flex items-center justify-center text-[11px] font-black">2</span>
                <span>Customer UTR in App</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                After paying, the customer enters their 12-digit UTR/UPI Ref ID on their payment screen. It immediately appears in your <strong>&quot;UTR Approvals&quot;</strong> tab below.
              </p>
              <div className="bg-black/40 rounded-lg p-2 text-[11px] text-sky-200 font-mono">
                ⚡ Auto-sync: Customer phone number, plan, &amp; 12-digit UTR queue
              </div>
            </div>

            {/* 3. 1-Click Verification & Recharge */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                <span className="w-5 h-5 rounded-full bg-emerald-400/20 text-emerald-300 flex items-center justify-center text-[11px] font-black">3</span>
                <span>1-Click Verify &amp; Recharge</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Compare the 12-digit UTR with your bank credit SMS. Click <strong>&quot;Verify &amp; Approve&quot;</strong> in the UTR tab below—the customer order immediately turns <span className="text-emerald-400 font-bold">SUCCESS</span> and the recharge executes automatically!
              </p>
              <div className="bg-black/40 rounded-lg p-2 text-[11px] text-emerald-200 font-mono">
                ✅ Instant Recharge Delivery to Jio / Airtel SIM
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Orders
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalOrders}</p>
            <span className="text-[10px] text-emerald-600 font-semibold">
              {stats.successRate}% Success Rate
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Revenue Collected
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">₹{stats.totalPaidAmount}</p>
            <span className="text-[10px] text-slate-500 font-medium">Customer payments</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Discounts Given
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1">₹{stats.totalDiscountGiven}</p>
            <span className="text-[10px] text-emerald-700 font-medium">Instant savings</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Pending UTRs
            </p>
            <p className="text-2xl font-black text-amber-600 mt-1">{stats.pendingUtrs}</p>
            <span className="text-[10px] text-amber-700 font-medium">Needs verification</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Recharge Value
            </p>
            <p className="text-2xl font-black text-blue-600 mt-1">
              ₹{stats.totalRechargeDelivered}
            </p>
            <span className="text-[10px] text-blue-700 font-medium">Delivered to SIMs</span>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Recent Orders', icon: ListOrdered },
          { id: 'utr', label: `UTR Approvals (${utrSubmissions.filter((u) => u.status === 'PENDING').length})`, icon: CheckCircle2 },
          { id: 'payments', label: 'Payments & Webhooks', icon: CreditCard },
          { id: 'plans', label: 'Plans Management', icon: Tag },
          { id: 'settings', label: 'Discount & Mode Settings', icon: Settings },
          { id: 'audit', label: 'Audit Trail', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: ORDERS */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">All Customer Orders</h3>
            <span className="text-xs text-slate-500">{orders.length} total orders</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Mobile & Op</th>
                  <th className="py-3 px-4">Plan Value</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Customer Paid</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Recharge</th>
                  <th className="py-3 px-4">Carrier Ref</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {orders.map((o) => (
                  <tr key={o.orderId} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{o.orderId}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold">+91 {o.mobileNumber}</span>
                      <span className="block text-[10px] uppercase font-bold text-slate-500">
                        {o.operator} • {o.circle}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">₹{o.planPrice}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">-₹{o.discount}</td>
                    <td className="py-3 px-4 font-black text-slate-900">₹{o.payableAmount}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          o.paymentStatus === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : o.paymentStatus === 'FAILED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          o.rechargeStatus === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : o.rechargeStatus === 'FAILED' || o.rechargeStatus === 'REFUND_PENDING'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {o.rechargeStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {o.operatorRefNum || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: UTR APPROVALS */}
      {activeTab === 'utr' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Customer UTR / RRN Submissions Queue
              </h3>
              <p className="text-xs text-slate-500">
                Verify against merchant bank statement. Approving triggers automatic webhook verification & carrier recharge.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-1 rounded-md">
              {utrSubmissions.filter((u) => u.status === 'PENDING').length} Pending
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">UTR / RRN Number</th>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Submission Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {utrSubmissions.map((sub) => {
                  const isPending = sub.status === 'PENDING';
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono font-black text-slate-900">
                        {sub.utrNumber}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{sub.orderId}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">₹{sub.submittedAmount}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(sub.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sub.status === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sub.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {isPending ? (
                          <>
                            <button
                              onClick={() => handleVerifyUtr(sub.id)}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all cursor-pointer shadow-xs"
                            >
                              Verify & Recharge
                            </button>
                            <button
                              onClick={() => handleRejectUtr(sub.id)}
                              className="px-3 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 font-bold text-[11px] transition-all cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {sub.adminNotes || 'Completed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {utrSubmissions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No UTR submissions in queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900">Payments & Gateway Transactions</h3>
            <p className="text-xs text-slate-500">
              Complete transaction log with dynamic UPI VPAs and verification timestamps
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Payment ID</th>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Payable Amount</th>
                  <th className="py-3 px-4">Gateway</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Verified At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {payments.map((p) => (
                  <tr key={p.paymentId} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.paymentId}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{p.orderId}</td>
                    <td className="py-3 px-4 font-black text-slate-900">₹{p.amount}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{p.gateway}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {p.verifiedAt ? new Date(p.verifiedAt).toLocaleTimeString('en-IN') : 'Pending'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PLANS MANAGEMENT */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Prepaid Plans Catalog</h3>
              <p className="text-xs text-slate-500">
                Add, edit, or disable Jio and Airtel prepaid plans loaded by customers
              </p>
            </div>

            <button
              onClick={() => {
                setEditingPlan(null);
                setPlanForm({
                  operatorId: 'jio',
                  category: 'Daily Data',
                  name: '₹299 Hero Unlimited',
                  price: 299,
                  validity: '28 Days',
                  data: '1.5 GB/Day',
                  voice: 'Truly Unlimited',
                  sms: '100 SMS/Day',
                  benefits: 'Unlimited 5G Data, JioCinema, JioTV',
                  isPopular: false,
                });
                setIsPlanModalOpen(true);
              }}
              className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Plan</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((p) => {
              const isJio = p.operatorId === 'jio';
              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-2xl border p-4 shadow-2xs space-y-3 ${
                    p.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-black text-[10px] px-1.5 py-0.5 rounded text-white ${
                            isJio ? 'bg-[#002B9A]' : 'bg-[#C80000]'
                          }`}
                        >
                          {p.operatorId.toUpperCase()}
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-900">{p.name}</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {p.validity} • {p.data}
                      </p>
                    </div>

                    <span className="text-lg font-black text-slate-900">₹{p.price}</span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <p><strong>Voice:</strong> {p.voice}</p>
                    <p><strong>SMS:</strong> {p.sms}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      <strong>Perks:</strong> {p.benefits.join(', ')}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => handleTogglePlanActive(p)}
                      className={`text-xs font-bold px-2 py-1 rounded cursor-pointer ${
                        p.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {p.isActive ? 'Active' : 'Disabled'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditPlan(p)}
                        className="p-1.5 text-slate-500 hover:text-purple-600 transition-colors cursor-pointer"
                        title="Edit Plan"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: SETTINGS & DISCOUNT CONFIG */}
      {activeTab === 'settings' && settings && (
        <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">System & Discount Configuration</h3>
            <p className="text-xs text-slate-500">
              Configure server-side discounts and toggle telecom sandbox mock modes
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-5">
            {/* Flat Discount Input */}
            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100">
              <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">
                Backend Discount Amount (INR)
              </label>
              <div className="relative max-w-xs">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-black text-slate-600">
                  ₹
                </span>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={settings.discountAmount}
                  onChange={(e) =>
                    setSettings({ ...settings, discountAmount: Number(e.target.value) })
                  }
                  className="w-full pl-8 pr-4 py-2 bg-white border border-emerald-200 rounded-lg text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <p className="text-[11px] text-emerald-800 mt-2">
                This exact discount is calculated and verified on the server for all plans. (Default: ₹5. E.g. ₹299 plan → customer pays ₹{299 - settings.discountAmount}).
              </p>
            </div>

            {/* Admin Exclusive: Merchant Receiving UPI Settings */}
            <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-purple-950 uppercase tracking-wide flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-purple-700" />
                    <span>Merchant Receiving UPI ID (Admin Exclusive)</span>
                  </h4>
                  <p className="text-[11px] text-purple-800 mt-0.5">
                    User payment change option is disabled. All dynamic QRs generated in the app are locked to this UPI ID for direct bank credit.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-purple-200/80 text-purple-900 font-bold text-[10px]">
                  Admin Controlled Only
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Your UPI ID (Payee VPA)
                  </label>
                  <input
                    type="text"
                    value={settings.upiMerchantVpa}
                    onChange={(e) =>
                      setSettings({ ...settings, upiMerchantVpa: e.target.value })
                    }
                    placeholder="e.g. rolexmars37-1@oksbi"
                    className="w-full px-3 py-2 bg-white border border-purple-300 rounded-lg text-xs font-mono font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Dynamic QR exact amount is automatically linked to this VPA.
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Merchant Display Name
                  </label>
                  <input
                    type="text"
                    value={settings.upiMerchantName}
                    onChange={(e) =>
                      setSettings({ ...settings, upiMerchantName: e.target.value })
                    }
                    placeholder="e.g. Rolex Mars"
                    className="w-full px-3 py-2 bg-white border border-purple-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Shown to customer on Google Pay, PhonePe, and Paytm screens.
                  </span>
                </div>
              </div>
            </div>

            {/* Mock Mode Switches */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.mockPaymentMode}
                  onChange={(e) =>
                    setSettings({ ...settings, mockPaymentMode: e.target.checked })
                  }
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    MOCK_PAYMENT_MODE (Enable interactive test simulators)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Provides direct bank webhook simulation and payload testing on payment screens.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.mockRechargeMode}
                  onChange={(e) =>
                    setSettings({ ...settings, mockRechargeMode: e.target.checked })
                  }
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    MOCK_RECHARGE_MODE (Use MockRechargeProvider for telecom switch)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Simulates instant Jio / Airtel telecom gateway responses with official reference numbers.
                  </span>
                </div>
              </label>
            </div>

            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all cursor-pointer shadow-sm"
            >
              Save Configuration
            </button>
          </form>
        </div>
      )}

      {/* TAB CONTENT: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900">Security Audit Logs</h3>
            <p className="text-xs text-slate-500">
              Tamper-proof event logs for cryptographic webhook checks, payments, and admin actions
            </p>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Actor</th>
                  <th className="py-2.5 px-4">Target Entity</th>
                  <th className="py-2.5 px-4">Details</th>
                  <th className="py-2.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="py-2 px-4 font-mono font-bold text-purple-700">{log.action}</td>
                    <td className="py-2 px-4 font-mono text-[11px] text-slate-700">{log.actor}</td>
                    <td className="py-2 px-4 text-slate-500">
                      {log.entity}:{log.entityId}
                    </td>
                    <td className="py-2 px-4 font-mono text-[10px] text-slate-500 max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                    <td className="py-2 px-4 text-slate-400 text-[11px]">
                      {new Date(log.createdAt).toLocaleTimeString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Plan Edit Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-extrabold text-slate-900 text-base">
              {editingPlan ? 'Edit Recharge Plan' : 'Create New Recharge Plan'}
            </h3>

            <form onSubmit={handleSavePlan} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Operator</label>
                  <select
                    value={planForm.operatorId}
                    onChange={(e) => setPlanForm({ ...planForm, operatorId: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border rounded-lg"
                  >
                    <option value="jio">Reliance Jio</option>
                    <option value="airtel">Bharti Airtel</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border rounded-lg font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Plan Title</label>
                <input
                  type="text"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g. ₹299 Hero Unlimited"
                  className="w-full p-2 bg-slate-50 border rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Validity</label>
                  <input
                    type="text"
                    value={planForm.validity}
                    onChange={(e) => setPlanForm({ ...planForm, validity: e.target.value })}
                    placeholder="28 Days"
                    className="w-full p-2 bg-slate-50 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data</label>
                  <input
                    type="text"
                    value={planForm.data}
                    onChange={(e) => setPlanForm({ ...planForm, data: e.target.value })}
                    placeholder="1.5 GB/Day"
                    className="w-full p-2 bg-slate-50 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Benefits (comma-separated)</label>
                <textarea
                  value={planForm.benefits}
                  onChange={(e) => setPlanForm({ ...planForm, benefits: e.target.value })}
                  rows={2}
                  className="w-full p-2 bg-slate-50 border rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
