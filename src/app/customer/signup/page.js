'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, User, Eye, EyeOff, CheckCircle, AlertCircle, ArrowRight, Loader } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { motion } from 'framer-motion';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dukan-backend-0cc9.onrender.com';
const RESEND_COOLDOWN = 120;

const formatTimer = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function CustomerSignupPage() {
  const router = useRouter();
  const { showToast } = useToast();

  // Form state
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // OTP state
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerifyLoading, setOtpVerifyLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const intervalRef = useRef(null);

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
          purpose: 'signup',
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setOtpSent(true);
        setOtp('');
        startTimer();
        showToast('OTP sent to your email', 'success');
      } else {
        if (data.error?.toLowerCase().includes('merchant')) {
          showToast('This email is registered to a merchant account', 'error');
        } else {
          showToast(data.error || 'Failed to send OTP', 'error');
        }
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
          role: 'customer',
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        showToast('Account created successfully!', 'success');
        router.push('/customer/login');
      } else {
        showToast(data.error || 'Signup failed. Please try again', 'error');
      }
    } catch (error) {
      showToast('Network error. Please try again', 'error');
    } finally {
      setLoading(false);
    }
  }, [form, emailVerified, showToast, router]);

  const passwordsMatch =
    form.confirmPassword.length > 0 && form.password === form.confirmPassword;
  const passwordsMismatch =
    form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/customer/login" className="inline-flex items-center gap-2 text-sm font-bold text-brand-green-600 hover:text-brand-green-700">
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
            <h1 className="text-3xl font-black text-slate-900 mb-1">Create Account</h1>
            <p className="text-sm text-slate-600">Join as a customer to browse local shops</p>
          </div>

          <div className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => updateField('username', e.target.value)}
                  placeholder="Choose your username"
                  aria-label="Username"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Email + OTP */}
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">
                Email
              </label>
              <div className={`relative border rounded-lg transition ${
                emailVerified
                  ? 'border-brand-green-600 bg-green-50'
                  : 'border-slate-200 bg-slate-50'
              }`}>
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="your@email.com"
                  aria-label="Email"
                  disabled={emailVerified}
                  className="w-full pl-10 pr-28 py-3 bg-transparent text-sm focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {emailVerified ? (
                  <div className="absolute right-3 top-3 flex items-center gap-1 text-xs font-bold text-brand-green-600 bg-green-100 px-2 py-1 rounded">
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
                  className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg space-y-3"
                >
                  <p className="text-xs text-green-900 font-medium">
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
                      className="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-brand-green-600"
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
                    <p className="text-xs text-slate-500">Resend in {formatTimer(timer)}</p>
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

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">
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
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:bg-white transition"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">
                Confirm Password
              </label>
              <div className={`relative border rounded-lg transition ${
                passwordsMismatch
                  ? 'border-red-300 bg-red-50'
                  : passwordsMatch
                  ? 'border-brand-green-600 bg-green-50'
                  : 'border-slate-200 bg-slate-50'
              }`}>
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  placeholder="Re-enter your password"
                  aria-label="Confirm Password"
                  className="w-full pl-10 pr-10 py-3 bg-transparent text-sm focus:outline-none"
                />
                <button
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
                <p className="mt-1 text-xs text-brand-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Passwords match
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSignup}
              disabled={loading || !emailVerified || passwordsMismatch}
              className="w-full py-3 bg-brand-green-600 text-white font-bold rounded-lg hover:bg-brand-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Footer */}
            <div className="text-center pt-4">
              <p className="text-sm text-slate-600">
                Already have an account?{' '}
                <Link href="/customer/login" className="text-brand-green-600 font-bold hover:underline">
                  Login
                </Link>
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Interested in selling?{' '}
                <Link href="/merchant/signup" className="text-brand-green-600 font-bold hover:underline">
                  Sign up as merchant
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
