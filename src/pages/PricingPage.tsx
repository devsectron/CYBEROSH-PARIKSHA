import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SubscriptionPlan } from '../types';
import {
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Lock,
  Tag,
  ArrowRight,
  X,
  Award,
  Zap
} from 'lucide-react';

interface PricingPageProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).Razorpay) return resolve();
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Razorpay Checkout. Check your connection and try again.'));
    document.body.appendChild(script);
  });
}

async function openRazorpayCheckout(options: Record<string, unknown>): Promise<RazorpaySuccess> {
  await loadRazorpayScript();
  return new Promise((resolve, reject) => {
    const checkout = new (window as any).Razorpay({
      ...options,
      currency: 'INR',
      handler: (response: RazorpaySuccess) => resolve(response),
      modal: { ondismiss: () => reject(new Error('Payment cancelled.')) }
    });
    checkout.on('payment.failed', (r: any) => reject(new Error(r?.error?.description || 'Payment failed.')));
    checkout.open();
  });
}

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigate, onOpenAuth }) => {
  const { user, entitlements, refreshUser, t } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Checkout modal state
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [couponCode, setCouponCode] = useState<string>('');
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  useEffect(() => {
    async function loadPlans() {
      try {
        setIsLoading(true);
        const res = await api.payments.getPlans();
        if (res.success) {
          setPlans(res.plans || []);
        }
      } catch (err) {
        console.warn('Error fetching subscription plans:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPlans();
  }, []);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (!user) {
      onOpenAuth('login');
      return;
    }
    if (plan.price_inr === 0) {
      alert('Free Starter Plan is activated automatically with every student account!');
      return;
    }
    setSelectedPlan(plan);
    setCouponCode('');
    setCouponDiscount(0);
    setAppliedCoupon(null);
    setCouponError(null);
    setPaymentSuccess(false);
  };

  const handleApplyCoupon = async () => {
    if (!selectedPlan || !couponCode.trim()) return;
    setCouponError(null);
    try {
      const res = await api.payments.validateCoupon(couponCode.trim(), selectedPlan.price_inr);
      if (res.success && res.coupon) {
        setCouponDiscount(res.coupon.discount_amount);
        setAppliedCoupon(res.coupon.code);
      } else {
        setCouponError(res.message || 'Invalid or expired coupon code.');
      }
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon code.');
    }
  };

  const finalPayable = selectedPlan
    ? Math.max(0, selectedPlan.price_inr - couponDiscount)
    : 0;

  const handleExecutePayment = async () => {
    if (!selectedPlan || !user) return;
    setIsProcessing(true);

    try {
      // Step 1: Create Order on backend
      const orderRes = await api.payments.createOrder(selectedPlan.id, appliedCoupon || undefined);
      if (!orderRes.success || !orderRes.order) {
        throw new Error(orderRes.message || 'Failed to create payment order.');
      }

      const order = orderRes.order;
      let verifyPayload: { order_id: string; payment_id: string; signature: string };

      if (order.mode === 'live') {
        // Real checkout: Razorpay returns a payment id and an HMAC signature that the server verifies.
        const paid = await openRazorpayCheckout({
          key: order.key_id,
          order_id: order.order_id,
          amount: order.amount_paise,
          name: 'CYBEROSH PARIKSHA',
          description: order.plan_name,
          prefill: { name: user.full_name, email: user.email }
        });
        verifyPayload = {
          order_id: paid.razorpay_order_id,
          payment_id: paid.razorpay_payment_id,
          signature: paid.razorpay_signature
        };
      } else {
        // Development sandbox only: the server rejects this token when real keys are configured.
        verifyPayload = {
          order_id: order.order_id,
          payment_id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          signature: `sig_test_${Date.now()}_verified`
        };
      }

      // Step 2: Verify the payment signature on the backend
      const verifyRes = await api.payments.verifyPayment(verifyPayload);

      if (verifyRes.success) {
        setPaymentSuccess(true);
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        await refreshUser();
      } else {
        throw new Error(verifyRes.message || 'Signature verification failed.');
      }
    } catch (err: any) {
      alert(err.message || 'Payment processing error.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>TRANSPARENT & AFFORDABLE EDTECH</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            {t('Preparation Passes & Pricing', 'तैयारी पास व मूल्य निर्धारण')}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {t(
              'Designed specifically for Bihar and Indian aspirants. Premium test series, CBT simulation, and verified study notes at the most affordable price in EdTech.',
              'बिहार और पूरे भारत के छात्रों के लिए विशेष रूप से निर्मित। एडटेक में सबसे किफायती दर पर प्रीमियम टेस्ट सीरीज, CBT सिमुलेशन और नोट्स।'
            )}
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <Tag className="w-3.5 h-3.5 text-emerald-600" />
            <span>Special Bihar Launch Coupon: Use <strong>BIHAR50</strong> for 50% discount!</span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map(plan => {
            const isPopular = plan.is_popular === 1;
            const hasActivePass = entitlements.some(e => e.plan_id === plan.id);

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-3xl p-6 border-2 transition-all flex flex-col justify-between relative shadow-sm hover:shadow-lg ${
                  isPopular
                    ? 'border-amber-500 ring-2 ring-amber-400/20 shadow-amber-500/10'
                    : 'border-slate-200'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
                    Most Popular in Bihar
                  </div>
                )}

                <div>
                  <h3 className="font-bold text-lg text-slate-900 mb-1">{plan.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                    {plan.description}
                  </p>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900">
                        {plan.price_inr === 0 ? 'Free' : `₹${plan.price_inr}`}
                      </span>
                      {plan.price_inr > 0 && (
                        <span className="text-xs text-slate-400 font-semibold">
                          / {plan.duration_days} days
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-emerald-600 font-semibold">
                      One-time payment • No hidden charges
                    </span>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-700">
                    {plan.features && plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100">
                  {hasActivePass ? (
                    <button
                      disabled
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs text-center cursor-default"
                    >
                      ✓ Active Preparation Pass
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelectPlan(plan)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                        isPopular
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>{plan.price_inr === 0 ? 'Active by Default' : 'Get Pass Now'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Razorpay Trust Seal */}
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-bold text-base text-white">Razorpay 256-bit Encrypted Checkout</h4>
              <p className="text-xs text-slate-400">
                Supports UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, NetBanking, and Wallets. Instant pass activation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
            <span className="px-3 py-1 rounded-lg bg-slate-800">UPI Instant</span>
            <span className="px-3 py-1 rounded-lg bg-slate-800">RuPay / Visa</span>
            <span className="px-3 py-1 rounded-lg bg-slate-800">NetBanking</span>
          </div>
        </div>

        {/* Checkout & Razorpay Modal */}
        {selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 p-6 text-slate-900">
              <button
                onClick={() => setSelectedPlan(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

              {!paymentSuccess ? (
                <div className="space-y-4">
                  <div className="text-center pb-2 border-b border-slate-100">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                      SECURE CHECKOUT
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedPlan.name}</h3>
                    <p className="text-xs text-slate-500">{selectedPlan.duration_days} Days Unrestricted Access</p>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Plan Base Price:</span>
                      <span className="font-bold text-slate-900">₹{selectedPlan.price_inr}</span>
                    </div>

                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Coupon ({appliedCoupon}):</span>
                        <span>-₹{couponDiscount}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm font-black pt-2 border-t border-slate-200 text-slate-900">
                      <span>Total Amount Payable:</span>
                      <span className="text-blue-600">₹{finalPayable}</span>
                    </div>
                  </div>

                  {/* Coupon Input */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">Have a Discount Coupon?</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="e.g. BIHAR50, WELCOME20"
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase font-semibold focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && <p className="text-[11px] text-rose-500">{couponError}</p>}
                    {appliedCoupon && (
                      <p className="text-[11px] text-emerald-600 font-semibold">
                        ✓ Coupon {appliedCoupon} applied! ₹{couponDiscount} saved.
                      </p>
                    )}
                  </div>

                  {/* Razorpay Simulated Trigger */}
                  <div className="pt-2">
                    <button
                      onClick={handleExecutePayment}
                      disabled={isProcessing}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{isProcessing ? 'Verifying with Razorpay...' : `Pay ₹${finalPayable} via Razorpay`}</span>
                    </button>
                    <p className="text-[10px] text-slate-400 text-center mt-2">
                      Secure sandbox mode with instant HMAC SHA-256 signature verification.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Payment Successful!</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Your {selectedPlan.name} is now active on your student profile.
                    </p>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-medium">
                    All premium mock tests and full study handbooks for this category have been unlocked!
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedPlan(null);
                        onNavigate('student-dashboard');
                      }}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 text-white font-bold text-xs"
                    >
                      View Student Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPlan(null);
                        onNavigate('mock-tests');
                      }}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                    >
                      Start Mock Test
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
