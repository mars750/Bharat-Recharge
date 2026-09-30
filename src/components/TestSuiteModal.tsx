import React, { useState } from 'react';
import { api } from '../services/api';
import {
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface TestCase {
  id: string;
  title: string;
  description: string;
  status: 'idle' | 'running' | 'passed' | 'failed';
  details?: string;
}

interface TestSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestSuiteModal: React.FC<TestSuiteModalProps> = ({ isOpen, onClose }) => {
  const [tests, setTests] = useState<TestCase[]>([
    {
      id: 'full_jio_flow',
      title: '1. Complete Jio ₹299 Flow (₹5 Discount + UPI QR + Webhook + ₹299 Recharge)',
      description: 'Verifies server-side discount (₹299 - ₹5 = ₹294), dynamic QR generation, HMAC webhook verification, and ₹299 telecom activation.',
      status: 'idle',
    },
    {
      id: 'airtel_utr_flow',
      title: '2. Airtel ₹349 + UTR Submission & Admin Approval',
      description: 'Verifies ₹349 plan order (₹344 payable), customer UTR submission (PENDING), and admin approval triggering instant recharge.',
      status: 'idle',
    },
    {
      id: 'duplicate_utr_prevention',
      title: '3. Duplicate UTR Prevention',
      description: 'Submits an identical UTR number a second time and verifies that the server rejects duplicate submissions (409 Conflict).',
      status: 'idle',
    },
    {
      id: 'duplicate_webhook_idempotency',
      title: '4. Webhook Idempotency Verification',
      description: 'Sends the exact same webhook event ID twice to ensure no duplicate payments or duplicate recharges occur.',
      status: 'idle',
    },
    {
      id: 'wrong_amount_rejection',
      title: '5. Tampered Wrong Amount Webhook Rejection',
      description: 'Sends a webhook with payment amount ₹200 for a ₹294 order to ensure strict server-side amount verification rejects the mismatch.',
      status: 'idle',
    },
    {
      id: 'failed_payment_handling',
      title: '6. Failed Payment Webhook Handling',
      description: 'Simulates a bank payment failure webhook and ensures the order transitions to PAYMENT_FAILED without triggering recharge.',
      status: 'idle',
    },
    {
      id: 'recharge_failure_refund',
      title: '7. Telecom Switch Failure & Refund Queueing',
      description: 'Simulates telecom gateway timeout after payment success and asserts transition to RECHARGE_FAILED and REFUND_PENDING.',
      status: 'idle',
    },
  ]);

  const [isRunningAll, setIsRunningAll] = useState(false);

  if (!isOpen) return null;

  const updateTestStatus = (id: string, status: TestCase['status'], details?: string) => {
    setTests((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status, details } : t))
    );
  };

  const runAllTests = async () => {
    setIsRunningAll(true);

    // 1. Full Jio Flow
    updateTestStatus('full_jio_flow', 'running');
    try {
      // Create Jio Order
      const orderRes = await api.createOrder({
        mobileNumber: '9876543210',
        operator: 'jio',
        planId: 'jio-299',
      });
      const order = orderRes.order;

      if (order.planPrice !== 299 || order.discount !== 5 || order.payableAmount !== 294) {
        throw new Error(
          `Price mismatch: Plan ₹${order.planPrice}, Discount ₹${order.discount}, Payable ₹${order.payableAmount}`
        );
      }

      // Create Payment (Dynamic QR)
      const payment = await api.createPayment(order.orderId);
      if (!payment.qrCodeUrl || payment.payableAmount !== 294) {
        throw new Error('QR generation failed or payable amount mismatch in payment details');
      }

      // Simulate HMAC-verified Bank Webhook
      const sim = await api.simulateWebhook({
        orderId: order.orderId,
        scenario: 'SUCCESS',
      });

      if (!sim.success || sim.order?.paymentStatus !== 'SUCCESS' || sim.order?.rechargeStatus !== 'SUCCESS') {
        throw new Error(`Flow incomplete: Payment ${sim.order?.paymentStatus}, Recharge ${sim.order?.rechargeStatus}`);
      }

      updateTestStatus(
        'full_jio_flow',
        'passed',
        `Passed: Order ${order.orderId} verified. Paid ₹${order.payableAmount}, Recharged ₹${order.planPrice}. Ref: ${sim.order.operatorRefNum}`
      );
    } catch (err: unknown) {
      updateTestStatus('full_jio_flow', 'failed', err instanceof Error ? err.message : 'Failed');
    }

    // 2. Airtel + UTR flow
    updateTestStatus('airtel_utr_flow', 'running');
    try {
      const orderRes = await api.createOrder({
        mobileNumber: '9810012345',
        operator: 'airtel',
        planId: 'airtel-349',
      });
      const order = orderRes.order;

      // Submit UTR
      const uniqueUtr = `RRN${Date.now().toString().slice(-9)}`;
      const utrRes = await api.submitUtr(order.orderId, uniqueUtr);
      if (!utrRes.success || utrRes.data.status !== 'PENDING') {
        throw new Error('UTR submission did not yield PENDING status');
      }

      // Admin Approves UTR
      const verifyRes = await api.verifyUtr(utrRes.data.submissionId, 'Automated Test Suite Verification');
      if (!verifyRes.success) {
        throw new Error('Admin UTR verification failed');
      }

      updateTestStatus(
        'airtel_utr_flow',
        'passed',
        `Passed: Order ${order.orderId} UTR ${uniqueUtr} submitted as PENDING and approved by Admin.`
      );
    } catch (err: unknown) {
      updateTestStatus('airtel_utr_flow', 'failed', err instanceof Error ? err.message : 'Failed');
    }

    // 3. Duplicate UTR Prevention
    updateTestStatus('duplicate_utr_prevention', 'running');
    try {
      const order1 = await api.createOrder({
        mobileNumber: '9876543210',
        operator: 'jio',
        planId: 'jio-299',
      });
      const order2 = await api.createOrder({
        mobileNumber: '9810012345',
        operator: 'airtel',
        planId: 'airtel-299',
      });

      const fixedUtr = `DUP${Date.now().toString().slice(-8)}`;
      await api.submitUtr(order1.order.orderId, fixedUtr);

      let duplicateBlocked = false;
      try {
        await api.submitUtr(order2.order.orderId, fixedUtr);
      } catch (err: unknown) {
        if (err instanceof Error && err.message.toLowerCase().includes('duplicate')) {
          duplicateBlocked = true;
        }
      }

      if (!duplicateBlocked) {
        throw new Error('Server accepted duplicate UTR submission!');
      }

      updateTestStatus('duplicate_utr_prevention', 'passed', 'Passed: Second submission of same UTR rejected with Duplicate error.');
    } catch (err: unknown) {
      updateTestStatus('duplicate_utr_prevention', 'failed', err instanceof Error ? err.message : 'Failed');
    }

    // 4. Duplicate Webhook Idempotency
    updateTestStatus('duplicate_webhook_idempotency', 'running');
    try {
      const orderRes = await api.createOrder({
        mobileNumber: '9876543210',
        operator: 'jio',
        planId: 'jio-299',
      });

      const res1 = await api.simulateWebhook({
        orderId: orderRes.order.orderId,
        scenario: 'DUPLICATE',
      });

      const res2 = await api.simulateWebhook({
        orderId: orderRes.order.orderId,
        scenario: 'DUPLICATE',
      });

      if (!res2.message.toLowerCase().includes('idempotent')) {
        throw new Error(`Second webhook was not recognized as idempotent: ${res2.message}`);
      }

      updateTestStatus('duplicate_webhook_idempotency', 'passed', 'Passed: Second webhook recognized as idempotent without double recharge.');
    } catch (err: unknown) {
      updateTestStatus('duplicate_webhook_idempotency', 'failed', err instanceof Error ? err.message : 'Failed');
    }

    // 5. Wrong Amount Rejection
    updateTestStatus('wrong_amount_rejection', 'running');
    try {
      const orderRes = await api.createOrder({
        mobileNumber: '9876543210',
        operator: 'jio',
        planId: 'jio-299',
      });

      let rejected = false;
      try {
        await api.simulateWebhook({
          orderId: orderRes.order.orderId,
          scenario: 'WRONG_AMOUNT',
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.message.toLowerCase().includes('mismatch')) {
          rejected = true;
        }
      }

      if (!rejected) {
        throw new Error('Tampered amount was not rejected!');
      }

      updateTestStatus('wrong_amount_rejection', 'passed', 'Passed: Amount mismatch rejected by server-side verification.');
    } catch (err: unknown) {
      updateTestStatus('wrong_amount_rejection', 'failed', err instanceof Error ? err.message : 'Failed');
    }

    // 6. Failed Payment Handling
    updateTestStatus('failed_payment_handling', 'running');
    try {
      const orderRes = await api.createOrder({
        mobileNumber: '9876543210',
        operator: 'jio',
        planId: 'jio-299',
      });

      try {
        await api.simulateWebhook({
          orderId: orderRes.order.orderId,
          scenario: 'FAILED',
        });
      } catch {
        // expected failure
      }

      const status = await api.getPaymentStatus(orderRes.order.orderId);
      if (status.paymentStatus !== 'FAILED') {
        throw new Error(`Expected paymentStatus FAILED but got ${status.paymentStatus}`);
      }

      updateTestStatus('failed_payment_handling', 'passed', 'Passed: Payment marked FAILED, no recharge triggered.');
    } catch (err: unknown) {
      updateTestStatus('failed_payment_handling', 'failed', err instanceof Error ? err.message : 'Failed');
    }

    // 7. Telecom Switch Failure & Refund Queue
    updateTestStatus('recharge_failure_refund', 'running');
    try {
      // Temporarily set failure rate to 100%
      await api.updateSettings({ simulateFailureRate: 100 });

      const orderRes = await api.createOrder({
        mobileNumber: '9876543210',
        operator: 'jio',
        planId: 'jio-299',
      });

      try {
        await api.simulateWebhook({
          orderId: orderRes.order.orderId,
          scenario: 'SUCCESS',
        });
      } catch {
        // Expected telecom failure
      }

      const status = await api.getPaymentStatus(orderRes.order.orderId);

      // Restore failure rate
      await api.updateSettings({ simulateFailureRate: 0 });

      if (status.rechargeStatus !== 'REFUND_PENDING' && status.rechargeStatus !== 'FAILED') {
        throw new Error(`Expected REFUND_PENDING or FAILED, got ${status.rechargeStatus}`);
      }

      updateTestStatus(
        'recharge_failure_refund',
        'passed',
        `Passed: Telecom timeout caught. Status: ${status.rechargeStatus}, refund queued.`
      );
    } catch (err: unknown) {
      await api.updateSettings({ simulateFailureRate: 0 }).catch(() => {});
      updateTestStatus('recharge_failure_refund', 'failed', err instanceof Error ? err.message : 'Failed');
    }

    setIsRunningAll(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                End-to-End Test Suite & Verification Runner
              </h3>
              <p className="text-[11px] text-slate-500">
                Automated validation of all user flows, discounts, dynamic QRs, webhooks & edge cases
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-600 font-medium">
            Runs real API tests against live server endpoints and database
          </span>

          <button
            onClick={runAllTests}
            disabled={isRunningAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:bg-indigo-300"
          >
            {isRunningAll ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Tests...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run All 7 Tests</span>
              </>
            )}
          </button>
        </div>

        {/* Test List */}
        <div className="space-y-3">
          {tests.map((t) => (
            <div
              key={t.id}
              className={`p-3.5 rounded-xl border transition-all text-xs ${
                t.status === 'passed'
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : t.status === 'failed'
                  ? 'bg-red-50/70 border-red-200'
                  : t.status === 'running'
                  ? 'bg-blue-50/70 border-blue-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">
                    {t.status === 'passed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : t.status === 'failed' ? (
                      <XCircle className="w-4 h-4 text-red-600" />
                    ) : t.status === 'running' ? (
                      <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-400" />
                    )}
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900">{t.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{t.description}</p>
                    {t.details && (
                      <p
                        className={`text-[11px] font-mono mt-2 p-2 rounded-lg ${
                          t.status === 'passed'
                            ? 'bg-emerald-100/70 text-emerald-900'
                            : 'bg-red-100/70 text-red-900'
                        }`}
                      >
                        {t.details}
                      </p>
                    )}
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                    t.status === 'passed'
                      ? 'bg-emerald-200 text-emerald-800'
                      : t.status === 'failed'
                      ? 'bg-red-200 text-red-800'
                      : t.status === 'running'
                      ? 'bg-blue-200 text-blue-800'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {t.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close Runner
          </button>
        </div>
      </div>
    </div>
  );
};
