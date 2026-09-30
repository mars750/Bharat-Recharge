import crypto from 'crypto';
import QRCode from 'qrcode';
import { db } from '../db';
import { getRechargeProvider } from '../recharge/provider';
import { Order, Payment } from '../types';

export const WEBHOOK_SECRET =
  process.env.PAYMENT_WEBHOOK_SECRET || 'whsec_bharat_recharge_live_secure_key_2026';

export interface CreatePaymentParams {
  order: Order;
  ipAddress?: string;
  customUpiVpa?: string;
  customMerchantName?: string;
}

export interface PaymentCreationResult {
  payment: Payment;
  qrCodeUrl: string;
  upiIntentUrl: string;
}

export interface WebhookPayload {
  eventId: string;
  eventType: 'payment.success' | 'payment.failed';
  orderId: string;
  amount: number;
  currency: string;
  gatewayTxnId: string;
  bankRefNumber?: string;
  payerVpa?: string;
  timestamp: string;
}

/**
 * Builds the official NPCI UPI URI string.
 */
export function buildUpiUri(params: {
  vpa: string;
  name: string;
  amount: number;
  orderId: string;
  operator: string;
  mobile: string;
}): string {
  const encName = encodeURIComponent(params.name);
  const encNote = encodeURIComponent(`Recharge ${params.operator.toUpperCase()} ${params.mobile}`);
  const amountStr = params.amount.toFixed(2);

  // Standard UPI URI format:
  // upi://pay?pa=...&pn=...&am=...&cu=INR&tr=...&tn=...
  return `upi://pay?pa=${params.vpa}&pn=${encName}&am=${amountStr}&cu=INR&tr=${params.orderId}&tn=${encNote}`;
}

/**
 * Generates dynamic QR code and sets up payment intent.
 */
export async function createDynamicUpiPayment(params: CreatePaymentParams): Promise<PaymentCreationResult> {
  const { order } = params;
  const settings = db.getSettings();

  // The receiver VPA is strictly locked to the merchant's official UPI ID configured by Admin
  const effectiveVpa = settings.upiMerchantVpa || 'rolexmars37-1@oksbi';
  const effectiveName = settings.upiMerchantName || 'Rolex Mars';

  const upiIntentUrl = buildUpiUri({
    vpa: effectiveVpa,
    name: effectiveName,
    amount: order.payableAmount, // Exact payable amount, e.g. 294.00
    orderId: order.orderId,
    operator: order.operator,
    mobile: order.mobileNumber,
  });

  // Generate dynamic QR Code Data URL with dark brand coloring
  const qrCodeUrl = await QRCode.toDataURL(upiIntentUrl, {
    errorCorrectionLevel: 'H',
    margin: 2,
    scale: 8,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });

  const paymentId = `PAY-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const gatewayTxnId = `GTW-UPI-${Date.now()}`;

  const payment: Payment = {
    paymentId,
    orderId: order.orderId,
    amount: order.payableAmount, // Exactly ₹294
    currency: 'INR',
    status: 'PENDING',
    gateway: 'UPI_DYNAMIC_QR',
    gatewayTxnId,
    upiVpa: effectiveVpa,
    upiIntentUrl,
    qrData: upiIntentUrl,
    verifiedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.createPayment(payment);
  db.updateOrder(order.orderId, { paymentId });

  db.addAuditLog({
    action: 'PAYMENT_CREATED',
    entity: 'orders',
    entityId: order.orderId,
    actor: 'SYSTEM',
    details: {
      paymentId,
      payableAmount: order.payableAmount,
      planPrice: order.planPrice,
      discount: order.discount,
      upiVpa: effectiveVpa,
    },
    ipAddress: params.ipAddress || '127.0.0.1',
  });

  return {
    payment,
    qrCodeUrl,
    upiIntentUrl,
  };
}

/**
 * Generates HMAC-SHA256 signature for webhook payload.
 */
export function generateWebhookSignature(payload: unknown, secret = WEBHOOK_SECRET): string {
  const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(serialized).digest('hex');
}

/**
 * Verifies HMAC-SHA256 signature in timing-safe way.
 */
export function verifyWebhookSignature(payload: unknown, signatureHeader: string, secret = WEBHOOK_SECRET): boolean {
  try {
    if (!signatureHeader) return false;
    const computed = generateWebhookSignature(payload, secret);
    const bufA = Buffer.from(computed, 'utf-8');
    const bufB = Buffer.from(signatureHeader.trim(), 'utf-8');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

/**
 * Server-side payment verification pipeline.
 * Never trust frontend, screenshot, or raw client inputs.
 */
export async function processVerifiedWebhook(
  payload: WebhookPayload,
  signature: string,
  ipAddress = '127.0.0.1'
): Promise<{ success: boolean; message: string; order?: Order }> {
  // 1. Signature Verification
  const isSignatureValid = verifyWebhookSignature(payload, signature);
  if (!isSignatureValid) {
    db.createWebhookEvent({
      eventId: payload.eventId || `ERR-${Date.now()}`,
      eventType: payload.eventType || 'unknown',
      orderId: payload.orderId || '',
      amount: payload.amount || 0,
      gatewayTxnId: payload.gatewayTxnId || '',
      signature,
      verified: false,
      status: 'FAILED',
      ipAddress,
      createdAt: new Date().toISOString(),
    });

    db.addAuditLog({
      action: 'WEBHOOK_SIGNATURE_FAILED',
      entity: 'payments',
      entityId: payload.orderId || 'unknown',
      actor: 'WEBHOOK',
      details: { providedSignature: signature },
      ipAddress,
    });

    return { success: false, message: 'Invalid cryptographic webhook signature' };
  }

  // 2. Idempotency Check: prevent duplicate webhook processing
  const existingWebhook = db.getWebhookEventById(payload.eventId);
  if (existingWebhook && existingWebhook.status === 'PROCESSED') {
    return {
      success: true,
      message: 'Event previously processed (Idempotent response)',
      order: db.getOrderById(payload.orderId),
    };
  }

  // 3. Order Verification
  const order = db.getOrderById(payload.orderId);
  if (!order) {
    return { success: false, message: `Order ${payload.orderId} does not exist` };
  }

  // Check if order is already fulfilled or paid
  if (order.paymentStatus === 'SUCCESS') {
    return {
      success: true,
      message: 'Order already paid and verified (Idempotent)',
      order,
    };
  }

  // 4. Strict Amount Verification: payment MUST match payable_amount
  // e.g., ₹294 for ₹299 plan with ₹5 discount.
  if (Number(payload.amount) !== Number(order.payableAmount)) {
    db.addAuditLog({
      action: 'PAYMENT_AMOUNT_MISMATCH',
      entity: 'orders',
      entityId: order.orderId,
      actor: 'WEBHOOK',
      details: {
        expectedAmount: order.payableAmount,
        receivedAmount: payload.amount,
      },
      ipAddress,
    });

    return {
      success: false,
      message: `Amount mismatch: Received ₹${payload.amount} but order payable amount is ₹${order.payableAmount}`,
    };
  }

  // Record successful webhook event
  db.createWebhookEvent({
    eventId: payload.eventId,
    eventType: payload.eventType,
    orderId: payload.orderId,
    amount: payload.amount,
    gatewayTxnId: payload.gatewayTxnId,
    signature,
    verified: true,
    status: 'PROCESSED',
    ipAddress,
    createdAt: new Date().toISOString(),
  });

  if (payload.eventType === 'payment.failed') {
    db.updateOrder(order.orderId, {
      paymentStatus: 'FAILED',
      failureReason: 'Payment declined by issuing bank/UPI rail',
    });
    db.updatePayment(order.paymentId || '', { status: 'FAILED' });
    return { success: false, message: 'Payment failed' };
  }

  // 5. Payment Success State Update
  const updatedOrder = db.updateOrder(order.orderId, {
    paymentStatus: 'SUCCESS',
    rechargeStatus: 'PROCESSING',
    updatedAt: new Date().toISOString(),
  })!;

  const payment = db.getPaymentByOrderId(order.orderId);
  if (payment) {
    db.updatePayment(payment.paymentId, {
      status: 'SUCCESS',
      verifiedAt: new Date().toISOString(),
      gatewayTxnId: payload.gatewayTxnId,
    });
  }

  db.addAuditLog({
    action: 'PAYMENT_VERIFIED_SUCCESS',
    entity: 'orders',
    entityId: order.orderId,
    actor: 'WEBHOOK',
    details: {
      payableAmount: order.payableAmount,
      gatewayTxnId: payload.gatewayTxnId,
      bankRef: payload.bankRefNumber,
    },
    ipAddress,
  });

  // 6. Trigger Recharge Pipeline
  // Notice: We pass order.planPrice (e.g. ₹299) to the recharge provider,
  // NOT the discounted customer payment amount (₹294).
  const rechargeProvider = getRechargeProvider();

  // Create initial recharge transaction entry
  const rechargeTxnId = `RCH-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  db.createRechargeTransaction({
    rechargeId: rechargeTxnId,
    orderId: order.orderId,
    operator: order.operator,
    mobileNumber: order.mobileNumber,
    planId: order.planId,
    rechargeAmount: order.planPrice, // Full plan value: ₹299
    customerPaid: order.payableAmount, // ₹294
    status: 'PROCESSING',
    operatorRefNum: null,
    responseMessage: 'Initiating telecom switch API...',
    createdAt: new Date().toISOString(),
    completedAt: null,
  });

  try {
    const rechargeResult = await rechargeProvider.createRecharge({
      orderId: order.orderId,
      mobileNumber: order.mobileNumber,
      operator: order.operator,
      planId: order.planId,
      amount: order.planPrice, // ₹299
    });

    if (rechargeResult.success && rechargeResult.status === 'SUCCESS') {
      db.updateRechargeTransaction(rechargeTxnId, {
        status: 'SUCCESS',
        operatorRefNum: rechargeResult.operatorRefNum || null,
        responseMessage: rechargeResult.message,
        completedAt: new Date().toISOString(),
      });

      const finalOrder = db.updateOrder(order.orderId, {
        rechargeStatus: 'SUCCESS',
        rechargeTxnId: rechargeResult.rechargeTxnId,
        operatorRefNum: rechargeResult.operatorRefNum,
      })!;

      db.addAuditLog({
        action: 'RECHARGE_SUCCESS',
        entity: 'orders',
        entityId: order.orderId,
        actor: 'TELECOM_GATEWAY',
        details: {
          operator: order.operator,
          mobile: order.mobileNumber,
          planPrice: order.planPrice,
          operatorRef: rechargeResult.operatorRefNum,
        },
        ipAddress,
      });

      return {
        success: true,
        message: 'Payment verified and recharge completed successfully!',
        order: finalOrder,
      };
    } else {
      // Telecom API failed
      db.updateRechargeTransaction(rechargeTxnId, {
        status: 'FAILED',
        responseMessage: rechargeResult.message,
        completedAt: new Date().toISOString(),
      });

      const finalOrder = db.updateOrder(order.orderId, {
        rechargeStatus: 'FAILED',
        failureReason: rechargeResult.message,
      })!;

      // Mark refund queue as required
      db.updateOrder(order.orderId, {
        rechargeStatus: 'REFUND_PENDING',
      });

      db.addAuditLog({
        action: 'RECHARGE_FAILED_REFUND_QUEUED',
        entity: 'orders',
        entityId: order.orderId,
        actor: 'TELECOM_GATEWAY',
        details: {
          error: rechargeResult.message,
          refundAmount: order.payableAmount,
        },
        ipAddress,
      });

      return {
        success: false,
        message: `Recharge failed: ${rechargeResult.message}. Refund queued.`,
        order: finalOrder,
      };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Telecom switch exception';
    db.updateOrder(order.orderId, {
      rechargeStatus: 'REFUND_PENDING',
      failureReason: errorMsg,
    });

    return {
      success: false,
      message: `Recharge execution error: ${errorMsg}. Refund queued.`,
      order: updatedOrder,
    };
  }
}
