import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { api } from '../services/api';
import {
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';

interface MyOrdersViewProps {
  onSelectOrderToView?: (order: Order) => void;
  onNewRecharge: () => void;
}

export const MyOrdersView: React.FC<MyOrdersViewProps> = ({
  onSelectOrderToView,
  onNewRecharge,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchMobile, setSearchMobile] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await api.getOrders({
        mobile: searchMobile ? searchMobile.trim() : undefined,
      });
      setOrders(data.orders);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">My Recharge Orders</h2>
          <p className="text-xs text-slate-500">
            Track real-time recharge status, payments, and operator reference numbers
          </p>
        </div>

        <button
          onClick={onNewRecharge}
          className="self-start sm:self-auto py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          + New Recharge
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchMobile}
            onChange={(e) => setSearchMobile(e.target.value)}
            placeholder="Search by 10-digit mobile number or Order ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
        >
          Filter
        </button>
      </form>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-semibold">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Smartphone className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">No orders found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven&apos;t placed any recharge orders yet or no records match your search.
          </p>
          <button
            onClick={onNewRecharge}
            className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Start a Recharge Now
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((ord) => {
            const isJio = ord.operator === 'jio';
            const isSuccess = ord.rechargeStatus === 'SUCCESS';
            const isFailed = ord.rechargeStatus === 'FAILED' || ord.rechargeStatus === 'REFUND_PENDING';
            const isPending = ord.paymentStatus === 'PENDING';

            return (
              <div
                key={ord.orderId}
                onClick={() => setSelectedOrder(ord)}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0 ${
                      isJio ? 'bg-[#002B9A]' : 'bg-[#C80000]'
                    }`}
                  >
                    {isJio ? 'JIO' : 'AIR'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">
                        +91 {ord.mobileNumber}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {ord.operator}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span>Order: <strong className="font-mono text-slate-700">{ord.orderId}</strong></span>
                      <span>•</span>
                      <span>{new Date(ord.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>

                    {ord.operatorRefNum && (
                      <p className="text-[11px] font-mono text-emerald-700 mt-1">
                        Ref: {ord.operatorRefNum}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <span className="text-base font-black text-slate-900">
                      ₹{ord.payableAmount}.00
                    </span>
                    <span className="text-[10px] text-emerald-600 block font-semibold">
                      ₹{ord.planPrice} Plan (-₹{ord.discount} OFF)
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="mt-1">
                    {isSuccess ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        Recharge Success
                      </span>
                    ) : isFailed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3" />
                        Refund Queued
                      </span>
                    ) : isPending ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        <Clock className="w-3 h-3" />
                        Payment Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Processing
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Recharge Order Details</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Order ID:</span>
                <span className="font-mono font-bold text-slate-900">{selectedOrder.orderId}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Mobile Number:</span>
                <span className="font-mono font-bold text-slate-900">+91 {selectedOrder.mobileNumber}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Telecom Operator:</span>
                <span className="font-bold uppercase text-slate-900">{selectedOrder.operator}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Recharge Value:</span>
                <span className="font-bold text-slate-900">₹{selectedOrder.planPrice}.00</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700">
                <span className="font-medium">BharatRecharge Discount:</span>
                <span className="font-bold">- ₹{selectedOrder.discount}.00</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Customer Paid:</span>
                <span className="font-black text-slate-900 text-base">₹{selectedOrder.payableAmount}.00</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Status:</span>
                <span className="font-bold text-slate-900">{selectedOrder.paymentStatus}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Recharge Delivery:</span>
                <span className="font-bold text-slate-900">{selectedOrder.rechargeStatus}</span>
              </div>

              {selectedOrder.operatorRefNum && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Carrier Reference:</span>
                  <span className="font-mono font-bold text-emerald-700">{selectedOrder.operatorRefNum}</span>
                </div>
              )}

              {selectedOrder.utrNumber && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Submitted UTR / RRN:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedOrder.utrNumber}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
