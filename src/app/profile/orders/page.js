'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import api from '@/utils/api';
import BottomNav from '@/components/BottomNav';
import { 
  ShoppingBag, 
  ArrowLeft, 
  Phone, 
  MessageCircle, 
  Calendar, 
  MapPin, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle,
  ExternalLink,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomerOrdersPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'past'

  useEffect(() => {
    if (user === null) {
      router.replace('/customer/login');
      return;
    }
    fetchOrders();
  }, [user, router, fetchOrders]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/customer/orders/');
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      showToast('Could not load order history', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Filter orders
  const activeOrders = orders.filter(o => ['pending', 'accepted'].includes(o.status));
  const pastOrders = orders.filter(o => ['completed', 'rejected'].includes(o.status));

  const displayOrders = activeTab === 'active' ? activeOrders : pastOrders;

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5" />
            Accepted
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-24 text-left">
      {/* Header */}
      <div className="sticky top-16 z-30 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-md mx-auto px-4 py-5 flex items-center gap-3">
          <button 
            onClick={() => router.push('/profile')}
            className="p-2 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            aria-label="Go to Profile"
          >
            <ArrowLeft className="w-5 h-5 text-slate-800" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2 font-outfit tracking-tight">
              <ShoppingBag className="w-6 h-6 text-emerald-600" />
              My Orders
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {orders.length} order{orders.length !== 1 ? 's' : ''} placed total
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-md mx-auto w-full px-4 mt-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex gap-2 shadow-2xs">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              activeTab === 'active' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Active ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              activeTab === 'past' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            History ({pastOrders.length})
          </button>
        </div>
      </div>

      {/* Orders List Container */}
      <div className="max-w-md mx-auto w-full px-4 py-6 grow flex flex-col">
        {loading ? (
          <div className="grow flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fetching order history...</p>
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="grow flex flex-col items-center justify-center text-center py-16 bg-white rounded-3xl border border-slate-100 p-8 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="font-extrabold text-slate-900 mb-1">
              No {activeTab === 'active' ? 'active' : 'past'} orders
            </h3>
            <p className="text-xs text-slate-500 mb-6 max-w-xs">
              {activeTab === 'active' 
                ? "You don't have any ongoing order requests right now." 
                : "You haven't completed or rejected orders yet."}
            </p>
            <Link 
              href="/"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-xs transition"
            >
              Shop Now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {displayOrders.map((order) => {
                const total = order.order_total || 0;
                const price = order.item_price || 0;
                const displayImage = order.item_image || 'https://placehold.co/100x100/f3f4f6/9ca3af?text=Item';

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden"
                  >
                    {/* Header */}
                    <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-100 flex justify-between items-center flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-black text-slate-800 uppercase">Order #{order.id}</span>
                      </div>
                      <div>{getStatusBadge(order.status)}</div>
                    </div>

                    {/* Details content */}
                    <div className="p-5 space-y-4">
                      {/* Merchant detail */}
                      <div className="flex justify-between items-start">
                        <div>
                          <Link 
                            href={`/shop/${order.shop}`}
                            className="font-black text-xs text-emerald-700 hover:underline inline-flex items-center gap-1"
                          >
                            <span>{order.shop_name || `Shop #${order.shop}`}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(order.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Item Row */}
                      <div className="flex gap-4 items-start">
                        <div className="w-16 h-16 rounded-xl bg-slate-50 overflow-hidden flex-shrink-0 border border-slate-150">
                          <img 
                            src={displayImage} 
                            alt={order.product_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://placehold.co/100x100/f3f4f6/9ca3af?text=Item';
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-grow">
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">{order.product_name}</h4>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Qty: {order.quantity} × ₹{price}
                          </p>
                          <div className="text-xs font-black text-slate-900 mt-1.5">
                            Total: ₹{total}
                          </div>
                        </div>
                      </div>

                      {/* Delivery address & notes details */}
                      {(order.delivery_address || order.notes) && (
                        <div className="bg-slate-50 rounded-2xl p-3 text-[10px] text-slate-600 space-y-1.5 border border-slate-100">
                          {order.delivery_address && (
                            <div className="flex gap-1.5 items-start">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <span>{order.delivery_address}</span>
                            </div>
                          )}
                          {order.notes && (
                            <div className="flex gap-1.5 items-start">
                              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <span>&ldquo;{order.notes}&rdquo;</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Communication Actions */}
                      <div className="flex gap-3 pt-1 border-t border-slate-50">
                        <a
                          href={`tel:${order.shop_phone || ''}`}
                          className="flex-1 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>
                        <a
                          href={`https://wa.me/${order.shop_phone || ''}?text=${encodeURIComponent(
                            `Hello! I placed an order with your shop for ${order.quantity}x ${order.product_name} (Order ID: #${order.id}). I wanted to check the status.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-current" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
