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
  price: number; // e.g. 299 (full telecom plan price)
  validity: string; // e.g. "28 Days"
  data: string; // e.g. "1.5 GB/Day"
  voice: string; // e.g. "Unlimited"
  sms: string; // e.g. "100 SMS/Day"
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
  mobileNumber: string; // 10 digits
  operator: OperatorId;
  circle: string;
  planId: string;
  planPrice: number; // e.g. 299
  discount: number; // e.g. 5
  payableAmount: number; // e.g. 294
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

export interface Payment {
  paymentId: string;
  orderId: string;
  amount: number; // 294
  currency: 'INR';
  status: PaymentStatus;
  gateway: 'UPI_DYNAMIC_QR' | 'SIMULATOR';
  gatewayTxnId: string;
  upiVpa: string;
  upiIntentUrl: string;
  qrData: string;
  idempotencyKey?: string;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RechargeTransaction {
  rechargeId: string;
  orderId: string;
  operator: OperatorId;
  mobileNumber: string;
  planId: string;
  rechargeAmount: number; // 299 (full plan value delivered to customer)
  customerPaid: number; // 294
  status: RechargeStatus;
  operatorRefNum: string | null;
  responseMessage: string;
  createdAt: string;
  completedAt: string | null;
}

export type UtrStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface UtrSubmission {
  id: string;
  orderId: string;
  utrNumber: string;
  submittedAmount: number;
  status: UtrStatus;
  adminNotes?: string;
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEvent {
  eventId: string;
  eventType: string;
  orderId: string;
  amount: number;
  gatewayTxnId: string;
  signature: string;
  verified: boolean;
  status: 'PROCESSED' | 'FAILED' | 'IGNORED';
  ipAddress?: string;
  createdAt: string;
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

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'ops_admin';
  createdAt: string;
}

export interface SystemSettings {
  discountAmount: number; // e.g. 5
  mockPaymentMode: boolean;
  mockRechargeMode: boolean;
  simulateFailureRate: number; // 0 to 100 percent
  upiMerchantVpa: string;
  upiMerchantName: string;
}
