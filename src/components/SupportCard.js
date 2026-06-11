'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import api from '@/utils/api';

const PRESETS = [50, 100, 200, 500];

export default function SupportCard({ platform = 'web' }) {
  const [amount, setAmount] = useState('50');
  const [customMode, setCustomMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(false);
        return;
      }
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSupport = async () => {
    setErrorMsg('');
    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum < 10) {
      setErrorMsg('Minimum support contribution is ₹10.');
      return;
    }

    setLoading(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setErrorMsg('Failed to load payment gateway. Please check your internet connection.');
        setLoading(false);
        return;
      }

      const orderRes = await api.post('/support/create-order/', { amount: amtNum });
      const orderData = orderRes.data;

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: 'INR',
        name: 'Support mydukan',
        description: 'Voluntary contribution to support platform growth',
        image: '/logo_green.png',
        order_id: orderData.order_id,
        handler: async function (response) {
          setLoading(true);
          try {
            const verifyRes = await api.post('/support/verify-payment/', {
              order_id: orderData.order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              amount: amtNum,
              platform: platform,
            });

            if (verifyRes.data.status === 'success') {
              setSuccess(true);
            } else {
              setErrorMsg('Payment verification failed.');
            }
          } catch (err) {
            setErrorMsg('Payment verification failed. Please try again.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#0E5C42',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden font-outfit text-left w-full max-w-lg mx-auto">
      {/* Background radial gradient accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/5 rounded-full blur-2xl pointer-events-none" />

      {!success ? (
        <div className="space-y-6">
          {/* Card Title Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-850 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 shadow-2xs">
              <Heart className="w-5 h-5 fill-slate-400 dark:fill-slate-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5 font-outfit">
                Support mydukan
              </h3>
              <p className="text-[10px] text-[#0e5c42] dark:text-[#2dd882] font-black uppercase tracking-wider font-sans">
                Voluntary Support
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-550 dark:text-slate-400 font-medium leading-relaxed font-sans">
            Help us improve the platform, onboard more local businesses, improve infrastructure, and build better features for customers and merchants.
          </p>

          <div className="space-y-4">
            {/* Quick preset selector */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {PRESETS.map((preset) => {
                const active = !customMode && parseFloat(amount) === preset;
                return (
                  <button
                    key={preset}
                    onClick={() => {
                      setAmount(preset.toString());
                      setCustomMode(false);
                      setErrorMsg('');
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer font-sans ${
                      active
                        ? 'bg-[#0e5c42] text-white shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/40'
                    }`}
                  >
                    ₹{preset}
                  </button>
                );
              })}
              <button
                onClick={() => {
                  setCustomMode(true);
                  setAmount('');
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer font-sans ${
                  customMode
                    ? 'bg-[#0e5c42] text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/40'
                }`}
              >
                Custom
              </button>
            </div>

            {/* Custom Input */}
            <AnimatePresence>
              {customMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl px-3 bg-slate-50/60 dark:bg-slate-800/40">
                    <span className="text-base font-black text-slate-400 mr-2 font-outfit">₹</span>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setErrorMsg('');
                      }}
                      className="w-full py-2.5 bg-transparent outline-hidden font-bold text-slate-800 dark:text-white text-sm font-sans"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">
              <span>Minimum ₹10</span>
              <span className="flex items-center gap-1 text-[#0E5C42] dark:text-[#2dd882]">
                <ShieldCheck className="w-3.5 h-3.5" /> Secure Checkout
              </span>
            </div>

            {errorMsg && (
              <p className="text-red-500 text-xs font-bold bg-red-50 p-2.5 rounded-xl border border-red-200/40 font-sans">
                {errorMsg}
              </p>
            )}

            {/* Support button */}
            <motion.button
              disabled={loading}
              onClick={handleSupport}
              className="w-full py-3 rounded-xl bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs border-0 font-sans"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <Heart className="w-4 h-4 fill-white" />
                  Support Now
                </>
              )}
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 space-y-5">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 shadow-2xs">
              <Sparkles className="w-8 h-8 fill-emerald-600" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-outfit">
              Thank You For Supporting mydukan
            </h3>
            <p className="text-xs sm:text-sm text-slate-550 dark:text-slate-400 font-bold leading-relaxed max-w-sm mx-auto font-sans">
              Your contribution helps us improve the platform and support local businesses. We appreciate your backing.
            </p>
          </div>

          <button
            onClick={() => setSuccess(false)}
            className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200 text-xs font-black rounded-xl cursor-pointer border-0 font-sans"
          >
            Support Again
          </button>
        </div>
      )}
    </div>
  );
}
