'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Sparkles, ShieldCheck, Gift, Coins } from 'lucide-react';
import api from '@/utils/api';

const PRESETS = [50, 100, 200, 500];

export default function SupportModal({ isOpen, onClose, platform = 'web' }) {
  const [amount, setAmount] = useState('50');
  const [customMode, setCustomMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

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
            setErrorMsg('Payment verification failed. Please contact support.');
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
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-slate-955/60 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal Card */}
        <motion.div
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden z-10 text-left font-outfit"
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        >
          {/* Header Close Floating Trigger */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-300 transition-colors z-20 cursor-pointer border-0"
          >
            <X className="w-4 h-4" />
          </button>

          {!success ? (
            <div className="p-6 sm:p-8">
              {/* Graphic Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <motion.div
                    className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-500 shadow-xs"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Heart className="w-8 h-8 fill-rose-500" />
                  </motion.div>
                </div>
              </div>

              {/* Title & Info */}
              <div className="text-center mb-6 space-y-2">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-outfit">
                  Support mydukan
                </h3>
                <p className="text-xs sm:text-sm text-slate-550 dark:text-slate-400 leading-relaxed font-medium px-2 font-sans">
                  Help us improve the platform, onboard more local businesses, improve infrastructure, and build better features for customers and merchants.
                </p>
              </div>

              {/* Input Field / Preset Row */}
              <div className="space-y-4">
                <div className="flex gap-2.5 overflow-x-auto pb-1">
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
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-sans ${
                          active
                            ? 'bg-[#0E5C42] text-white shadow-md'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/40 dark:border-slate-800'
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
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-sans ${
                      customMode
                        ? 'bg-[#0E5C42] text-white shadow-md'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/40 dark:border-slate-800'
                    }`}
                  >
                    Custom
                  </button>
                </div>

                {/* Custom input box */}
                <AnimatePresence>
                  {customMode && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="relative overflow-hidden"
                    >
                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl px-3 bg-slate-50/60 dark:bg-slate-800/40">
                        <span className="text-lg font-black text-slate-400 mr-2 font-outfit">₹</span>
                        <input
                          type="number"
                          placeholder="Enter contribution amount"
                          value={amount}
                          onChange={(e) => {
                            setAmount(e.target.value);
                            setErrorMsg('');
                          }}
                          className="w-full py-3 bg-transparent outline-hidden font-bold text-slate-800 dark:text-white text-sm font-sans"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-400 font-sans">
                  <span>Minimum ₹10</span>
                  <span className="flex items-center gap-1 text-[#0E5C42] dark:text-[#2dd882]">
                    <ShieldCheck className="w-3.5 h-3.5" /> Secure Checkout
                  </span>
                </div>

                {errorMsg && (
                  <p className="text-red-500 text-xs font-bold bg-red-50 dark:bg-red-950/20 p-2.5 rounded-xl border border-red-200/40 dark:border-red-900/40 font-sans">
                    {errorMsg}
                  </p>
                )}

                {/* Submit button */}
                <motion.button
                  disabled={loading}
                  onClick={handleSupport}
                  className="w-full mt-2 py-3.5 rounded-xl bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 hover:shadow-lg text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 border-0 shadow-md font-sans"
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

              {/* Informative disclaimers */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">
                <span className="flex items-center gap-1"><Coins className="w-3.5 h-3.5" /> One-Time</span>
                <span className="flex items-center gap-1"><Gift className="w-3.5 h-3.5" /> No Paywalls</span>
                <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Secure Payment</span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center space-y-6">
              {/* Success animation wrapper */}
              <div className="flex justify-center">
                <motion.div
                  className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 shadow-md"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ type: 'spring', damping: 12 }}
                >
                  <Sparkles className="w-10 h-10" />
                </motion.div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-outfit">
                  Thank You For Supporting mydukan
                </h3>
                <p className="text-sm text-slate-655 dark:text-slate-400 font-bold leading-relaxed max-w-sm mx-auto font-sans">
                  Your contribution helps us improve the platform, sustain our local business directories, and build better digital neighborhoods for everyone.
                </p>
              </div>

              <motion.button
                onClick={() => {
                  setSuccess(false);
                  onClose();
                }}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer border-0 font-sans"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                Close Window
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
