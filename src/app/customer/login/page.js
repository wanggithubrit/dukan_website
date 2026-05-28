'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Lock, User, ArrowRight, ShoppingBag, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CustomerLoginPage() {
  const { login, user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'customer') {
        router.push('/');
      } else {
        showToast('Already logged in as merchant. Please logout first.', 'info');
      }
    }
  }, [user]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginData.username || !loginData.password) {
      showToast('Please enter username and password', 'error');
      return;
    }

    setLoading(true);
    try {
      const data = await login(loginData.username, loginData.password);
      if (data.role === 'customer') {
        showToast(`Welcome back, ${data.username}!`, 'success');
        router.push('/');
      } else {
        showToast('This account is registered as merchant. Please use merchant login.', 'error');
      }
    } catch (err) {
      showToast(err || 'Failed to login', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-brand-green-600 hover:text-brand-green-700">
          ← Back to Home
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
              <ShoppingBag className="w-8 h-8 text-brand-green-600" />
              <h1 className="text-3xl font-black text-slate-900">Customer Login</h1>
            </div>
            <p className="text-sm text-slate-600">Sign in to browse local shops</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  placeholder="Enter your username"
                  aria-label="Username"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  placeholder="Enter your password"
                  aria-label="Password"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-green-600 text-white font-bold rounded-lg hover:bg-brand-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Customer Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center pt-6 border-t border-slate-200 mt-6">
            <p className="text-sm text-slate-600 mb-3">
              Don't have a customer account?
            </p>
            <Link
              href="/customer/signup"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-green-100 text-brand-green-700 font-bold rounded-lg hover:bg-brand-green-200 transition"
            >
              Create Customer Account
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-slate-500 mt-4">
              Selling instead?{' '}
              <Link href="/merchant/login" className="text-brand-green-600 font-bold hover:underline">
                Merchant Login
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}