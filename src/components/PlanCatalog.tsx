import React, { useState } from 'react';
import { OperatorId, RechargePlan } from '../types';
import {
  ArrowLeft,
  Search,
  Zap,
  Sparkles,
  PhoneCall,
  Wifi,
  Calendar,
  MessageSquare,
  Check,
  Tag,
  MapPin,
} from 'lucide-react';

interface PlanCatalogProps {
  operator: OperatorId;
  plans: RechargePlan[];
  discountAmount: number;
  selectedPlan: RechargePlan | null;
  onSelectPlan: (plan: RechargePlan) => void;
  onBack: () => void;
  circle: string;
  setCircle: (circle: string) => void;
}

const CIRCLES = [
  'Delhi NCR',
  'Maharashtra & Goa',
  'Mumbai',
  'Karnataka',
  'Tamil Nadu & Chennai',
  'Andhra Pradesh & Telangana',
  'Gujarat',
  'Uttar Pradesh (East)',
  'Uttar Pradesh (West)',
  'West Bengal & Kolkata',
  'Rajasthan',
  'Punjab',
  'Kerala',
  'Madhya Pradesh & CG',
  'Bihar & Jharkhand',
  'National (All Circles)',
];

export const PlanCatalog: React.FC<PlanCatalogProps> = ({
  operator,
  plans,
  discountAmount,
  selectedPlan,
  onSelectPlan,
  onBack,
  circle,
  setCircle,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isJio = operator === 'jio';
  const brandColor = isJio ? 'blue' : 'red';

  const categories = ['All', 'Popular 5G', 'Daily Data', 'Annual', 'Data Booster'];

  const filteredPlans = plans.filter((plan) => {
    // Category match
    const categoryMatch = activeCategory === 'All' || plan.category === activeCategory;

    // Search query match (price or benefit or name)
    const q = searchQuery.toLowerCase().trim();
    const queryMatch =
      !q ||
      plan.price.toString().includes(q) ||
      plan.name.toLowerCase().includes(q) ||
      plan.data.toLowerCase().includes(q) ||
      plan.validity.toLowerCase().includes(q) ||
      plan.benefits.some((b) => b.toLowerCase().includes(q));

    return categoryMatch && queryMatch;
  });

  return (
    <div className="space-y-6">
      {/* Top Navigation & Operator Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Change operator"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`font-black px-2 py-0.5 rounded text-white text-xs ${
                  isJio ? 'bg-[#002B9A]' : 'bg-[#C80000]'
                }`}
              >
                {isJio ? 'JIO' : 'AIRTEL'}
              </span>
              <h2 className="text-xl font-extrabold text-slate-900">
                {isJio ? 'Reliance Jio Prepaid Plans' : 'Bharti Airtel Prepaid Plans'}
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Showing live database plans • Step 2 of 4
            </p>
          </div>
        </div>

        {/* Circle Selector */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 self-start sm:self-auto">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-500 font-medium">Telecom Circle:</span>
          <select
            value={circle}
            onChange={(e) => setCircle(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
          >
            {CIRCLES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Backend Discount Callout */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0">
            ₹{discountAmount}
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <span>Automatic Flat ₹{discountAmount} Discount Applied on Every Plan</span>
              <span className="text-[10px] bg-emerald-200 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded">
                SERVER VERIFIED
              </span>
            </div>
            <p className="text-[11px] text-emerald-700">
              E.g. ₹299 plan → You pay ₹{299 - discountAmount}. Your mobile receives full ₹299 telecom plan!
            </p>
          </div>
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by amount (e.g. 299), data (e.g. 2GB), or benefit (e.g. Hotstar, 5G)..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? isJio
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-red-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlans.map((plan) => {
          const isSelected = selectedPlan?.id === plan.id;
          const discountedPayable = Math.max(1, plan.price - discountAmount);

          return (
            <div
              key={plan.id}
              onClick={() => onSelectPlan(plan)}
              className={`relative bg-white rounded-2xl border-2 p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:shadow-lg ${
                isSelected
                  ? isJio
                    ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                    : 'border-red-600 ring-2 ring-red-500/20 shadow-md'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Popular / Badge tag */}
              {plan.isPopular && (
                <div
                  className={`absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs ${
                    isJio ? 'bg-blue-600' : 'bg-red-600'
                  }`}
                >
                  Best Seller
                </div>
              )}

              <div>
                {/* Price and Discount Header */}
                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-slate-900">
                        ₹{plan.price}
                      </span>
                      <span className="text-xs line-through text-slate-400">
                        ₹{plan.price}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50">
                        -₹{discountAmount} OFF
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        Pay ₹{discountedPayable}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                    {plan.category}
                  </span>
                </div>

                {/* Plan Highlights Grid */}
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl mb-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Validity</p>
                      <p className="font-bold text-slate-900">{plan.validity}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Wifi className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Data</p>
                      <p className="font-bold text-slate-900">{plan.data}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-700">
                    <PhoneCall className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Voice</p>
                      <p className="font-bold text-slate-900 truncate">{plan.voice}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-700">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">SMS</p>
                      <p className="font-bold text-slate-900">{plan.sms}</p>
                    </div>
                  </div>
                </div>

                {/* Benefits List */}
                <div className="space-y-1.5 mb-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Pack Benefits & Subscriptions
                  </p>
                  {plan.benefits.map((b, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? isJio
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-red-600 text-white shadow-md shadow-red-500/20'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                <span>Select ₹{plan.price} Plan (Pay ₹{discountedPayable})</span>
              </button>
            </div>
          );
        })}
      </div>

      {filteredPlans.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-slate-500 text-sm font-medium">
            No plans found matching &ldquo;{searchQuery}&rdquo; in category &ldquo;{activeCategory}&rdquo;.
          </p>
          <button
            onClick={() => {
              setActiveCategory('All');
              setSearchQuery('');
            }}
            className="mt-3 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};
