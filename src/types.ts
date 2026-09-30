export type OperatorId = 'jio' | 'airtel';

export interface Operator {
  id: OperatorId;
  name: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  badge: string;
  isActive: boolean;
}

export interface RechargePlan {
  id: string;
  operatorId: OperatorId;
  category: 'Popular 5G' | 'Daily Data' | 'Annual' | 'Data Booster' | 'Value Pack';
  name: string;
  price: number; // e.g. 299
  validity: string;
  data: string;
  voice: string;
  sms: string;
  benefits: string[];
  isPopular?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
export type RechargeStatus = 'NOT_STARTED' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REFUND_PENDING';

export interface Order {
  orderId: string;
  mobileNumber: string;
  operator: OperatorId;
  circle: string;
  planId: string;
  planPrice: number; // 299
  discount: number; // 5
  payableAmount: number; // 294
  paymentStatus: PaymentStatus;
  rechargeStatus: RechargeStatus;
  paymentId?: string;
  utrNumber?: string;
  rechargeTxnId?: string;
  operatorRefNum?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentDetails {
  orderId: string;
  paymentId: string;
  payableAmount: number;
  currency: string;
  upiVpa: string;
  upiMerchantName: string;
  qrCodeUrl: string;
  upiIntentUrl: string;
  expiresInSeconds: number;
  status: PaymentStatus;
  mockMode: boolean;
}

export interface UtrSubmission {
  id: string;
  orderId: string;
  utrNumber: string;
  submittedAmount: number;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  adminNotes?: string;
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalOrders: number;
  successfulOrders: number;
  successRate: number;
  totalPaidAmount: number;
  totalDiscountGiven: number;
  totalRechargeDelivered: number;
  pendingUtrs: number;
  failedRecharges: number;
  activePlansCount: number;
  usersCount: number;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  actor: string;
  details: Record<string, unknown>;
  ipAddress: string;
  createdAt: string;
}

export interface SystemSettings {
  discountAmount: number;
  mockPaymentMode: boolean;
  mockRechargeMode: boolean;
  simulateFailureRate: number;
  upiMerchantVpa: string;
  upiMerchantName: string;
}
