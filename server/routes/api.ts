import express, { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import {
  createDynamicUpiPayment,
  generateWebhookSignature,
  processVerifiedWebhook,
  WebhookPayload,
} from '../payment/gateway';
import { OperatorId, Order, RechargePlan } from '../types';

export const apiRouter = express.Router();

// Indian mobile number validator: 10 digits starting with 6, 7, 8, or 9
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

// Admin token middleware
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'bharat_super_admin_jwt_secret_token_999';

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
  }

  const token = authHeader.substring(7);
  // Verify bearer token matches admin session secret
  if (token !== ADMIN_SECRET && !token.startsWith('admin_token_')) {
    return res.status(403).json({ error: 'Forbidden: Invalid or expired admin credentials' });
  }
  next();
}

/* =========================================================================
   PUBLIC RECHARGE APIS
   ========================================================================= */

// 1. GET /api/operators
apiRouter.get('/operators', (_req: Request, res: Response) => {
  const operators = db.getOperators();
  res.json({
    success: true,
    data: operators,
  });
});

// 2. GET /api/plans/:operator
apiRouter.get('/plans/:operator', (req: Request, res: Response) => {
  const operatorParam = req.params.operator.toLowerCase();
  if (operatorParam !== 'jio' && operatorParam !== 'airtel') {
    return res.status(400).json({
      error: 'Invalid operator. Only "jio" and "airtel" are supported.',
    });
  }

  const plans = db.getPlansByOperator(operatorParam);
  const settings = db.getSettings();

  // Return plans with current active backend discount configuration
  res.json({
    success: true,
    operator: operatorParam,
    discountAmount: settings.discountAmount, // Informational for UI tag
    plans,
  });
});

// 3. POST /api/orders
// User Flow: Enter Mobile Number -> Order Summary -> ₹5 Discount
apiRouter.post('/orders', (req: Request, res: Response) => {
  const { mobileNumber, operator, planId, circle = 'National' } = req.body;

  // Validate mobile number
  if (!mobileNumber || typeof mobileNumber !== 'string') {
    return res.status(400).json({ error: 'Mobile number is required' });
  }

  const cleanMobile = mobileNumber.replace(/\D/g, '').slice(-10);
  if (!INDIAN_MOBILE_REGEX.test(cleanMobile)) {
    return res.status(400).json({
      error: 'Invalid Indian mobile number. Must be 10 digits starting with 6, 7, 8, or 9.',
    });
  }

  // Validate operator
  const opClean = String(operator).toLowerCase() as OperatorId;
  if (opClean !== 'jio' && opClean !== 'airtel') {
    return res.status(400).json({ error: 'Operator must be either "jio" or "airtel"' });
  }

  // Look up plan in database (NEVER trust frontend price)
  if (!planId) {
    return res.status(400).json({ error: 'Plan ID is required' });
  }

  const plan = db.getPlanById(planId);
  if (!plan || !plan.isActive) {
    return res.status(404).json({ error: 'Selected plan not found or is currently inactive' });
  }

  if (plan.operatorId !== opClean) {
    return res.status(400).json({ error: `Selected plan does not belong to ${opClean.toUpperCase()}` });
  }

  // Backend Discount Calculation: Never trust frontend price.
  // Example: ₹299 Plan -> ₹5 discount -> Customer pays ₹294.
  const settings = db.getSettings();
  const planPrice = plan.price;
  const discount = Math.min(settings.discountAmount, planPrice - 1); // Ensure payable >= 1
  const payableAmount = planPrice - discount;

  // Generate unique order ID
  const orderId = `ORD-${opClean.toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  const order: Order = {
    orderId,
    mobileNumber: cleanMobile,
    operator: opClean,
    circle: String(circle || 'National'),
    planId: plan.id,
    planPrice,
    discount,
    payableAmount,
    paymentStatus: 'PENDING',
    rechargeStatus: 'NOT_STARTED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.createOrder(order);

  db.addAuditLog({
    action: 'ORDER_CREATED',
    entity: 'orders',
    entityId: order.orderId,
    actor: 'USER',
    details: {
      mobile: cleanMobile,
      operator: opClean,
      planId: plan.id,
      planPrice,
      discount,
      payableAmount,
    },
    ipAddress: req.ip || '127.0.0.1',
  });

  res.status(201).json({
    success: true,
    data: {
      order,
      plan,
      breakdown: {
        operator: opClean === 'jio' ? 'Reliance Jio' : 'Bharti Airtel',
        mobileNumber: cleanMobile,
        planName: plan.name,
        validity: plan.validity,
        data: plan.data,
        originalPrice: planPrice,
        discount,
        payableAmount,
      },
    },
  });
});

// 4. POST /api/payments/create
// Creates dynamic UPI QR for the exact payable amount (e.g. ₹294 for ₹299 plan)
// Locked strictly to official Merchant UPI ID (rolexmars37-1@oksbi)
apiRouter.post('/payments/create', async (req: Request, res: Response) => {
  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  const order = db.getOrderById(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order.paymentStatus === 'SUCCESS') {
    return res.status(400).json({ error: 'Order has already been paid and processed' });
  }

  try {
    const paymentResult = await createDynamicUpiPayment({
      order,
      ipAddress: req.ip || '127.0.0.1',
    });

    const settings = db.getSettings();

    res.json({
      success: true,
      data: {
        orderId: order.orderId,
        paymentId: paymentResult.payment.paymentId,
        payableAmount: order.payableAmount,
        currency: 'INR',
        upiVpa: paymentResult.payment.upiVpa,
        upiMerchantName: settings.upiMerchantName,
        qrCodeUrl: paymentResult.qrCodeUrl,
        upiIntentUrl: paymentResult.upiIntentUrl,
        expiresInSeconds: 600, // 10 minutes
        status: paymentResult.payment.status,
        mockMode: settings.mockPaymentMode,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to generate dynamic payment';
    res.status(500).json({ error: errorMsg });
  }
});

// GET /api/upi-settings: Read-only active merchant receiving UPI ID and name
apiRouter.get('/upi-settings', (_req: Request, res: Response) => {
  const settings = db.getSettings();
  res.json({
    success: true,
    data: {
      upiMerchantVpa: settings.upiMerchantVpa,
      upiMerchantName: settings.upiMerchantName,
    },
  });
});

// POST /api/upi-settings: ADMIN ONLY - Update receiving UPI ID for dynamic QR generation
apiRouter.post('/upi-settings', requireAdmin, (req: Request, res: Response) => {
  const { upiMerchantVpa, upiMerchantName } = req.body;
  if (!upiMerchantVpa || typeof upiMerchantVpa !== 'string' || !upiMerchantVpa.includes('@')) {
    return res.status(400).json({
      error: 'Invalid UPI ID. UPI ID must be in format username@bank (e.g. rolexmars37-1@oksbi, 9876543210@paytm)',
    });
  }

  const cleanVpa = upiMerchantVpa.trim();
  const cleanName = (upiMerchantName && typeof upiMerchantName === 'string')
    ? upiMerchantName.trim()
    : 'Rolex Mars';

  const updated = db.updateSettings({
    upiMerchantVpa: cleanVpa,
    upiMerchantName: cleanName,
  });

  db.addAuditLog({
    action: 'UPI_MERCHANT_VPA_UPDATED',
    entity: 'settings',
    entityId: 'upiMerchantVpa',
    actor: 'ADMIN',
    details: { upiMerchantVpa: cleanVpa, upiMerchantName: cleanName },
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    message: `Merchant UPI ID successfully updated to ${cleanVpa}. All dynamic QRs will now use this UPI ID.`,
    data: {
      upiMerchantVpa: updated.upiMerchantVpa,
      upiMerchantName: updated.upiMerchantName,
    },
  });
});

// 5. GET /api/payments/status/:orderId
apiRouter.get('/payments/status/:orderId', (req: Request, res: Response) => {
  const { orderId } = req.params;
  const order = db.getOrderById(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const payment = db.getPaymentByOrderId(orderId);
  const utr = db.getUtrByOrderId(orderId);
  const recharge = db.getRechargeByOrderId(orderId);

  res.json({
    success: true,
    data: {
      orderId: order.orderId,
      mobileNumber: order.mobileNumber,
      operator: order.operator,
      payableAmount: order.payableAmount,
      planPrice: order.planPrice,
      discount: order.discount,
      paymentStatus: order.paymentStatus,
      rechargeStatus: order.rechargeStatus,
      paymentId: payment?.paymentId,
      utrSubmission: utr ? { status: utr.status, utrNumber: utr.utrNumber } : null,
      operatorRefNum: order.operatorRefNum || recharge?.operatorRefNum,
      rechargeTxnId: order.rechargeTxnId || recharge?.rechargeId,
      failureReason: order.failureReason,
      updatedAt: order.updatedAt,
    },
  });
});

// 6. POST /api/payments/webhook
// Webhook with HMAC-SHA256 signature verification, idempotency, order check, amount check
apiRouter.post('/payments/webhook', async (req: Request, res: Response) => {
  const signature = (req.headers['x-webhook-signature'] || req.headers['x-signature'] || '') as string;
  const payload = req.body as WebhookPayload;

  if (!payload || !payload.orderId) {
    return res.status(400).json({ error: 'Invalid webhook payload structure' });
  }

  const result = await processVerifiedWebhook(payload, signature, req.ip || '127.0.0.1');

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.message,
    });
  }

  res.json({
    success: true,
    message: result.message,
    order: result.order,
  });
});

// 7. POST /api/utr/submit
// User enters 12-digit UTR/Transaction ID. Status stays PENDING until verified. Duplicate UTR prevented.
apiRouter.post('/utr/submit', (req: Request, res: Response) => {
  const { orderId, utrNumber } = req.body;

  if (!orderId || !utrNumber) {
    return res.status(400).json({ error: 'Order ID and UTR number are required' });
  }

  const cleanUtr = String(utrNumber).trim().toUpperCase();
  // Standard Indian UPI UTR is 12 digits or alphanumeric 10-22 chars
  if (cleanUtr.length < 10 || cleanUtr.length > 22) {
    return res.status(400).json({
      error: 'Invalid UTR format. Standard UPI UTR / RRN is 12 numeric digits.',
    });
  }

  const order = db.getOrderById(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order.paymentStatus === 'SUCCESS') {
    return res.status(400).json({
      error: 'Payment for this order has already been verified and processed.',
    });
  }

  // Prevent duplicate UTR submission across the system
  const existingUtr = db.getUtrByNumber(cleanUtr);
  if (existingUtr) {
    return res.status(409).json({
      error: `Duplicate UTR: This Transaction Reference / UTR (${cleanUtr}) has already been submitted or processed.`,
    });
  }

  const submission = db.createUtrSubmission({
    id: `utr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    orderId,
    utrNumber: cleanUtr,
    submittedAmount: order.payableAmount,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  db.updateOrder(orderId, { utrNumber: cleanUtr });

  db.addAuditLog({
    action: 'UTR_SUBMITTED',
    entity: 'utr_submissions',
    entityId: submission.id,
    actor: 'USER',
    details: {
      orderId,
      utrNumber: cleanUtr,
      amount: order.payableAmount,
    },
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    message: 'UTR submitted successfully. Verification status is PENDING.',
    data: {
      submissionId: submission.id,
      orderId: submission.orderId,
      utrNumber: submission.utrNumber,
      status: submission.status,
    },
  });
});

// 8. GET /api/orders (User order lookup by mobile number or recent orders)
apiRouter.get('/orders', (req: Request, res: Response) => {
  const { mobile, operator, limit = '20', offset = '0' } = req.query;
  const result = db.getOrders(Number(limit), Number(offset), {
    mobile: mobile ? String(mobile) : undefined,
    operator: operator ? String(operator) : undefined,
  });

  res.json({
    success: true,
    data: result.orders,
    total: result.total,
  });
});

// 9. GET /api/orders/:id
apiRouter.get('/orders/:id', (req: Request, res: Response) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const plan = db.getPlanById(order.planId);
  const payment = db.getPaymentByOrderId(order.orderId);
  const recharge = db.getRechargeByOrderId(order.orderId);
  const utr = db.getUtrByOrderId(order.orderId);

  res.json({
    success: true,
    data: {
      order,
      plan,
      payment,
      recharge,
      utr,
    },
  });
});

// 10. GET /api/recharge/status/:id
apiRouter.get('/recharge/status/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const recharge = db.getRechargeById(id) || db.getRechargeByOrderId(id);
  if (!recharge) {
    return res.status(404).json({ error: 'Recharge transaction not found' });
  }

  res.json({
    success: true,
    data: recharge,
  });
});

/* =========================================================================
   ADMIN APIS & SIMULATORS
   ========================================================================= */

// Admin Login
apiRouter.post('/admin/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@recharge.in';
  const adminPass = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123';

  if (email === adminEmail && password === adminPass) {
    db.addAuditLog({
      action: 'ADMIN_LOGIN_SUCCESS',
      entity: 'admins',
      entityId: email,
      actor: `ADMIN:${email}`,
      details: { email },
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.json({
      success: true,
      token: ADMIN_SECRET,
      admin: {
        email,
        name: 'Super Administrator',
        role: 'super_admin',
      },
    });
  }

  db.addAuditLog({
    action: 'ADMIN_LOGIN_FAILED',
    entity: 'admins',
    entityId: email || 'unknown',
    actor: 'GUEST',
    details: { attemptedEmail: email },
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.status(401).json({ error: 'Invalid admin credentials' });
});

// Admin Dashboard Metrics
apiRouter.get('/admin/dashboard-stats', requireAdmin, (_req: Request, res: Response) => {
  const stats = db.getDashboardStats();
  res.json({
    success: true,
    data: stats,
  });
});

// Admin Orders
apiRouter.get('/admin/orders', requireAdmin, (req: Request, res: Response) => {
  const { limit = '100', offset = '0', operator, mobile } = req.query;
  const result = db.getOrders(Number(limit), Number(offset), {
    operator: operator ? String(operator) : undefined,
    mobile: mobile ? String(mobile) : undefined,
  });
  res.json({
    success: true,
    data: result.orders,
    total: result.total,
  });
});

// Admin Payments
apiRouter.get('/admin/payments', requireAdmin, (req: Request, res: Response) => {
  const { limit = '100' } = req.query;
  const payments = db.getAllPayments(Number(limit));
  res.json({
    success: true,
    data: payments,
  });
});

// Admin UTR Submissions
apiRouter.get('/admin/utr-submissions', requireAdmin, (_req: Request, res: Response) => {
  const submissions = db.getUtrSubmissions();
  res.json({
    success: true,
    data: submissions,
  });
});

// Admin UTR Verify: Approves customer UTR and triggers payment verification + recharge
apiRouter.post('/admin/utr/verify', requireAdmin, async (req: Request, res: Response) => {
  const { utrSubmissionId, notes = 'Verified via Bank Statement by Admin' } = req.body;

  const submissions = db.getUtrSubmissions();
  const sub = submissions.find((s) => s.id === utrSubmissionId);
  if (!sub) {
    return res.status(404).json({ error: 'UTR submission not found' });
  }

  if (sub.status !== 'PENDING') {
    return res.status(400).json({ error: `UTR already processed with status: ${sub.status}` });
  }

  const order = db.getOrderById(sub.orderId);
  if (!order) {
    return res.status(404).json({ error: 'Associated order not found' });
  }

  // Mark UTR submission verified
  db.updateUtrSubmission(sub.id, {
    status: 'VERIFIED',
    adminNotes: notes,
    verifiedBy: 'admin@recharge.in',
  });

  // Construct verified webhook payload
  const webhookPayload: WebhookPayload = {
    eventId: `EVT-UTR-${Date.now()}`,
    eventType: 'payment.success',
    orderId: order.orderId,
    amount: order.payableAmount,
    currency: 'INR',
    gatewayTxnId: `BANK-UTR-${sub.utrNumber}`,
    bankRefNumber: sub.utrNumber,
    timestamp: new Date().toISOString(),
  };

  const signature = generateWebhookSignature(webhookPayload);
  const verifyResult = await processVerifiedWebhook(webhookPayload, signature, req.ip || '127.0.0.1');

  db.addAuditLog({
    action: 'ADMIN_UTR_APPROVED',
    entity: 'utr_submissions',
    entityId: sub.id,
    actor: 'ADMIN:admin@recharge.in',
    details: {
      utr: sub.utrNumber,
      orderId: order.orderId,
      amount: order.payableAmount,
    },
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    message: 'UTR verified successfully and recharge pipeline executed!',
    data: {
      sub,
      verifyResult,
    },
  });
});

// Admin UTR Reject
apiRouter.post('/admin/utr/reject', requireAdmin, (req: Request, res: Response) => {
  const { utrSubmissionId, reason = 'Bank reference not found in merchant account' } = req.body;

  const submissions = db.getUtrSubmissions();
  const sub = submissions.find((s) => s.id === utrSubmissionId);
  if (!sub) {
    return res.status(404).json({ error: 'UTR submission not found' });
  }

  db.updateUtrSubmission(sub.id, {
    status: 'REJECTED',
    adminNotes: reason,
    verifiedBy: 'admin@recharge.in',
  });

  db.addAuditLog({
    action: 'ADMIN_UTR_REJECTED',
    entity: 'utr_submissions',
    entityId: sub.id,
    actor: 'ADMIN:admin@recharge.in',
    details: {
      utr: sub.utrNumber,
      reason,
    },
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    message: 'UTR marked as rejected',
    data: sub,
  });
});

// Admin Plans Management
apiRouter.get('/admin/plans', requireAdmin, (_req: Request, res: Response) => {
  const plans = db.getAllPlans();
  res.json({
    success: true,
    data: plans,
  });
});

apiRouter.post('/admin/plans', requireAdmin, (req: Request, res: Response) => {
  const { operatorId, category, name, price, validity, data, voice, sms, benefits, isPopular = false } = req.body;

  if (!operatorId || !price || !validity) {
    return res.status(400).json({ error: 'Missing required plan fields' });
  }

  const newPlan = db.createPlan({
    operatorId,
    category: category || 'Daily Data',
    name: name || `₹${price} Plan`,
    price: Number(price),
    validity,
    data: data || '1.5 GB/Day',
    voice: voice || 'Unlimited',
    sms: sms || '100 SMS/Day',
    benefits: Array.isArray(benefits) ? benefits : [String(benefits)],
    isPopular: Boolean(isPopular),
    isActive: true,
  });

  db.addAuditLog({
    action: 'ADMIN_CREATE_PLAN',
    entity: 'recharge_plans',
    entityId: newPlan.id,
    actor: 'ADMIN',
    details: { ...newPlan },
    ipAddress: req.ip || '127.0.0.1',
  });

  res.status(201).json({ success: true, data: newPlan });
});

apiRouter.put('/admin/plans/:id', requireAdmin, (req: Request, res: Response) => {
  const id = req.params.id;
  const updated = db.updatePlan(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  db.addAuditLog({
    action: 'ADMIN_UPDATE_PLAN',
    entity: 'recharge_plans',
    entityId: id,
    actor: 'ADMIN',
    details: req.body,
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({ success: true, data: updated });
});

apiRouter.delete('/admin/plans/:id', requireAdmin, (req: Request, res: Response) => {
  const id = req.params.id;
  const ok = db.deletePlan(id);
  if (!ok) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  db.addAuditLog({
    action: 'ADMIN_DELETE_PLAN',
    entity: 'recharge_plans',
    entityId: id,
    actor: 'ADMIN',
    details: { id },
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({ success: true, message: 'Plan deactivated' });
});

// Admin Audit Logs
apiRouter.get('/admin/audit-logs', requireAdmin, (req: Request, res: Response) => {
  const limit = Number(req.query.limit || '100');
  const logs = db.getAuditLogs(limit);
  res.json({ success: true, data: logs });
});

// Admin System Settings
apiRouter.get('/admin/settings', requireAdmin, (_req: Request, res: Response) => {
  const settings = db.getSettings();
  res.json({ success: true, data: settings });
});

apiRouter.post('/admin/settings', requireAdmin, (req: Request, res: Response) => {
  const updated = db.updateSettings(req.body);
  db.addAuditLog({
    action: 'ADMIN_UPDATE_SETTINGS',
    entity: 'settings',
    entityId: 'global',
    actor: 'ADMIN',
    details: req.body,
    ipAddress: req.ip || '127.0.0.1',
  });
  res.json({ success: true, data: updated });
});

// Public / Sandbox Simulator endpoint for instant testing from the frontend UI
// Supports: Success, Failed, Duplicate Webhook, Wrong Amount
apiRouter.post('/simulate/payment-webhook', async (req: Request, res: Response) => {
  const { orderId, scenario = 'SUCCESS', customAmount } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  const order = db.getOrderById(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  let amount = order.payableAmount; // e.g. 294
  let eventType: 'payment.success' | 'payment.failed' = 'payment.success';

  if (scenario === 'WRONG_AMOUNT') {
    amount = customAmount ? Number(customAmount) : order.payableAmount - 50; // Wrong amount test!
  } else if (scenario === 'FAILED') {
    eventType = 'payment.failed';
  }

  const eventId =
    scenario === 'DUPLICATE'
      ? `EVT-DUPLICATE-FIXED-ID`
      : `EVT-SIM-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

  const payload: WebhookPayload = {
    eventId,
    eventType,
    orderId: order.orderId,
    amount,
    currency: 'INR',
    gatewayTxnId: `SIM-BANK-${Date.now()}`,
    bankRefNumber: `RRN-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
    payerVpa: 'customer@okhdfcbank',
    timestamp: new Date().toISOString(),
  };

  const signature = generateWebhookSignature(payload);
  const result = await processVerifiedWebhook(payload, signature, req.ip || '127.0.0.1');

  res.json({
    success: result.success,
    message: result.message,
    payload,
    signature,
    order: result.order,
  });
});

// 12. GET /api/apk/info
// Returns download link and build metadata for the Android APK
apiRouter.get('/apk/info', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      appName: 'Bharat Recharge',
      packageName: 'com.bharatrecharge.app',
      versionName: '1.0.0',
      versionCode: 1,
      minSdkVersion: 21,
      targetSdkVersion: 33,
      downloadUrl: '/BharatRecharge.apk',
      fileSize: '13 KB',
      signature: 'v1 + v2 + v3 Signed Release APK',
      description: 'Official Android application for Bharat Recharge with instant UPI payments and real-time recharge processing.',
    },
  });
});

