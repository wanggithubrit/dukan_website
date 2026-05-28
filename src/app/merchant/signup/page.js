'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Lock, Mail, User, Eye, EyeOff, CheckCircle, AlertCircle, ArrowRight, Loader,
  Store, MapPin, Grid3x3, ChevronDown
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dukan-backend-0cc9.onrender.com';
const RESEND_COOLDOWN = 120;

const CATEGORIES = [
  'Grocery', 'Footwear', 'Fashion', 'Medicine', 'Electronics',
  'Bakeries', 'Rentals', 'Stationery', 'Books', 'Furniture', 'Others',
];

const formatTimer = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function MerchantSignupPage() {
  const router = useRouter();
  const { showToast } = useToast();

  // Form state
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    shopName: '',
    category: '',
    address: '',
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  // OTP state
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerifyLoading, setOtpVerifyLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const intervalRef = useRef(null);

  // Location state
  const [location, setLocation] = useState(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  const updateField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const startTimer = useCallback(() => {
    clearInterval(intervalRef.current);
    setTimer(RESEND_COOLDOWN);
    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleEmailChange = useCallback((value) => {
    updateField('email', value);
    if (emailVerified || otpSent) {
      setEmailVerified(false);
      setOtpSent(false);
      setOtp('');
      clearInterval(intervalRef.current);
      setTimer(0);
    }
  }, [emailVerified, otpSent, updateField]);

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const sendOtp = useCallback(async () => {
    if (!form.email.trim() || !validateEmail(form.email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    try {
      setOtpLoading(true);
      const res = await fetch(`${BASE_URL}/api/send-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setOtpSent(true);
        setOtp('');
        startTimer();
        showToast('OTP sent to your email', 'success');
      } else {
        showToast(data.error || 'Failed to send OTP', 'error');
      }
    } catch (error) {
      showToast('Network error. Please try again', 'error');
    } finally {
      setOtpLoading(false);
    }
  }, [form.email, showToast, startTimer]);

  const verifyOtp = useCallback(async () => {
    if (!otp.trim() || otp.length < 4) {
      showToast('Please enter the OTP sent to your email', 'error');
      return;
    }

    try {
      setOtpVerifyLoading(true);
      const res = await fetch(`${BASE_URL}/api/verify-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          otp: otp.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setEmailVerified(true);
        clearInterval(intervalRef.current);
        showToast('Email verified successfully', 'success');
      } else {
        showToast(data.error || 'Invalid or expired OTP', 'error');
      }
    } catch (error) {
      showToast('Network error. Please try again', 'error');
    } finally {
      setOtpVerifyLoading(false);
    }
  }, [otp, form.email, showToast]);

  const getLocation = useCallback(async () => {
    try {
      setLocLoading(true);
      if (!navigator.geolocation) {
        showToast('Geolocation not supported', 'error');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });

          // Try to get address from coordinates (simple approach - use a geocoding service)
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await res.json();
            if (data.address) {
              const addr = [
                data.address.shop || data.address.name,
                data.address.city || data.address.town,
                data.address.state || data.address.region,
              ]
                .filter(Boolean)
                .join(', ');
              updateField('address', addr);
            }
          } catch (err) {
            updateField('address', `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        },
        () => {
          showToast('Could not access location', 'error');
        }
      );
    } catch (error) {
      showToast('Location error', 'error');
    } finally {
      setLocLoading(false);
    }
  }, [showToast, updateField]);

  const handleSignup = useCallback(async () => {
    // Validation
    if (!form.username.trim()) {
      showToast('Please enter a username', 'error');
      return;
    }
    if (!form.email.trim() || !validateEmail(form.email)) {
      showToast('Please enter a valid email', 'error');
      return;
    }
    if (!emailVerified) {
      showToast('Please verify your email first', 'error');
      return;
    }
    if (!form.shopName.trim()) {
      showToast('Please enter your shop name', 'error');
      return;
    }
    if (!form.category) {
      showToast('Please select a category', 'error');
      return;
    }
    if (!location) {
      showToast('Please set your shop location', 'error');
      return;
    }
    if (form.password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (form.password !== form.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/signup/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          role: 'merchant',
          shop_name: form.shopName,
          category: form.category,
          latitude: location.latitude,
          longitude: location.longitude,
          address: form.address,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        showToast('Merchant account created! Please login', 'success');
        router.push('/merchant/login');
      } else {
        showToast(data.error || 'Signup failed. Please try again', 'error');
      }
    } catch (error) {
      showToast('Network error. Please try again', 'error');
    } finally {
      setLoading(false);
    }
  }, [form, emailVerified, location, showToast, router]);

  const passwordsMatch =
    form.confirmPassword.length > 0 && form.password === form.confirmPassword;
  const passwordsMismatch =
    form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/merchant/login" className="inline-flex items-center gap-2 text-sm font-bold text-brand-green-600 hover:text-brand-green-700">
          ← Back to Login
        </Link>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <Store className="w-8 h-8 text-brand-green-600" />
              <h1 className="text-3xl font-black text-slate-900 dark:text-white">Seller Setup</h1>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Tell us about your shop</p>
          </div>

          <div className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wide mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => updateField('username', e.target.value)}
                  placeholder="Your business username"
                  aria-label="Username"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:bg-white dark:focus:bg-slate-950 transition"
                />
              </div>
            </div>

            {/* Email + OTP */}
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wide mb-2">
                Email
              </label>
              <div className={`relative border rounded-lg transition ${
                emailVerified
                  ? 'border-brand-green-600 bg-green-50 dark:bg-brand-green-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900'
              }`}>
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="business@email.com"
                  aria-label="Email"
                  disabled={emailVerified}
                  className="w-full pl-10 pr-28 py-3 bg-transparent text-sm text-slate-900 dark:text-slate-100 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {emailVerified ? (
                  <div className="absolute right-3 top-3 flex items-center gap-1 text-xs font-bold text-brand-green-600 dark:text-brand-green-400 bg-green-100 dark:bg-brand-green-950/40 px-2 py-1 rounded">
                    <CheckCircle className="w-4 h-4" />
                    Verified
                  </div>
                ) : (
                  <button
                    onClick={sendOtp}
                    disabled={otpLoading || !form.email}
                    className="absolute right-2 top-2 px-3 py-1.5 bg-brand-green-600 text-white text-xs font-bold rounded hover:bg-brand-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {otpLoading ? <Loader className="w-3 h-3 animate-spin" /> : otpSent ? 'Resend' : 'Verify'}
                  </button>
                )}
              </div>

              {/* OTP Input */}
              {otpSent && !emailVerified && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 p-4 bg-green-50 dark:bg-brand-green-950/10 border border-green-200 dark:border-brand-green-900/30 rounded-lg space-y-3"
                >
                  <p className="text-xs text-green-900 dark:text-green-300 font-medium">
                    Enter the OTP sent to <strong>{form.email}</strong>
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      aria-label="OTP"
                      maxLength="6"
                      className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-green-300 dark:border-brand-green-800 rounded text-sm font-mono text-center text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-green-600"
                    />
                    <button
                      onClick={verifyOtp}
                      disabled={otpVerifyLoading}
                      className="px-4 py-2 bg-brand-green-600 text-white text-sm font-bold rounded hover:bg-brand-green-700 disabled:opacity-50 transition"
                    >
                      {otpVerifyLoading ? <Loader className="w-4 h-4 animate-spin" /> : 'Verify'}
                    </button>
                  </div>
                  {timer > 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">Resend in {formatTimer(timer)}</p>
                  ) : (
                    <button
                      onClick={sendOtp}
                      className="text-xs text-brand-green-600 font-bold hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </motion.div>
              )}
            </div>

            {/* Shop Name */}
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wide mb-2">
                Shop Name
              </label>
              <div className="relative">
                <Store className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={form.shopName}
                  onChange={(e) => updateField('shopName', e.target.value)}
                  placeholder="Your shop name"
                  aria-label="Shop Name"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:bg-white dark:focus:bg-slate-950 transition"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wide mb-2">
                Category
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="w-full flex items-center justify-between pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:bg-white dark:focus:bg-slate-950 transition"
                >
                  <span className={form.category ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}>
                    {form.category || 'Select category'}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                </button>
                <Grid3x3 className="absolute left-3 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />

                <AnimatePresence>
                  {showCategoryDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-10"
                    >
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            updateField('category', cat);
                            setShowCategoryDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition ${
                            form.category === cat
                              ? 'bg-brand-green-100 dark:bg-brand-green-950/40 text-brand-green-900 dark:text-brand-green-300 font-bold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wide mb-2">
                Shop Location
              </label>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className={`w-5 h-5 mt-0.5 shrink-0 ${location ? 'text-brand-green-600' : 'text-slate-400'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {form.address || (location ? 'Location captured' : 'Not set yet')}
                    </p>
                    {location && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={getLocation}
                  disabled={locLoading}
                  className="w-full py-2 text-sm font-bold text-brand-green-600 dark:text-brand-green-400 hover:bg-white dark:hover:bg-slate-950 border border-brand-green-600 rounded transition disabled:opacity-50"
                >
                  {locLoading ? 'Getting location...' : location ? 'Change Location' : 'Get Location'}
                </button>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wide mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="Min 6 characters"
                  aria-label="Password"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:bg-white dark:focus:bg-slate-950 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wide mb-2">
                Confirm Password
              </label>
              <div className={`relative border rounded-lg transition ${
                passwordsMismatch
                  ? 'border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20'
                  : passwordsMatch
                  ? 'border-brand-green-600 bg-green-50 dark:bg-brand-green-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900'
              }`}>
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  placeholder="Re-enter your password"
                  aria-label="Confirm Password"
                  className="w-full pl-10 pr-10 py-3 bg-transparent text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordsMismatch && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Passwords do not match
                </p>
              )}
              {passwordsMatch && (
                <p className="mt-1 text-xs text-brand-green-600 dark:text-brand-green-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Passwords match
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSignup}
              disabled={
                loading ||
                !emailVerified ||
                passwordsMismatch ||
                !form.shopName ||
                !form.category ||
                !location
              }
              className="w-full py-3 bg-brand-green-600 text-white font-bold rounded-lg hover:bg-brand-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Creating merchant account...
                </>
              ) : (
                <>
                  Register Shop
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Footer */}
            <div className="text-center pt-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{' '}
                <Link href="/merchant/login" className="text-brand-green-600 font-bold hover:underline">
                  Login
                </Link>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Buying instead?{' '}
                <Link href="/customer/signup" className="text-brand-green-600 font-bold hover:underline">
                  Sign up as customer
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
