import React from 'react';
import { Order } from '../types';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Printer,
  Download,
  Share2,
  Zap,
  PhoneCall,
  Calendar,
  Wifi,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface RechargeStatusViewProps {
  order: Order;
  onNewRecharge: () => void;
  onViewOrders: () => void;
}

export const RechargeStatusView: React.FC<RechargeStatusViewProps> = ({
  order,
  onNewRecharge,
  onViewOrders,
}) => {
  const isSuccess = order.rechargeStatus === 'SUCCESS';
  const isFailed = order.rechargeStatus === 'FAILED' || order.rechargeStatus === 'REFUND_PENDING';
  const isProcessing = order.rechargeStatus === 'PROCESSING';

  const isJio = order.operator === 'jio';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Status Header Banner */}
      <div
        className={`rounded-2xl p-6 sm:p-8 text-center text-white shadow-xl transition-all ${
          isSuccess
            ? 'bg-gradient-to-b from-emerald-600 to-teal-800'
            : isFailed
            ? 'bg-gradient-to-b from-red-600 to-rose-900'
            : 'bg-gradient-to-b from-blue-600 to-indigo-900'
        }`}
      >
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 bg-white/20 backdrop-blur-md shadow-inner">
          {isSuccess ? (
            <CheckCircle2 className="w-10 h-10 text-white animate-bounce" />
          ) : isFailed ? (
            <XCircle className="w-10 h-10 text-white" />
          ) : (
            <RefreshCw className="w-10 h-10 text-white animate-spin" />
          )}
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
          {isSuccess
            ? 'Recharge Successful!'
            : isFailed
            ? 'Recharge Failed • Refund Queued'
            : 'Processing Mobile Recharge...'}
        </h2>

        <p className="text-sm text-white/90 max-w-md mx-auto">
          {isSuccess
            ? `Your ${order.operator.toUpperCase()} prepaid mobile number +91 ${order.mobileNumber} has been successfully recharged with the ₹${order.planPrice} plan.`
            : isFailed
            ? `Operator switch reported an error: ${order.failureReason || 'Gateway timeout'}. A full refund of ₹${order.payableAmount} has been queued back to your UPI account.`
            : `Bank payment of ₹${order.payableAmount} verified! Handshaking with ${order.operator.toUpperCase()} telecom gateway...`}
        </p>

        {isSuccess && (
          <div className="inline-flex items-center gap-1.5 mt-4 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-md">
            <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
            <span>You Saved ₹{order.discount}.00 on this Recharge!</span>
          </div>
        )}
      </div>

      {/* State Machine Visualizer */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          Recharge Pipeline Lifecycle
        </p>

        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {/* Step 1 */}
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs mb-1">
              ✓
            </div>
            <span className="font-semibold text-slate-800 text-[11px]">Order Created</span>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs mb-1">
              ✓
            </div>
            <span className="font-semibold text-slate-800 text-[11px]">Payment Verified</span>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1 ${
                isSuccess || isFailed
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-blue-100 text-blue-700 animate-pulse'
              }`}
            >
              {isSuccess || isFailed ? '✓' : '3'}
            </div>
            <span className="font-semibold text-slate-800 text-[11px]">Gateway Switch</span>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col items-center">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1 ${
                isSuccess
                  ? 'bg-emerald-600 text-white'
                  : isFailed
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {isSuccess ? '✓' : isFailed ? '✕' : '4'}
            </div>
            <span
              className={`font-semibold text-[11px] ${
                isSuccess
                  ? 'text-emerald-700'
                  : isFailed
                  ? 'text-red-700'
                  : 'text-slate-400'
              }`}
            >
              {isSuccess ? 'Recharge Done' : isFailed ? 'Refund Queued' : 'Recharging'}
            </span>
          </div>
        </div>
      </div>

      {/* Official Transaction Receipt */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-sm">Official Transaction Receipt</h3>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>

        <div className="p-6 space-y-3.5 text-sm">
          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Order ID:</span>
            <span className="font-mono font-bold text-slate-900">{order.orderId}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Mobile Number:</span>
            <span className="font-mono font-bold text-slate-900">+91 {order.mobileNumber}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Telecom Operator:</span>
            <span className="font-bold text-slate-800">
              {isJio ? 'Reliance Jio Infocomm' : 'Bharti Airtel Ltd'}
            </span>
          </div>

          {order.operatorRefNum && (
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Operator Ref No:</span>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                {order.operatorRefNum}
              </span>
            </div>
          )}

          {/* Critical financial breakdown */}
          <div className="bg-slate-50 p-4 rounded-xl space-y-2 mt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Recharge Plan Value (Credited to SIM):</span>
              <span className="font-bold text-slate-900">₹{order.planPrice}.00</span>
            </div>

            <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
              <span>BharatRecharge Server Discount:</span>
              <span>- ₹{order.discount}.00</span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs">Total Amount Paid by Customer:</span>
              <span className="text-lg font-black text-slate-900">₹{order.payableAmount}.00</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
            <span>Date & Time:</span>
            <span>{new Date(order.updatedAt || order.createdAt).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onNewRecharge}
          className="flex-1 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <span>Recharge Another Number</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={onViewOrders}
          className="py-3.5 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
        >
          View My Orders
        </button>
      </div>
    </div>
  );
};
