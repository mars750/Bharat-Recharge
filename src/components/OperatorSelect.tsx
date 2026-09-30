import React from 'react';
import { Operator, OperatorId } from '../types';
import { ShieldCheck, Zap, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface OperatorSelectProps {
  operators: Operator[];
  selectedOperator: OperatorId | null;
  onSelectOperator: (operatorId: OperatorId) => void;
}

export const OperatorSelect: React.FC<OperatorSelectProps> = ({
  operators,
  selectedOperator,
  onSelectOperator,
}) => {
  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>₹5 Flat Instant Discount on Every Recharge</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Instant Prepaid Recharge for{' '}
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-red-400 bg-clip-text text-transparent">
              Jio & Airtel
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            Pay safely with dynamic UPI QR & direct intent. Get an instant server-verified ₹5 discount.
            Recharge is executed in milliseconds after payment verification.
          </p>

          {/* Quick Perks */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Full Plan Value Recharged</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Dynamic UPI QR (₹294 for ₹299)</span>
            </div>
            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Cryptographic Verification</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operator Selection Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Select Mobile Operator</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Step 1 of 4
            </span>
          </h2>
          <span className="text-xs text-slate-500">Official Prepaid Plans</span>
        </div>

        {/* Operator Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {operators.map((op) => {
            const isJio = op.id === 'jio';
            const isSelected = selectedOperator === op.id;

            return (
              <div
                key={op.id}
                onClick={() => onSelectOperator(op.id)}
                className={`relative group cursor-pointer rounded-2xl p-5 border-2 transition-all duration-200 overflow-hidden ${
                  isSelected
                    ? isJio
                      ? 'border-blue-600 bg-blue-50/50 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/20'
                      : 'border-red-600 bg-red-50/50 shadow-lg shadow-red-500/10 ring-2 ring-red-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* Glow accent */}
                <div
                  className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-15 pointer-events-none ${
                    isJio ? 'bg-blue-600' : 'bg-red-600'
                  }`}
                />

                <div className="relative z-10 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {/* Operator Brand Icon */}
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md transition-transform group-hover:scale-105 ${
                        isJio
                          ? 'bg-gradient-to-tr from-[#002B9A] to-[#0055FF]'
                          : 'bg-gradient-to-tr from-[#C80000] to-[#FF3B30]'
                      }`}
                    >
                      {isJio ? 'Jio' : 'airtel'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-lg text-slate-900">{op.name}</h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isJio
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {op.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">{op.tagline}</p>
                    </div>
                  </div>

                  {/* Radio selector circle */}
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? isJio
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-red-600 bg-red-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>

                {/* Operator Highlights */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Unlimited 5G Data</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Instant Auto-Activation</span>
                  </div>
                </div>

                {/* Select button banner */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60">
                    Pay ₹294 for ₹299 plan
                  </span>
                  <span
                    className={`text-xs font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform ${
                      isJio ? 'text-blue-600' : 'text-red-600'
                    }`}
                  >
                    View Plans
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
