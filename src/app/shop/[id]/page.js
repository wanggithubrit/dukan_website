'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/utils/api';
import ProductCard from '@/components/ProductCard';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useUserCoordinates } from '@/hooks/useUserCoordinates';
import {
  ArrowLeft, Phone, MapPin, Share2, Heart, Smartphone, Zap, Compass, ShoppingBag, ChevronRight, Search, X, Sparkles, AlertCircle, Clock, Star, Coins
} from 'lucide-react';


const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&auto=format&fit=crop&q=80';

const normalizeImageUrl = (img) => {
  if (!img || typeof img !== 'string') return '';
  const value = img.trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) return `${API_BASE_URL}${value}`;
  return `${API_BASE_URL}/${value.replace(/^\/+/, '')}`;
};

const formatDeliveryCharge = (charge) => {
  if (!charge) return 'Free';
  const parsed = parseFloat(charge);
  if (isNaN(parsed)) return charge;
  return `₹${charge}`;
};

const CATEGORY_STYLES = {
  Grocery:     { emoji: '🛒', gradient: 'from-emerald-600 to-teal-800', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  Footwear:    { emoji: '👟', gradient: 'from-amber-500 to-orange-700', bg: 'bg-amber-50', text: 'text-amber-700' },
  Fashion:     { emoji: '👗', gradient: 'from-pink-500 to-rose-700', bg: 'bg-pink-50', text: 'text-pink-700' },
  Medicine:    { emoji: '💊', gradient: 'from-red-500 to-rose-800', bg: 'bg-red-50', text: 'text-red-700' },
  Electronics: { emoji: '📱', gradient: 'from-blue-600 to-indigo-800', bg: 'bg-blue-50', text: 'text-blue-700' },
  Bakeries:    { emoji: '🥖', gradient: 'from-amber-600 to-amber-800', bg: 'bg-amber-50', text: 'text-amber-700' },
  Rentals:     { emoji: '🔑', gradient: 'from-purple-600 to-violet-800', bg: 'bg-purple-50', text: 'text-purple-700' },
  Stationery:  { emoji: '📝', gradient: 'from-sky-500 to-sky-700', bg: 'bg-sky-50', text: 'text-sky-700' },
  Furniture:   { emoji: '🛋️', gradient: 'from-violet-500 to-fuchsia-800', bg: 'bg-violet-50', text: 'text-violet-700' },
  Books:       { emoji: '📚', gradient: 'from-orange-600 to-red-800', bg: 'bg-orange-50', text: 'text-orange-700' },
  'Home & Kitchen': { emoji: '🍳', gradient: 'from-emerald-550 to-teal-750', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  '🔧 Hardware & Tools': { emoji: '🔧', gradient: 'from-slate-550 to-slate-750', bg: 'bg-slate-50', text: 'text-slate-700' },
  'Computers & Accessories': { emoji: '💻', gradient: 'from-blue-550 to-blue-750', bg: 'bg-blue-50', text: 'text-blue-700' },
  '🎁 Gifts & Toys': { emoji: '🎁', gradient: 'from-rose-550 to-rose-750', bg: 'bg-rose-50', text: 'text-rose-700' },
  Others:      { emoji: '📦', gradient: 'from-slate-600 to-slate-800', bg: 'bg-slate-50', text: 'text-slate-700' },
};

const getInitials = (name) => {
  if (!name) return '🏪';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
};

// Color Palette - Premium Green Theme
const colors = {
  primary: '#0E5C42',
  primaryMid: '#1B7A58',
  primaryLight: '#E6F4EE',
  accent: '#2DD882',
  gold: '#F0A500',
  goldLight: '#FFF8E6',
  white: '#FFFFFF',
  bg: '#F8FAFB',
  text: '#0D1B14',
  textLight: '#9EB5AA',
  success: '#169C53',
  warning: '#D97706',
  error: '#D62B2B',
};

// Animated Sparkle Component
const Sparkle = ({ delay = 0, size = 6 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.3 }}
    animate={{ opacity: [0, 1, 0], scale: [0.3, 1, 0.3] }}
    transition={{ duration: 2, delay, repeat: Infinity }}
    className="rounded-full"
    style={{
      width: size,
      height: size,
      backgroundColor: colors.gold,
    }}
  />
);

// Skeleton Loader
const SkeletonLoader = ({ className = '' }) => (
  <motion.div
    className={`bg-linear-to-r from-slate-200 via-slate-100 to-slate-200 rounded-xl ${className}`}
    animate={{ backgroundPosition: ['0% 0%', '100% 0%'] }}
    transition={{ duration: 2, repeat: Infinity }}
  />
);

// Item Modal Component
const ItemModal = ({ item, visible, onClose, shop, onAddToCart, onOrderNow }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (visible) {
      setActiveImageIndex(0);
    }
  }, [item, visible]);

  if (!item) return null;

  const targetPhone = shop?.whatsapp_number || shop?.phone || '';
  const images = [item.image, item.image2, item.image3].filter(Boolean);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-[90%] max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 relative"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          >
            {/* Close Floating Trigger */}
            <motion.button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/40 flex items-center justify-center shadow-md hover:bg-white transition-all z-20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <X className="w-4 h-4 text-slate-800" />
            </motion.button>

            {/* Landscape Product Image */}
            <div className="relative w-full aspect-[16/11] bg-slate-50 overflow-hidden shrink-0">
              <motion.img
                key={activeImageIndex}
                src={normalizeImageUrl(images[activeImageIndex]) || PLACEHOLDER_IMAGE}
                alt={item.name}
                className="w-full h-full object-cover"
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = PLACEHOLDER_IMAGE;
                }}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/15 to-transparent pointer-events-none" />

              {/* Photo Count Indicator */}
              {images.length > 1 && (
                <div className="absolute top-3.5 left-3.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-white text-[8px] font-black tracking-wider uppercase z-10 shadow-sm border border-white/5">
                  {activeImageIndex + 1} of {images.length} Photos
                </div>
              )}

              {/* Prev / Next Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                    }}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center shadow-md transition-all active:scale-90 font-bold"
                  >
                    ‹
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center shadow-md transition-all active:scale-90 font-bold"
                  >
                    ›
                  </button>
                </>
              )}

              {/* Floating Absolute Price Badge */}
              {item.price !== null && item.price !== undefined && (
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-xl shadow-xs border border-white/20">
                  <span className="text-sm font-black text-green-700">
                    ₹{item.price % 1 === 0 ? parseFloat(item.price).toFixed(0) : parseFloat(item.price).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Details Content */}
            <div className="p-5 text-left">
              <div className="space-y-4">
                {/* Thumbnails list row */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto py-1">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-14 h-10 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                          activeImageIndex === idx ? 'border-green-600 scale-102' : 'border-transparent opacity-75 hover:opacity-100'
                        }`}
                      >
                        <img src={normalizeImageUrl(img)} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Title */}
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug line-clamp-2">
                  {item.name}
                </h2>

                {/* Stock Status */}
                {item.track_quantity && (
                  <div>
                    {item.quantity_status === 'out' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200/50 font-black text-[9px] uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-700" />
                        Out of Stock
                      </span>
                    )}
                    {item.quantity_status === 'low' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200/50 font-black text-[9px] uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-700" />
                        Only {item.quantity} left
                      </span>
                    )}
                    {item.quantity_status === 'in' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E6F4EE] text-[#0A5C43] border border-[#0A5C43]/10 font-black text-[9px] uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0A5C43] animate-pulse" />
                        {item.quantity ? `${item.quantity} Available` : 'In Stock'}
                      </span>
                    )}
                  </div>
                )}

                {/* Description */}
                {item.description ? <p className="text-xs text-slate-600 leading-relaxed max-h-24 overflow-y-auto pr-1">{item.description}</p> : null}

                {/* Footer Action Buttons */}
                <div className="pt-4 border-t border-slate-100 flex gap-2.5 justify-end">
                  <motion.button
                    onClick={onClose}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Close
                  </motion.button>

                  {shop?.plan && String(shop.plan).toLowerCase() === 'pro_plus' && (
                    <>
                      <motion.button
                        onClick={() => {
                          if (item.quantity_status === 'out') {
                            alert('This item is currently out of stock.');
                            return;
                          }
                          onAddToCart && onAddToCart(item);
                          onClose();
                        }}
                        className="flex-1 py-2.5 px-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-purple-200"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </motion.button>

                      <motion.button
                        onClick={() => {
                          if (item.quantity_status === 'out') {
                            alert('This item is currently out of stock.');
                            return;
                          }
                          onOrderNow && onOrderNow(item);
                        }}
                        className="flex-1 py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-emerald-200"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Order Now</span>
                      </motion.button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Single-item Order Modal for Pro Plan Shops
const OrderModal = ({ item, visible, onClose, shop }) => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custQty, setCustQty] = useState(1);
  const [custAddr, setCustAddr] = useState('');
  const [custNotes, setCustNotes] = useState('');
  const [custLat, setCustLat] = useState('');
  const [custLon, setCustLon] = useState('');
  const [submitting, setSubmitting] = useState(false);


  useEffect(() => {
    if (visible) {
      setCustQty(1);
      setCustAddr('');
      setCustNotes('');
      setCustLat('');
      setCustLon('');

      const fetchProfileDetails = async () => {
        let nameVal = '';
        let phoneVal = '';
        let addrVal = '';

        if (user?.user_id) {
          try {
            const res = await api.get(`/user/${user.user_id}/`);
            if (res.data) {
              nameVal = res.data.name || '';
              phoneVal = res.data.phone || '';
              addrVal = res.data.address || '';
            }
          } catch (e) {
            console.error('Error fetching profile on order modal:', e);
          }
        }

        if (typeof window !== 'undefined') {
          setCustName(nameVal || localStorage.getItem('cust_name') || '');
          setCustPhone(phoneVal || localStorage.getItem('cust_phone') || '');
          setCustAddr(addrVal || '');
        }
      };

      fetchProfileDetails();
    }
  }, [visible, user]);

  if (!item || !visible) return null;

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCustLat(position.coords.latitude.toString());
          setCustLon(position.coords.longitude.toString());
          showToast('GPS coordinates loaded successfully! 📍', 'success');
        },
        (error) => {
          showToast('Could not fetch location coordinates.', 'warning');
        }
      );
    } else {
      showToast('Geolocation is not supported by your browser.', 'warning');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!custName.trim()) return showToast('Name is required', 'warning');
    if (!custPhone.trim()) return showToast('Phone number is required', 'warning');
    if (shop?.delivery_available && !custAddr.trim()) return showToast('Delivery address is required', 'warning');

    try {
      setSubmitting(true);
      const body = {
        shop_id: shop.id,
        item_id: item.id,
        quantity: parseInt(custQty, 10) || 1,
        customer_name: custName.trim(),
        customer_phone: custPhone.trim(),
        delivery_address: custAddr.trim(),
        notes: custNotes.trim(),
        customer_latitude: custLat.trim() ? parseFloat(custLat) : null,
        customer_longitude: custLon.trim() ? parseFloat(custLon) : null,
        payment_method: 'COD',
      };
      
      await api.post('/orders/', body);
      if (typeof window !== 'undefined') {
        localStorage.setItem('cust_name', custName.trim());
        localStorage.setItem('cust_phone', custPhone.trim());
      }
      showToast('Your order request has been sent to the merchant! 🎉', 'success');
      onClose();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to submit order request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-[90%] max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-6 relative text-slate-800"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
          
          <h3 className="text-lg font-black text-slate-900 mb-2">Order Details</h3>
          <p className="text-xs font-bold text-slate-500 mb-4">{item.name} · ₹{item.price}</p>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Your Name *</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-600 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Phone Number *</label>
              <input
                type="text"
                placeholder="Enter phone number"
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-600 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCustQty(q => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 font-extrabold flex items-center justify-center text-sm text-slate-800"
                >
                  -
                </button>
                <span className="font-extrabold text-sm w-6 text-center">{custQty}</span>
                <button
                  type="button"
                  onClick={() => setCustQty(q => q + 1)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 font-extrabold flex items-center justify-center text-sm text-slate-800"
                >
                  +
                </button>
              </div>
            </div>

            {shop?.delivery_available && (
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Delivery Address *</label>
                <textarea
                  placeholder="Enter full delivery address"
                  value={custAddr}
                  onChange={(e) => setCustAddr(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-600 bg-slate-50"
                />
                <div className="mt-1 bg-green-50 border border-green-100 rounded-xl p-2.5 text-[10px] text-green-800 font-semibold">
                  🚚 Delivery Charge: {formatDeliveryCharge(shop.delivery_charge)} | Areas: {shop.delivery_area || 'All'}
                  {shop.estimated_delivery_time && ` | Est: ${shop.estimated_delivery_time}`}
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Notes (Optional)</label>
              <textarea
                placeholder="Any special instructions for the merchant"
                value={custNotes}
                onChange={(e) => setCustNotes(e.target.value)}
                rows={1}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-600 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">📍 Share Exact Location (Optional)</label>
              <button
                type="button"
                onClick={handleGetLocation}
                className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Get Current Location</span>
              </button>
              <div className="flex gap-2.5 mt-2.5">
                <input
                  type="text"
                  placeholder="Latitude"
                  value={custLat}
                  onChange={(e) => setCustLat(e.target.value)}
                  className="w-1/2 px-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-green-600 bg-slate-50"
                />
                <input
                  type="text"
                  placeholder="Longitude"
                  value={custLon}
                  onChange={(e) => setCustLon(e.target.value)}
                  className="w-1/2 px-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-green-600 bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Payment Method</label>
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-emerald-250 bg-emerald-50 text-[11px] text-emerald-800 font-bold">
                <Coins className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {shop?.payment_policy === 'cod' 
                    ? 'Cash on Delivery (COD)' 
                    : shop?.payment_policy === 'contact' 
                    ? 'Merchant may contact you for payment.' 
                    : 'Cash on Delivery (COD) or merchant may contact you for payment.'}
                </span>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1"
              >
                {submitting ? 'Submitting...' : 'Place Order'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Multi-item Cart Modal for Pro Plus Plan Shops
const CartModal = ({ visible, onClose, cart, setCart, shop }) => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddr, setCustAddr] = useState('');
  const [custNotes, setCustNotes] = useState('');
  const [custLat, setCustLat] = useState('');
  const [custLon, setCustLon] = useState('');
  const [submitting, setSubmitting] = useState(false);


  useEffect(() => {
    if (visible) {
      setCustAddr('');
      setCustNotes('');
      setCustLat('');
      setCustLon('');

      const fetchProfileDetails = async () => {
        let nameVal = '';
        let phoneVal = '';
        let addrVal = '';

        if (user?.user_id) {
          try {
            const res = await api.get(`/user/${user.user_id}/`);
            if (res.data) {
              nameVal = res.data.name || '';
              phoneVal = res.data.phone || '';
              addrVal = res.data.address || '';
            }
          } catch (e) {
            console.error('Error fetching profile on cart modal:', e);
          }
        }

        if (typeof window !== 'undefined') {
          setCustName(nameVal || localStorage.getItem('cust_name') || '');
          setCustPhone(phoneVal || localStorage.getItem('cust_phone') || '');
          setCustAddr(addrVal || '');
        }
      };

      fetchProfileDetails();
    }
  }, [visible, user]);

  if (!visible) return null;

  const subtotal = cart.reduce((sum, entry) => sum + (entry.item.price || 0) * entry.quantity, 0);

  const handleUpdateQty = (itemId, change) => {
    setCart(prev => {
      return prev.map(entry => {
        if (entry.item.id === itemId) {
          const newQty = entry.quantity + change;
          if (newQty <= 0) return null;
          return { ...entry, quantity: newQty };
        }
        return entry;
      }).filter(Boolean);
    });
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCustLat(position.coords.latitude.toString());
          setCustLon(position.coords.longitude.toString());
          showToast('GPS coordinates loaded successfully! 📍', 'success');
        },
        (error) => {
          showToast('Could not fetch location coordinates.', 'warning');
        }
      );
    } else {
      showToast('Geolocation is not supported by your browser.', 'warning');
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return showToast('Your cart is empty', 'warning');
    if (!custName.trim()) return showToast('Name is required', 'warning');
    if (!custPhone.trim()) return showToast('Phone number is required', 'warning');
    if (shop?.delivery_available && !custAddr.trim()) return showToast('Delivery address is required', 'warning');

    try {
      setSubmitting(true);
      let successCount = 0;
      
      const promises = cart.map(async (entry) => {
        const body = {
          shop_id: shop.id,
          item_id: entry.item.id,
          quantity: entry.quantity,
          customer_name: custName.trim(),
          customer_phone: custPhone.trim(),
          delivery_address: custAddr.trim(),
          notes: custNotes.trim(),
          customer_latitude: custLat.trim() ? parseFloat(custLat) : null,
          customer_longitude: custLon.trim() ? parseFloat(custLon) : null,
          payment_method: 'COD',
        };
        try {
          await api.post('/orders/', body);
          successCount++;
        } catch (err) {
          console.error(`Failed to submit order for item ${entry.item.id}:`, err);
        }
      });

      await Promise.all(promises);

      if (typeof window !== 'undefined') {
        localStorage.setItem('cust_name', custName.trim());
        localStorage.setItem('cust_phone', custPhone.trim());
      }

      if (successCount === cart.length) {
        showToast('All order requests placed successfully! 🎉', 'success');
        setCart([]);
        onClose();
      } else if (successCount > 0) {
        showToast(`Placed ${successCount} of ${cart.length} orders successfully.`, 'warning');
        setCart([]);
        onClose();
      } else {
        showToast('Failed to submit order requests.', 'error');
      }
    } catch (err) {
      showToast('Error placing orders.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-[90%] max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 relative max-h-[90vh] flex flex-col justify-between text-slate-800"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors z-10">
            <X className="w-5 h-5" />
          </button>
          
          <div className="overflow-y-auto grow pr-1">
            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-1.5">
              <ShoppingBag className="w-5 h-5 text-purple-600" />
              <span>Shopping Cart</span>
            </h3>

            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <p className="font-extrabold text-sm">Your cart is empty</p>
                <p className="text-[10px] mt-1">Browse products and add them to your cart.</p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {cart.map((entry) => (
                  <div key={entry.item.id} className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={normalizeImageUrl(entry.item.image) || PLACEHOLDER_IMAGE}
                        alt={entry.item.name}
                        className="w-12 h-12 rounded-xl object-cover bg-slate-50 shrink-0"
                      />
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">{entry.item.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">₹{entry.item.price}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => handleUpdateQty(entry.item.id, -1)}
                        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 font-extrabold flex items-center justify-center text-xs text-slate-800"
                      >
                        -
                      </button>
                      <span className="font-extrabold text-xs w-4 text-center">{entry.quantity}</span>
                      <button
                        onClick={() => handleUpdateQty(entry.item.id, 1)}
                        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 font-extrabold flex items-center justify-center text-xs text-slate-800"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 font-black text-xs text-slate-900">
                  <span>Subtotal</span>
                  <span className="text-sm text-green-700">₹{subtotal.toFixed(2)}</span>
                </div>
              </div>
            )}

            {cart.length > 0 && (
              <form onSubmit={handlePlaceOrder} className="space-y-4 text-left border-t border-slate-100 pt-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Your Name *</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-purple-600 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    placeholder="Enter phone number"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-purple-600 bg-slate-50"
                  />
                </div>

                {shop?.delivery_available && (
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Delivery Address *</label>
                    <textarea
                      placeholder="Enter full delivery address"
                      value={custAddr}
                      onChange={(e) => setCustAddr(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-purple-600 bg-slate-50"
                    />
                    <div className="mt-1 bg-purple-50 border border-purple-100 rounded-xl p-2.5 text-[10px] text-purple-800 font-semibold">
                      🚚 Delivery Charge: {formatDeliveryCharge(shop.delivery_charge)} | Areas: {shop.delivery_area || 'All'}
                      {shop.estimated_delivery_time && ` | Est: ${shop.estimated_delivery_time}`}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Notes (Optional)</label>
                  <textarea
                    placeholder="Any special instructions for the merchant"
                    value={custNotes}
                    onChange={(e) => setCustNotes(e.target.value)}
                    rows={1}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-purple-600 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">📍 Share Exact Location (Optional)</label>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    className="w-full py-1.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>Get Current Location</span>
                  </button>
                  <div className="flex gap-2.5 mt-2.5">
                    <input
                      type="text"
                      placeholder="Latitude"
                      value={custLat}
                      onChange={(e) => setCustLat(e.target.value)}
                      className="w-1/2 px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] focus:outline-none focus:border-purple-600 bg-slate-50"
                    />
                    <input
                      type="text"
                      placeholder="Longitude"
                      value={custLon}
                      onChange={(e) => setCustLon(e.target.value)}
                      className="w-1/2 px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] focus:outline-none focus:border-purple-600 bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Payment Method</label>
                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50 text-[11px] text-purple-800 font-bold">
                    <Coins className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>
                      {shop?.payment_policy === 'cod' 
                        ? 'Cash on Delivery (COD)' 
                        : shop?.payment_policy === 'contact' 
                        ? 'Merchant may contact you for payment.' 
                        : 'Cash on Delivery (COD) or merchant may contact you for payment.'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-wider transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-md shadow-purple-200"
                  >
                    {submitting ? 'Submitting...' : 'Place Order'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default function ShopDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const { lat, lon, isLoaded } = useUserCoordinates();
  const [faves, setFaves] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      setMounted(true);
    });
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('favorites');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          Promise.resolve().then(() => {
            setFaves(parsed);
          });
        } catch (e) {}
      }
    }
  }, []);
  const [loadingFav, setLoadingFav] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCartModal, setShowCartModal] = useState(false);

  // Load cart on shop change or storage event
  useEffect(() => {
    if (typeof window === 'undefined' || !shop?.id) return;
    const loadCart = () => {
      try {
        const stored = localStorage.getItem('dukan_cart');
        const globalCart = stored ? JSON.parse(stored) : [];
        if (Array.isArray(globalCart)) {
          const entry = globalCart.find(e => e.shop?.id === shop.id);
          setCart(entry ? entry.items : []);
        }
      } catch (e) {
        console.error('Error loading cart', e);
      }
    };
    loadCart();
    window.addEventListener('dukan_cart_changed', loadCart);
    return () => window.removeEventListener('dukan_cart_changed', loadCart);
  }, [shop?.id]);

  const updateCartAndSave = (updater) => {
    setCart(prev => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;
      try {
        const stored = localStorage.getItem('dukan_cart');
        let globalCart = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(globalCart)) globalCart = [];

        if (updated.length === 0) {
          globalCart = globalCart.filter(entry => entry.shop?.id !== shop.id);
        } else {
          const existingIdx = globalCart.findIndex(entry => entry.shop?.id === shop.id);
          const shopEntry = {
            shop: {
              id: shop.id,
              name: shop.name,
              cover_image: shop.cover_image,
              image: shop.image,
              delivery_available: shop.delivery_available,
              delivery_charge: shop.delivery_charge,
              delivery_area: shop.delivery_area,
              estimated_delivery_time: shop.estimated_delivery_time,
              plan: shop.plan
            },
            items: updated
          };
          if (existingIdx >= 0) {
            globalCart[existingIdx] = shopEntry;
          } else {
            globalCart.push(shopEntry);
          }
        }
        localStorage.setItem('dukan_cart', JSON.stringify(globalCart));
        window.dispatchEvent(new Event('dukan_cart_changed'));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderItem, setOrderItem] = useState(null);
  const [offerIdx, setOfferIdx] = useState(0);
  const searchInputRef = useRef(null);
  const favScale = useRef(1);

  // Fetch shop details
  const { data = {}, isLoading, error, refetch } = useQuery({
    queryKey: ['shopDetail', id, lat, lon],
    queryFn: async () => {
      try {
        // Build URL with lat/lon if available, otherwise just fetch without them
        let url = `/shops/${id}/`;
        if (lat && lon) {
          url += `?lat=${lat}&lon=${lon}`;
        }
        const res = await api.get(url);
        return res.data || {};
      } catch (err) {
        console.error('Failed to fetch shop details:', err);
        throw err;
      }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const { shop = {}, banners = [], media = [], items = [] } = data;
  const isFavorited = shop?.id ? faves.includes(shop.id) : false;
  const isPremium = shop?.plan && ['pro', 'pro_plus'].includes(shop.plan.toLowerCase());
  const isProPlus = shop?.plan && String(shop.plan).toLowerCase() === 'pro_plus';
  const galleryImages = Array.isArray(media)
    ? media.map((entry) => normalizeImageUrl(entry?.image || entry?.src || entry?.url)).filter(Boolean)
    : [];

  const [activeTab, setActiveTab] = useState('products');
  const [reviews, setReviews] = useState([]);
  const [userRating, setUserRating] = useState(5);
  const [userReview, setUserReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    if (!shop?.id) return;
    try {
      setReviewsLoading(true);
      const res = await api.get(`/shop/${shop.id}/ratings/`);
      setReviews(res.data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  }, [shop?.id]);

  useEffect(() => {
    if (shop?.id) {
      fetchReviews();
    }
  }, [shop?.id, fetchReviews]);

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast('Please log in to submit a review', 'warning');
      return;
    }
    try {
      setSubmittingRating(true);
      await api.post('/shop/rate/', {
        shop_id: shop.id,
        rating: userRating,
        review: userReview
      });
      showToast('Review submitted successfully! Thank you.', 'success');
      setUserReview('');
      fetchReviews();
      refetch();
    } catch (err) {
      console.error('Failed to submit rating:', err);
      showToast(err.response?.data?.error || 'Failed to submit review.', 'error');
    } finally {
      setSubmittingRating(false);
    }
  };

  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    if (galleryImages.length <= 1) return;
    const interval = setInterval(() => {
      setGalleryIndex((current) => (current + 1) % galleryImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [galleryImages.length]);

  // Autoplay campaign banners every 6 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setOfferIdx((current) => (current + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);
  
  // Format distance
  const formatDistance = (distance) => {
    if (distance == null || distance === '' || distance === 'undefined') return '';
    const d = Number(distance);
    if (d <= 0) return '0 km';
    if (d < 1) return `Nearby (${Math.round(d * 1000)}m)`;
    return `Approx. ${d.toFixed(1)} km`;
  };

  // Focus search input when showing search
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Handle favorite toggle with animation
  const handleFavoriteToggle = useCallback(async () => {
    if (!user) {
      showToast('Please login to save favorites', 'info');
      return;
    }
    if (!shop.id) return;
    setLoadingFav(true);
    try {
      const currentFaves = JSON.parse(localStorage.getItem('favorites') || '[]');
      const updated = currentFaves.includes(shop.id)
        ? currentFaves.filter((favId) => favId !== shop.id)
        : [...currentFaves, shop.id];
      localStorage.setItem('favorites', JSON.stringify(updated));
      setFaves(updated);
      showToast(currentFaves.includes(shop.id) ? 'Removed from favorites' : 'Added to favorites', 'success');
    } catch (err) {
      showToast('Error updating favorites', 'error');
    } finally {
      setLoadingFav(false);
    }
  }, [user, shop.id, showToast]);

  // Handle share
  const handleShare = useCallback(() => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      showToast('Store link copied!', 'success');
    }
  }, [showToast]);

  const handleReportStatus = async () => {
    if (!user) {
      showToast('Please login to report shop status and earn credits!', 'info');
      return;
    }
    const reason = prompt("What is the current status of this shop? (e.g. 'Confirmed Open', 'Temporarily Closed', 'Moved Location')");
    if (!reason || !reason.trim()) return;

    try {
      const res = await api.post('/reports/submit/', {
        shop_id: id,
        report_type: 'status',
        details: reason
      });
      if (res.data.success) {
        showToast(res.data.message || 'Report submitted! Thank you.', 'success');
      }
    } catch (err) {
      showToast('Failed to submit report. Please try again.', 'error');
    }
  };

  // Filter items by search query
  const filteredItems = items.filter(item =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle item click to open modal
  const handleItemClick = useCallback((item) => {
    setSelectedItem(item);
    setShowItemModal(true);
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    setShowItemModal(false);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Skeleton Header */}
        <div className="relative h-64 sm:h-80 bg-linear-to-b from-slate-200 to-slate-100 overflow-hidden">
          <SkeletonLoader className="w-full h-full" />
        </div>

        {/* Skeleton Card */}
        <div className="relative -mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg">
            <div className="flex items-center gap-5">
              <SkeletonLoader className="w-24 h-24 rounded-2xl shrink-0" />
              <div className="grow space-y-3">
                <SkeletonLoader className="h-8 w-2/3" />
                <SkeletonLoader className="h-4 w-1/2" />
                <SkeletonLoader className="h-4 w-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton Products */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <SkeletonLoader key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !shop.id) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center min-h-screen px-4 bg-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.div 
          className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <ShoppingBag className="w-10 h-10 text-red-500" />
        </motion.div>
        <h1 className="text-2xl font-black text-slate-900">Shop not found</h1>
        <p className="text-slate-600 mt-2 text-center">The shop you are looking for does not exist or is no longer available.</p>
        <motion.button
          onClick={() => router.push('/')}
          className="mt-6 px-8 py-3 bg-linear-to-r from-green-600 to-green-700 text-white rounded-xl font-bold hover:shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Back to Home
        </motion.button>
      </motion.div>
    );
  }

  const hasCoverImage = galleryImages.length > 0 || (shop.cover_image && shop.cover_image !== '' && shop.cover_image !== 'null');
  const hasAvatarImage = shop.image && shop.image !== '' && shop.image !== 'null';

  const coverImage = galleryImages[galleryIndex] || normalizeImageUrl(shop.cover_image) || normalizeImageUrl(shop.image) || PLACEHOLDER_IMAGE;
  const avatarUrl = normalizeImageUrl(shop.image) || normalizeImageUrl(shop.cover_image) || galleryImages[0] || PLACEHOLDER_IMAGE;
  const heroImageKey = `${shop.id || 'shop'}-${coverImage}`;
  const avatarImageKey = `${shop.id || 'shop'}-${avatarUrl}`;

  const catKey = shop.category ? (shop.category.charAt(0).toUpperCase() + shop.category.slice(1).toLowerCase()) : 'Others';
  const catStyle = CATEGORY_STYLES[catKey] || CATEGORY_STYLES.Others;

  const googleMapsUrl = shop.latitude && shop.longitude 
    ? `https://maps.google.com/?q=${shop.latitude},${shop.longitude}`
    : '#';

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Cover Section */}
      <motion.section 
        className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden bg-slate-900"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {hasCoverImage ? (
          <motion.img
            key={heroImageKey}
            src={coverImage}
            alt={shop.name}
            className="w-full h-full object-cover"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8 }}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = PLACEHOLDER_IMAGE;
            }}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${catStyle.gradient} flex flex-col items-center justify-center relative`}>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:28px_28px] opacity-25" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.22 }}
              transition={{ duration: 0.8 }}
              className="text-8xl sm:text-[12rem] font-bold select-none pointer-events-none"
            >
              {catStyle.emoji}
            </motion.div>
          </div>
        )}

        {/* Back Button */}
        <motion.button 
          onClick={() => router.push('/')}
          className="absolute top-6 left-6 p-2.5 rounded-xl bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors z-20"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>

        {/* Favorite Button - Top Right */}
        <motion.button 
          onClick={handleFavoriteToggle}
          disabled={loadingFav}
          className="absolute top-6 right-6 p-2.5 rounded-xl bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors z-20"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={isFavorited ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.4 }}
          >
            <Heart className={`w-5 h-5 ${isFavorited ? 'fill-red-500' : ''}`} color={isFavorited ? '#ef4444' : 'white'} />
          </motion.div>
        </motion.button>

        {/* Cart Button - Top Right (Pro Plus Only) */}
        {isProPlus && (
          <motion.button 
            onClick={() => setShowCartModal(true)}
            className="absolute top-6 right-20 p-2.5 rounded-xl bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors z-20 flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black rounded-full w-4.5 h-4.5 flex items-center justify-center leading-none">
                  {cart.reduce((sum, entry) => sum + entry.quantity, 0)}
                </span>
              )}
            </div>
          </motion.button>
        )}
      </motion.section>

      {/* Shop Info Card - Premium Design */}
      <motion.section 
        className="relative -mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Shop Info */}
            <div className="flex items-start sm:items-center gap-5 flex-1">
              <motion.div 
                className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-md shrink-0 border-2 border-green-100 bg-white flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
              >
                {hasAvatarImage ? (
                  <img
                    key={avatarImageKey}
                    src={avatarUrl}
                    alt={shop.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = PLACEHOLDER_IMAGE;
                    }}
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${catStyle.gradient} flex flex-col items-center justify-center`}>
                    <span className="text-white text-lg sm:text-2xl font-black tracking-wider">
                      {getInitials(shop.name)}
                    </span>
                    <span className="text-white/70 text-[9px] sm:text-[11px] font-bold uppercase mt-0.5 sm:mt-1">
                      {catStyle.emoji}
                    </span>
                  </div>
                )}
              </motion.div>
              
            <div className="grow">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="text-xl sm:text-3xl font-black text-slate-900">
                    {shop.name}
                  </h1>
                  {isPremium && (
                    <motion.span 
                      className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-yellow-200"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      <Sparkles className="w-3 h-3" />
                      PRO
                    </motion.span>
                  )}
                </div>

                {/* Category Badge */}
                <div className="flex flex-wrap items-center gap-3 text-sm mb-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold text-xs">
                    {shop.category}
                  </span>

                  {/* Rating Badge */}
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-black px-3 py-1 rounded-full border border-amber-200">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>{shop.average_rating ? Number(shop.average_rating).toFixed(1) : '0.0'} ({shop.total_ratings || 0})</span>
                  </span>

                  {/* Status Badge */}
                  <motion.span 
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-200"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.span 
                      className="w-2 h-2 rounded-full bg-green-500"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-xs font-bold text-green-700">
                      {shop.is_open ? 'Open Now' : 'Closed'}
                    </span>
                  </motion.span>
                </div>

                {/* Address & Distance */}
                <div className="flex items-start gap-2 text-xs text-slate-600">
                  <MapPin className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-700">
                      {shop.distance != null && `${formatDistance(shop.distance)} away • `}
                      {shop.address || 'Address not listed'}
                    </p>
                  </div>
                </div>

                {shop.opening_time && shop.closing_time && (
                  <div className="mt-2.5 flex items-center gap-2 bg-emerald-50/60 border border-emerald-100 rounded-xl px-3.5 py-2 w-fit text-xs font-bold text-emerald-800">
                    <Clock className="w-4 h-4 text-green-700 shrink-0" />
                    <span>
                      Business Hours:{' '}
                      <span className="font-black text-green-800">
                        {formatTime(shop.opening_time)} – {formatTime(shop.closing_time)}
                      </span>
                    </span>
                  </div>
                )}

                {shop.description && (
                  <div className="mt-3.5 pt-3 border-t border-slate-100/80 text-xs text-slate-600 max-w-xl text-left bg-slate-50/50 p-3 rounded-xl border border-slate-200/40">
                    <p className="font-semibold text-slate-800 text-[10px] uppercase tracking-wider mb-1">About our Store / Landmark</p>
                    <p className="leading-relaxed whitespace-pre-wrap">{shop.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0 shrink-0">
              {shop.phone && shop.is_open && (
                <motion.a 
                  href={`tel:${shop.phone}`}
                  className="p-3 rounded-xl transition-colors"
                  style={{ backgroundColor: colors.primaryLight }}
                  whileHover={{ scale: 1.1, backgroundColor: colors.accent }}
                  whileTap={{ scale: 0.95 }}
                  title="Call"
                >
                  <Phone className="w-5 h-5 text-green-700" />
                </motion.a>
              )}

              {shop.whatsapp_number && shop.is_open && (
                <motion.a 
                  href={`https://wa.me/${shop.whatsapp_number.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-green-100 hover:bg-green-200 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  title="WhatsApp"
                >
                  <svg className="w-5 h-5 fill-current text-green-600" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.437.002 9.861-4.366 9.864-9.736.001-2.589-1.006-5.023-2.84-6.859-1.835-1.835-4.271-2.845-6.864-2.846-5.439 0-9.865 4.366-9.867 9.739-.001 1.505.385 2.98 1.132 4.27l.147.254-1.046 3.82 3.916-1.017.247.147z" />
                  </svg>
                </motion.a>
              )}

              <motion.a 
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-3 rounded-xl transition-colors ${
                  googleMapsUrl === '#' 
                    ? 'pointer-events-none opacity-40 bg-slate-100 text-slate-400' 
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                }`}
                whileHover={googleMapsUrl !== '#' ? { scale: 1.1 } : {}}
                whileTap={googleMapsUrl !== '#' ? { scale: 0.95 } : {}}
                title="Maps"
              >
                <Compass className="w-5 h-5" />
              </motion.a>

              <motion.button 
                onClick={handleShare}
                className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="Share"
              >
                <Share2 className="w-5 h-5" />
              </motion.button>



              <motion.button
                onClick={() => {
                  showToast("Opening MyDukan app...", "info");
                  const deepLink = `dukan://shop/${shop.id}`;
                  const playStoreUrl = "https://play.google.com/store/apps/details?id=com.mydukan.dukanapp";
                  
                  // Attempt to open deep link scheme, fallback to Play Store after timeout
                  const start = Date.now();
                  window.location.href = deepLink;
                  
                  setTimeout(() => {
                    if (Date.now() - start < 1500) {
                      window.location.href = playStoreUrl;
                    }
                  }, 1000);
                }}
                className="bg-linear-to-r from-green-600 to-green-700 hover:shadow-lg text-white font-bold text-xs px-4 py-3 rounded-xl flex items-center gap-1.5 transition-shadow"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Smartphone className="w-4 h-4" />
                App
              </motion.button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Special Offers Section */}
      <AnimatePresence>
        {isPremium && banners.length > 0 ? (
          <motion.section 
            className="w-full mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg sm:text-xl font-black text-slate-900">Special Offers</h3>
                {isPremium && (
                  <div className="flex items-center gap-1">
                    <Sparkle delay={0} size={4} />
                    <Sparkle delay={0.2} size={4} />
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500">Limited time deals just for you</p>
            </div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 group">
              {/* Background Glow */}
              <div className="absolute inset-0 bg-linear-to-r from-green-500/10 to-emerald-500/10 blur-3xl -z-10 rounded-3xl opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="overflow-hidden rounded-3xl relative w-full min-h-[150px] sm:min-h-[180px] flex items-center border border-slate-100 shadow-sm group-hover:shadow-md transition-shadow">
                {banners.map((banner, idx) => {
                  const imageUrl = banner.image || banner.src;
                  const isImageBanner = banner.banner_type === 'image' || !!imageUrl;
                  const active = idx === offerIdx;

                  if (!active) return null;

                  if (isImageBanner) {
                    return (
                      <motion.div
                        key={banner.id || idx}
                        className="w-full aspect-[16/6] sm:aspect-[21/9] min-h-[150px] sm:min-h-[180px] relative overflow-hidden bg-slate-150 cursor-pointer"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <img 
                          src={normalizeImageUrl(imageUrl)} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-101" 
                          alt="Special Campaign Banner" 
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = PLACEHOLDER_IMAGE;
                          }}
                        />
                        {/* Premium Glass border overlay */}
                        <div className="absolute inset-0 border-2 border-white/10 pointer-events-none rounded-3xl" />
                      </motion.div>
                    );
                  }

                  // Upgraded stunning high-fidelity gradients
                  let bgGradient = 'from-[#0A4B35] via-[#0E5C42] to-[#1F8A64]'; // Rich Emerald
                  if (banner.template === 'red') {
                    bgGradient = 'from-[#7F1D1D] via-[#9B1C1C] to-[#C0392B]'; // Fire Red
                  } else if (banner.template === 'dark') {
                    bgGradient = 'from-[#0B0F19] via-[#1E293B] to-[#334155]'; // Slate Midnight
                  }

                  return (
                    <motion.div
                      key={banner.id || idx}
                      className={`w-full min-h-[150px] sm:min-h-[180px] relative overflow-hidden bg-linear-to-tr ${bgGradient} p-5 sm:p-8 flex flex-row items-center justify-between gap-4 cursor-pointer border border-white/10`}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Animated circular vector overlay */}
                      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_70%_120%,rgba(255,255,255,0.25),transparent_50%)] pointer-events-none" />
                      <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/5 blur-2xl pointer-events-none" />

                      {/* Content (Left) */}
                      <div className="relative z-10 text-left max-w-[60%] sm:max-w-2xl">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-md border border-white/20 text-yellow-300 text-[8px] sm:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                            <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-yellow-300" />
                            {banner.discount ? 'Hot Deal' : 'Exclusive'}
                          </span>
                        </div>

                        <h3 className="font-black text-white text-sm sm:text-2xl mb-1 sm:mb-2 tracking-tight leading-tight bg-clip-text text-transparent bg-linear-to-b from-white to-white/90 truncate sm:line-clamp-2">
                          {banner.text || banner.title || banner.name || 'Exclusive Offer'}
                        </h3>

                        {(banner.subtext || banner.subtitle) && (
                          <p className="text-[10px] sm:text-sm text-white/80 font-medium truncate sm:line-clamp-2">
                            {banner.subtext || banner.subtitle}
                          </p>
                        )}
                      </div>

                      {/* Promotion Tag & Shop CTA (Right) */}
                      <div className="relative z-10 flex flex-col items-end justify-center self-stretch shrink-0 gap-2 sm:gap-4">
                        {banner.discount && (
                          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl sm:rounded-2xl p-2 px-3 sm:p-4 sm:px-6 text-center select-none rotate-2 shadow-lg transition-transform group-hover:scale-105 duration-300">
                            <span className="text-xs sm:text-2xl font-black text-yellow-300 tracking-tight drop-shadow-xs">
                              {banner.discount}
                            </span>
                          </div>
                        )}
                        <span className="text-[9px] sm:text-xs font-black text-white bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-full flex items-center gap-1 transition-colors font-bold">
                          Shop Now
                          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>



              {/* Dots / Badges */}
              {banners.length > 1 && (
                <div className="flex justify-center gap-2 mt-4 z-20">
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setOfferIdx(i)}
                      className={`w-2 h-2 rounded-full border transition-all cursor-pointer ${
                        offerIdx === i
                          ? 'bg-[#0E5C42] border-[#0E5C42] scale-110'
                          : 'bg-slate-200 dark:bg-slate-800 border-transparent hover:bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      {/* Search Bar & Products Section */}
      <motion.section 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-12 pb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 mb-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 px-6 text-sm font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'products'
                ? 'border-green-600 text-green-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Products ({filteredItems.length || items.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3 px-6 text-sm font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-green-600 text-green-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Reviews ({reviews.length})
          </button>
        </div>

        {activeTab === 'products' ? (
          <>
            {/* Search Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    Products
                    <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      {filteredItems.length || items.length}
                    </span>
                  </h2>
                </div>
                <motion.button
                  onClick={() => setShowSearch(!showSearch)}
                  className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {showSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                </motion.button>
              </div>

              {/* Animated Search Input */}
              <AnimatePresence>
                {showSearch && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-4"
                  >
                    <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 rounded-xl border-2 border-slate-200 focus-within:border-green-500 transition-colors">
                      <Search className="w-4 h-4 text-slate-400" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-sm text-slate-900 placeholder-slate-400"
                      />
                      {searchQuery && (
                        <motion.button
                          onClick={() => setSearchQuery('')}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Products Grid */}
            {filteredItems.length === 0 && !showSearch && items.length === 0 ? (
              <motion.div 
                className="text-center py-16 bg-slate-50 border border-slate-200 rounded-3xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-base font-bold text-slate-800">No products available</h3>
                <p className="text-xs text-slate-500 mt-2">This vendor has not uploaded any products yet</p>
              </motion.div>
            ) : filteredItems.length === 0 && showSearch ? (
              <motion.div 
                className="text-center py-16 bg-slate-50 border border-slate-200 rounded-3xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-base font-bold text-slate-800">No results found</h3>
                <p className="text-xs text-slate-500 mt-2">Try searching with different keywords</p>
              </motion.div>
            ) : (
              <motion.div 
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 sm:gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.05 }}
              >
                {filteredItems.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleItemClick(item)}
                    className="cursor-pointer"
                  >
                    <ProductCard key={item.id} item={item} showShopInfo={false} shopPhone={shop.phone} shopWhatsApp={shop.whatsapp_number} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </>
        ) : (
          <div className="space-y-8 text-left max-w-4xl">
            {/* Submit Review Form */}
            {user ? (
              <form onSubmit={handleRatingSubmit} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-base font-black text-slate-900">Write a Review</h3>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Select Rating</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setUserRating(star)}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            userRating >= star
                              ? 'fill-amber-500 text-amber-500'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Write your review</label>
                  <textarea
                    rows={3}
                    placeholder="Tell others about your experience with this vendor..."
                    value={userReview}
                    onChange={(e) => setUserReview(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-green-500 bg-slate-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingRating}
                  className="px-6 py-2.5 rounded-full bg-green-700 hover:bg-green-800 text-white text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submittingRating ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div className="bg-slate-50 p-6 rounded-3xl text-center border border-slate-200">
                <p className="text-sm font-semibold text-slate-600">Please log in to submit a review for this vendor.</p>
              </div>
            )}

            {/* Reviews list */}
            {reviewsLoading ? (
              <div className="text-center py-8">
                <span className="text-sm text-slate-500">Loading reviews...</span>
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-slate-50 p-8 rounded-3xl text-center border border-slate-200">
                <p className="text-sm font-semibold text-slate-500">No reviews yet. Be the first to review this vendor!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-base font-black text-slate-900">Reviews ({reviews.length})</h3>
                <div className="grid gap-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-extrabold text-sm text-slate-800">{rev.username}</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  rev.rating >= star ? 'fill-amber-500 text-amber-500' : 'text-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">
                          {new Date(rev.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      {rev.review ? (
                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{rev.review}</p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No comments written.</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.section>

      {/* Item Modal */}
      <ItemModal
        item={selectedItem}
        visible={showItemModal}
        onClose={closeModal}
        shop={shop}
        onAddToCart={(item) => {
          updateCartAndSave(prev => {
            const idx = prev.findIndex(i => i.item.id === item.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx].quantity += 1;
              return updated;
            } else {
              return [...prev, { item, quantity: 1 }];
            }
          });
          showToast('Added to cart! 🛒', 'success');
        }}
        onOrderNow={(item) => {
          setOrderItem(item);
          setShowOrderModal(true);
        }}
      />

      {/* Order Modal */}
      <OrderModal
        item={orderItem}
        visible={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        shop={shop}
      />

      {/* Cart Modal */}
      <CartModal
        visible={showCartModal}
        onClose={() => setShowCartModal(false)}
        cart={cart}
        setCart={updateCartAndSave}
        shop={shop}
      />
    </div>
  );
}