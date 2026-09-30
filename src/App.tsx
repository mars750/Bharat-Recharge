import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { OperatorSelect } from './components/OperatorSelect';
import { PlanCatalog } from './components/PlanCatalog';
import { MobileNumberStep } from './components/MobileNumberStep';
import { PaymentView } from './components/PaymentView';
import { RechargeStatusView } from './components/RechargeStatusView';
import { MyOrdersView } from './components/MyOrdersView';
import { AdminPortal } from './components/AdminPortal';
import { TestSuiteModal } from './components/TestSuiteModal';
import { UpiConfigModal } from './components/UpiConfigModal';
import { DownloadApkModal } from './components/DownloadApkModal';
import { Operator, OperatorId, Order, PaymentDetails, RechargePlan } from './types';
import { api } from './services/api';
import { RefreshCw, ShieldCheck, Zap, Download } from 'lucide-react';

export default function App() {
  // Top Level Navigation
  const [activeTab, setActiveTab] = useState<'recharge' | 'orders' | 'admin'>('recharge');
  const [isTestSuiteOpen, setIsTestSuiteOpen] = useState(false);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);

  // Receiving UPI ID Settings State (Default: rolexmars37-1@oksbi)
  const [merchantUpiVpa, setMerchantUpiVpa] = useState<string>('rolexmars37-1@oksbi');
  const [merchantUpiName, setMerchantUpiName] = useState<string>('Rolex Mars');

  // Recharge Flow States (Step 1 -> 2 -> 3 -> 4 -> 5)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Operators
  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<OperatorId | null>(null);

  // Step 2: Plans Catalog
  const [plans, setPlans] = useState<RechargePlan[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(5);
  const [selectedPlan, setSelectedPlan] = useState<RechargePlan | null>(null);
  const [circle, setCircle] = useState<string>('Delhi NCR');
  const [loadingPlans, setLoadingPlans] = useState(false);

  // Step 3: Mobile Number & Order Creation
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  // Step 4: Dynamic Payment
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);

  // Initial load: Fetch operators and active merchant UPI settings
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [ops, upiData] = await Promise.all([
          api.getOperators(),
          api.getUpiSettings().catch(() => ({ upiMerchantVpa: 'rolexmars37-1@oksbi', upiMerchantName: 'Rolex Mars' })),
        ]);
        setOperators(ops);
        if (upiData.upiMerchantVpa) {
          setMerchantUpiVpa(upiData.upiMerchantVpa);
          setMerchantUpiName(upiData.upiMerchantName);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };
    loadInitialData();
  }, []);

  // When operator is chosen, fetch live plans from database
  const handleSelectOperator = async (opId: OperatorId) => {
    setSelectedOperator(opId);
    setSelectedPlan(null);
    setLoadingPlans(true);
    setCurrentStep(2);

    try {
      const data = await api.getPlans(opId);
      setPlans(data.plans);
      setDiscountAmount(data.discountAmount);
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoadingPlans(false);
    }
  };

  // When plan is chosen, transition to Mobile Number entry
  const handleSelectPlan = (plan: RechargePlan) => {
    setSelectedPlan(plan);
    setCurrentStep(3);
  };

  // Submit Mobile Number to create order on backend and generate Dynamic UPI QR for exact payable amount
  const handleSubmitOrder = async (mobileNumber: string) => {
    if (!selectedOperator || !selectedPlan) return;

    setIsCreatingOrder(true);
    try {
      const result = await api.createOrder({
        mobileNumber,
        operator: selectedOperator,
        planId: selectedPlan.id,
        circle,
      });

      setCurrentOrder(result.order);

      // Immediately generate dynamic UPI QR code with official merchant UPI and exact payable amount
      setLoadingPayment(true);
      const paymentData = await api.createPayment(result.order.orderId);
      setPaymentDetails(paymentData);
      setLoadingPayment(false);

      // Move to Payment Step
      setCurrentStep(4);
    } catch (err) {
      setIsCreatingOrder(false);
      setLoadingPayment(false);
      throw err;
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // When payment is verified (via webhook or UTR approval)
  const handlePaymentSuccess = (updatedOrder: Order) => {
    setCurrentOrder(updatedOrder);
    setCurrentStep(5);
  };

  // Reset to start a new recharge
  const handleResetRecharge = () => {
    setSelectedOperator(null);
    setSelectedPlan(null);
    setCurrentOrder(null);
    setPaymentDetails(null);
    setCurrentStep(1);
    setActiveTab('recharge');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'recharge' && currentStep === 5) {
            handleResetRecharge();
          }
        }}
        onOpenTestSuite={() => setIsTestSuiteOpen(true)}
        onOpenDownloadApk={() => setIsApkModalOpen(true)}
        merchantUpiVpa={merchantUpiVpa}
        onOpenAdminUpiConfig={() => setIsUpiModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* RECHARGE FLOW */}
        {activeTab === 'recharge' && (
          <div className="space-y-6">
            {/* Step 1: Select Operator */}
            {currentStep === 1 && (
              <OperatorSelect
                operators={operators}
                selectedOperator={selectedOperator}
                onSelectOperator={handleSelectOperator}
              />
            )}

            {/* Step 2: Select Plan */}
            {currentStep === 2 && selectedOperator && (
              <>
                {loadingPlans ? (
                  <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-xs">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                    <p className="font-extrabold text-slate-800 text-sm">
                      Loading {selectedOperator.toUpperCase()} prepaid plans from database...
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Fetching live tariffs & automatic ₹5 discount configuration
                    </p>
                  </div>
                ) : (
                  <PlanCatalog
                    operator={selectedOperator}
                    plans={plans}
                    discountAmount={discountAmount}
                    selectedPlan={selectedPlan}
                    onSelectPlan={handleSelectPlan}
                    onBack={() => setCurrentStep(1)}
                    circle={circle}
                    setCircle={setCircle}
                  />
                )}
              </>
            )}

            {/* Step 3: Enter Mobile Number & Order Summary */}
            {currentStep === 3 && selectedOperator && selectedPlan && (
              <MobileNumberStep
                operator={selectedOperator}
                plan={selectedPlan}
                circle={circle}
                onBack={() => setCurrentStep(2)}
                onSubmitOrder={handleSubmitOrder}
                isLoading={isCreatingOrder || loadingPayment}
                merchantUpiVpa={merchantUpiVpa}
                merchantUpiName={merchantUpiName}
              />
            )}

            {/* Step 4: Scan Dynamic UPI QR Code */}
            {currentStep === 4 && currentOrder && paymentDetails && (
              <PaymentView
                order={currentOrder}
                paymentDetails={paymentDetails}
                onPaymentSuccess={handlePaymentSuccess}
                onCancel={() => setCurrentStep(2)}
              />
            )}

            {/* Step 5: Recharge Status & Official Receipt */}
            {currentStep === 5 && currentOrder && (
              <RechargeStatusView
                order={currentOrder}
                onNewRecharge={handleResetRecharge}
                onViewOrders={() => setActiveTab('orders')}
              />
            )}
          </div>
        )}

        {/* MY ORDERS TAB */}
        {activeTab === 'orders' && (
          <MyOrdersView onNewRecharge={handleResetRecharge} />
        )}

        {/* ADMIN CONTROL TAB */}
        {activeTab === 'admin' && <AdminPortal />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-slate-500 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-800">BharatRecharge</span>
            <span>•</span>
            <span>Jio & Airtel Instant UPI Recharge Engine</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-600 font-medium flex items-center gap-1">
              <span>Payee: <strong className="text-slate-800">{merchantUpiName}</strong> ({merchantUpiVpa})</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              NPCI Dynamic UPI 2.0
            </span>
            <span>•</span>
            <button
              onClick={() => setIsApkModalOpen(true)}
              className="text-emerald-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Android APK</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setIsTestSuiteOpen(true)}
              className="text-indigo-600 font-bold hover:underline cursor-pointer"
            >
              Run E2E Tests
            </button>
          </div>
        </div>
      </footer>

      {/* Download Android APK Modal */}
      <DownloadApkModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />

      {/* Automated Test Suite Modal */}
      <TestSuiteModal
        isOpen={isTestSuiteOpen}
        onClose={() => setIsTestSuiteOpen(false)}
      />

      {/* Merchant UPI Configuration Modal */}
      <UpiConfigModal
        isOpen={isUpiModalOpen}
        onClose={() => setIsUpiModalOpen(false)}
        currentVpa={merchantUpiVpa}
        currentName={merchantUpiName}
        onSaved={(newVpa, newName) => {
          setMerchantUpiVpa(newVpa);
          setMerchantUpiName(newName);
        }}
        sampleAmount={selectedPlan ? Math.max(1, selectedPlan.price - discountAmount) : 294}
      />
    </div>
  );
}
