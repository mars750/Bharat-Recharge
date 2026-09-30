import fs from 'fs';
import path from 'path';
import {
  AdminUser,
  AuditLog,
  Operator,
  Order,
  Payment,
  RechargePlan,
  RechargeTransaction,
  SystemSettings,
  UtrSubmission,
  WebhookEvent,
} from './types';

interface DatabaseSchema {
  operators: Operator[];
  recharge_plans: RechargePlan[];
  orders: Order[];
  payments: Payment[];
  recharge_transactions: RechargeTransaction[];
  utr_submissions: UtrSubmission[];
  webhook_events: WebhookEvent[];
  audit_logs: AuditLog[];
  admins: AdminUser[];
  users: Array<{ id: string; mobileNumber: string; createdAt: string; lastActive: string }>;
  settings: SystemSettings;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Initial seed data
const INITIAL_OPERATORS: Operator[] = [
  {
    id: 'jio',
    name: 'Reliance Jio',
    tagline: 'True 5G • Digital Life',
    primaryColor: '#0A2885',
    accentColor: '#00D084',
    badge: 'True 5G',
    isActive: true,
  },
  {
    id: 'airtel',
    name: 'Bharti Airtel',
    tagline: 'India\'s Fastest 5G Plus',
    primaryColor: '#E40000',
    accentColor: '#FF6B6B',
    badge: '5G Plus',
    isActive: true,
  },
];

const INITIAL_PLANS: RechargePlan[] = [
  // Jio Plans
  {
    id: 'jio-299',
    operatorId: 'jio',
    category: 'Daily Data',
    name: '₹299 Hero Unlimited',
    price: 299,
    validity: '28 Days',
    data: '1.5 GB/Day',
    voice: 'Truly Unlimited',
    sms: '100 SMS/Day',
    benefits: ['Unlimited 5G Data Included', 'JioCinema', 'JioTV', 'JioCloud 6GB'],
    isPopular: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'jio-349',
    operatorId: 'jio',
    category: 'Popular 5G',
    name: '₹349 Unlimited 5G Power',
    price: 349,
    validity: '28 Days',
    data: '2 GB/Day',
    voice: 'Truly Unlimited',
    sms: '100 SMS/Day',
    benefits: ['True Unlimited 5G Data', 'JioCinema Premium Access', 'JioTV', 'JioCloud'],
    isPopular: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'jio-399',
    operatorId: 'jio',
    category: 'Popular 5G',
    name: '₹399 OTT Entertainment',
    price: 399,
    validity: '28 Days',
    data: '2.5 GB/Day',
    voice: 'Truly Unlimited',
    sms: '100 SMS/Day',
    benefits: ['Disney+ Hotstar 3 Months Mobile', 'Unlimited 5G Data', 'JioCinema', 'JioTV'],
    isPopular: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'jio-666',
    operatorId: 'jio',
    category: 'Daily Data',
    name: '₹666 Super Saver 70D',
    price: 666,
    validity: '70 Days',
    data: '1.5 GB/Day',
    voice: 'Truly Unlimited',
    sms: '100 SMS/Day',
    benefits: ['Unlimited 5G Data', 'JioCinema', 'JioTV', 'JioCloud'],
    isPopular: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'jio-899',
    operatorId: 'jio',
    category: 'Daily Data',
    name: '₹899 Long Validity 90D',
    price: 899,
    validity: '90 Days',
    data: '2 GB/Day + 20GB Extra',
    voice: 'Truly Unlimited',
    sms: '100 SMS/Day',
    benefits: ['True Unlimited 5G Data', '20 GB Extra Bonus Data', 'JioCinema', 'JioTV'],
    isPopular: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'jio-3599',
    operatorId: 'jio',
    category: 'Annual',
    name: '₹3599 365-Day Annual Pack',
    price: 3599,
    validity: '365 Days',
    data: '2.5 GB/Day',
    voice: 'Truly Unlimited',
    sms: '100 SMS/Day',
    benefits: ['Unlimited 5G Data for 1 Year', 'JioCinema Mobile & Web', 'JioTV VIP', 'Priority Customer Care'],
    isPopular: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'jio-69',
    operatorId: 'jio',
    category: 'Data Booster',
    name: '₹69 Data Booster 6GB',
    price: 69,
    validity: 'Existing Active Plan',
    data: '6 GB Total',
    voice: 'NA',
    sms: 'NA',
    benefits: ['High Speed 4G/5G Add-on', 'No daily limit on data'],
    isPopular: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Airtel Plans
  {
    id: 'airtel-299',
    operatorId: 'airtel',
    category: 'Daily Data',
    name: '₹299 Truly Unlimited 28D',
    price: 299,
    validity: '28 Days',
    data: '1.5 GB/Day',
    voice: 'Truly Unlimited',
    sms: '100 SMS/Day',
    benefits: ['Apollo 24|7 Circle (3 Months)', 'Free Hellotunes with Unlimited Changes', 'Wynk Music Free'],
    isPopular: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'airtel-349',
    operatorId: 'airtel',
    category: 'Popular 5G',
    name: '₹349 5G Plus Unlimited',
    price: 349,
    validity: '28 Days',
    data: '2 GB/Day',
    voice: 'Truly Unlimited',
    sms: '100 SMS/Day',
    benefits: ['Unlimited 5G Plus Data', 'Wynk Music Free', 'Apollo 24|7 Circle', 'Free Hellotunes'],
    isPopular: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'airtel-449',
    operatorId: 'airtel',
    category: 'Popular 5G',
    name: '₹449 Hotstar Bundle',
    price: 449,
    validity: '28 Days',
    data: '3 GB/Day',
    voice: 'Truly Unlimited',
    sms: '100 SMS/Day',
    benefits: ['Disney+ Hotstar 3 Months Subscription', 'Unlimited 5G Plus', 'Apollo Circle', 'Hellotunes'],
    isPopular: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'airtel-649',
    operatorId: 'airtel',
    category: 'Daily Data',
    name: '₹649 Double Month 56D',
    price: 649,
    validity: '56 Days',
    data: '2 GB/Day',
    voice: 'Truly Unlimited',
    sms: '100 SMS/Day',
    benefits: ['Unlimited 5G Plus Data', 'Xstream Play 20+ OTTs', 'Wynk Music', 'Apollo Circle'],
    isPopular: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'airtel-839',
    operatorId: 'airtel',
    category: 'Daily Data',
    name: '₹839 Golden 84D Pack',
    price: 839,
    validity: '84 Days',
    data: '2 GB/Day',
    voice: 'Truly Unlimited',
    sms: '100 SMS/Day',
    benefits: ['Unlimited 5G Plus Data', 'Airtel Xstream Play App', 'Wynk Music', 'Apollo 24|7 Circle'],
    isPopular: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'airtel-3599',
    operatorId: 'airtel',
    category: 'Annual',
    name: '₹3599 365-Day Unlimited 5G',
    price: 3599,
    validity: '365 Days',
    data: '2 GB/Day',
    voice: 'Truly Unlimited',
    sms: '100 SMS/Day',
    benefits: ['Unlimited 5G Plus for 365 Days', 'Apollo 24|7 Circle (1 Year)', 'Hellotunes', 'Wynk Music'],
    isPopular: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'airtel-77',
    operatorId: 'airtel',
    category: 'Data Booster',
    name: '₹77 High-Speed 5GB Booster',
    price: 77,
    validity: 'Existing Active Plan',
    data: '5 GB Total',
    voice: 'NA',
    sms: 'NA',
    benefits: ['High Speed 4G/5G Add-on', 'Works with any existing pack'],
    isPopular: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_SETTINGS: SystemSettings = {
  discountAmount: 5, // Fixed ₹5 backend discount
  mockPaymentMode: true,
  mockRechargeMode: true,
  simulateFailureRate: 0,
  upiMerchantVpa: process.env.UPI_MERCHANT_VPA || 'rolexmars37-1@oksbi',
  upiMerchantName: process.env.UPI_MERCHANT_NAME || 'Rolex Mars',
};

const INITIAL_ADMIN: AdminUser = {
  id: 'admin_root_1',
  email: 'admin@recharge.in',
  name: 'Operations Admin',
  role: 'super_admin',
  createdAt: new Date().toISOString(),
};

class Database {
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
        return {
          operators: parsed.operators?.length ? parsed.operators : INITIAL_OPERATORS,
          recharge_plans: parsed.recharge_plans?.length ? parsed.recharge_plans : INITIAL_PLANS,
          orders: parsed.orders || [],
          payments: parsed.payments || [],
          recharge_transactions: parsed.recharge_transactions || [],
          utr_submissions: parsed.utr_submissions || [],
          webhook_events: parsed.webhook_events || [],
          audit_logs: parsed.audit_logs || [],
          admins: parsed.admins || [INITIAL_ADMIN],
          users: parsed.users || [],
          settings: parsed.settings || INITIAL_SETTINGS,
        };
      }
    } catch (err) {
      console.error('Error loading database file, initializing default:', err);
    }

    const initial: DatabaseSchema = {
      operators: INITIAL_OPERATORS,
      recharge_plans: INITIAL_PLANS,
      orders: [],
      payments: [],
      recharge_transactions: [],
      utr_submissions: [],
      webhook_events: [],
      audit_logs: [],
      admins: [INITIAL_ADMIN],
      users: [],
      settings: INITIAL_SETTINGS,
    };
    this.saveImmediate(initial);
    return initial;
  }

  private saveImmediate(snapshot: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmp = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(snapshot, null, 2), 'utf-8');
      fs.renameSync(tmp, DB_FILE);
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  private scheduleSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveImmediate(this.data);
      this.saveTimeout = null;
    }, 50);
  }

  // --- Operators ---
  getOperators(): Operator[] {
    return this.data.operators.filter((o) => o.isActive);
  }

  getOperatorById(id: string): Operator | undefined {
    return this.data.operators.find((o) => o.id === id);
  }

  // --- Plans ---
  getPlansByOperator(operatorId: string): RechargePlan[] {
    return this.data.recharge_plans.filter((p) => p.operatorId === operatorId && p.isActive);
  }

  getAllPlans(): RechargePlan[] {
    return [...this.data.recharge_plans];
  }

  getPlanById(id: string): RechargePlan | undefined {
    return this.data.recharge_plans.find((p) => p.id === id);
  }

  createPlan(plan: Omit<RechargePlan, 'id' | 'createdAt' | 'updatedAt'>): RechargePlan {
    const newPlan: RechargePlan = {
      ...plan,
      id: `${plan.operatorId}-${plan.price}-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.recharge_plans.push(newPlan);
    this.scheduleSave();
    return newPlan;
  }

  updatePlan(id: string, updates: Partial<RechargePlan>): RechargePlan | null {
    const idx = this.data.recharge_plans.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.data.recharge_plans[idx] = {
      ...this.data.recharge_plans[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.scheduleSave();
    return this.data.recharge_plans[idx];
  }

  deletePlan(id: string): boolean {
    const idx = this.data.recharge_plans.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.data.recharge_plans[idx].isActive = false; // Soft delete
    this.data.recharge_plans[idx].updatedAt = new Date().toISOString();
    this.scheduleSave();
    return true;
  }

  // --- Orders ---
  createOrder(order: Order): Order {
    this.data.orders.unshift(order);
    this.trackUser(order.mobileNumber);
    this.scheduleSave();
    return order;
  }

  getOrderById(orderId: string): Order | undefined {
    return this.data.orders.find((o) => o.orderId === orderId);
  }

  getOrders(limit = 100, offset = 0, filter?: { operator?: string; mobile?: string }): { orders: Order[]; total: number } {
    let list = this.data.orders;
    if (filter?.operator) {
      list = list.filter((o) => o.operator === filter.operator);
    }
    if (filter?.mobile) {
      list = list.filter((o) => o.mobileNumber.includes(filter.mobile!));
    }
    return {
      orders: list.slice(offset, offset + limit),
      total: list.length,
    };
  }

  updateOrder(orderId: string, updates: Partial<Order>): Order | null {
    const idx = this.data.orders.findIndex((o) => o.orderId === orderId);
    if (idx === -1) return null;
    this.data.orders[idx] = {
      ...this.data.orders[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.scheduleSave();
    return this.data.orders[idx];
  }

  // --- Payments ---
  createPayment(payment: Payment): Payment {
    this.data.payments.unshift(payment);
    this.scheduleSave();
    return payment;
  }

  getPaymentByOrderId(orderId: string): Payment | undefined {
    return this.data.payments.find((p) => p.orderId === orderId);
  }

  getPaymentById(paymentId: string): Payment | undefined {
    return this.data.payments.find((p) => p.paymentId === paymentId);
  }

  updatePayment(paymentId: string, updates: Partial<Payment>): Payment | null {
    const idx = this.data.payments.findIndex((p) => p.paymentId === paymentId);
    if (idx === -1) return null;
    this.data.payments[idx] = {
      ...this.data.payments[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.scheduleSave();
    return this.data.payments[idx];
  }

  getAllPayments(limit = 100): Payment[] {
    return this.data.payments.slice(0, limit);
  }

  // --- Recharge Transactions ---
  createRechargeTransaction(txn: RechargeTransaction): RechargeTransaction {
    this.data.recharge_transactions.unshift(txn);
    this.scheduleSave();
    return txn;
  }

  getRechargeByOrderId(orderId: string): RechargeTransaction | undefined {
    return this.data.recharge_transactions.find((r) => r.orderId === orderId);
  }

  getRechargeById(rechargeId: string): RechargeTransaction | undefined {
    return this.data.recharge_transactions.find((r) => r.rechargeId === rechargeId);
  }

  updateRechargeTransaction(rechargeId: string, updates: Partial<RechargeTransaction>): RechargeTransaction | null {
    const idx = this.data.recharge_transactions.findIndex((r) => r.rechargeId === rechargeId);
    if (idx === -1) return null;
    this.data.recharge_transactions[idx] = {
      ...this.data.recharge_transactions[idx],
      ...updates,
    };
    this.scheduleSave();
    return this.data.recharge_transactions[idx];
  }

  getAllRecharges(limit = 100): RechargeTransaction[] {
    return this.data.recharge_transactions.slice(0, limit);
  }

  // --- UTR Submissions ---
  createUtrSubmission(sub: UtrSubmission): UtrSubmission {
    this.data.utr_submissions.unshift(sub);
    this.scheduleSave();
    return sub;
  }

  getUtrByNumber(utrNumber: string): UtrSubmission | undefined {
    const clean = utrNumber.trim().toUpperCase();
    return this.data.utr_submissions.find((u) => u.utrNumber.trim().toUpperCase() === clean);
  }

  getUtrSubmissions(): UtrSubmission[] {
    return [...this.data.utr_submissions];
  }

  getUtrByOrderId(orderId: string): UtrSubmission | undefined {
    return this.data.utr_submissions.find((u) => u.orderId === orderId);
  }

  updateUtrSubmission(id: string, updates: Partial<UtrSubmission>): UtrSubmission | null {
    const idx = this.data.utr_submissions.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.data.utr_submissions[idx] = {
      ...this.data.utr_submissions[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.scheduleSave();
    return this.data.utr_submissions[idx];
  }

  // --- Webhooks ---
  createWebhookEvent(event: WebhookEvent): WebhookEvent {
    this.data.webhook_events.unshift(event);
    this.scheduleSave();
    return event;
  }

  getWebhookEventById(eventId: string): WebhookEvent | undefined {
    return this.data.webhook_events.find((e) => e.eventId === eventId);
  }

  getAllWebhooks(limit = 100): WebhookEvent[] {
    return this.data.webhook_events.slice(0, limit);
  }

  // --- Audit Logs ---
  addAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): AuditLog {
    const newLog: AuditLog = {
      ...log,
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.audit_logs.unshift(newLog);
    // Keep max 2000 logs
    if (this.data.audit_logs.length > 2000) {
      this.data.audit_logs.pop();
    }
    this.scheduleSave();
    return newLog;
  }

  getAuditLogs(limit = 100): AuditLog[] {
    return this.data.audit_logs.slice(0, limit);
  }

  // --- Settings ---
  getSettings(): SystemSettings {
    return { ...this.data.settings };
  }

  updateSettings(updates: Partial<SystemSettings>): SystemSettings {
    this.data.settings = {
      ...this.data.settings,
      ...updates,
    };
    this.scheduleSave();
    return { ...this.data.settings };
  }

  // --- Users Tracking ---
  private trackUser(mobileNumber: string) {
    const existing = this.data.users.find((u) => u.mobileNumber === mobileNumber);
    if (existing) {
      existing.lastActive = new Date().toISOString();
    } else {
      this.data.users.push({
        id: `usr_${Date.now()}`,
        mobileNumber,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      });
    }
  }

  getUsersCount(): number {
    return this.data.users.length;
  }

  // --- Admin ---
  getAdminByEmail(email: string): AdminUser | undefined {
    return this.data.admins.find((a) => a.email.toLowerCase() === email.toLowerCase());
  }

  // --- Statistics for Admin Dashboard ---
  getDashboardStats() {
    const totalOrders = this.data.orders.length;
    const successfulOrders = this.data.orders.filter((o) => o.rechargeStatus === 'SUCCESS').length;
    const totalPaidAmount = this.data.orders
      .filter((o) => o.paymentStatus === 'SUCCESS')
      .reduce((sum, o) => sum + o.payableAmount, 0);
    const totalDiscountGiven = this.data.orders
      .filter((o) => o.paymentStatus === 'SUCCESS')
      .reduce((sum, o) => sum + o.discount, 0);
    const totalRechargeDelivered = this.data.orders
      .filter((o) => o.rechargeStatus === 'SUCCESS')
      .reduce((sum, o) => sum + o.planPrice, 0);
    const pendingUtrs = this.data.utr_submissions.filter((u) => u.status === 'PENDING').length;
    const failedRecharges = this.data.orders.filter((o) => o.rechargeStatus === 'FAILED').length;

    return {
      totalOrders,
      successfulOrders,
      successRate: totalOrders > 0 ? Math.round((successfulOrders / totalOrders) * 100) : 100,
      totalPaidAmount,
      totalDiscountGiven,
      totalRechargeDelivered,
      pendingUtrs,
      failedRecharges,
      activePlansCount: this.data.recharge_plans.filter((p) => p.isActive).length,
      usersCount: this.data.users.length,
    };
  }
}

export const db = new Database();
