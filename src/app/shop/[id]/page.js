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
  ArrowLeft, Phone, MapPin, Share2, Heart, Smartphone, Zap, Compass, ShoppingBag, ChevronRight, Search, X, Sparkles, AlertCircle, Clock
} from 'lucide-react';
import AdBanner from '@/components/AdBanner';

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
const ItemModal = ({ item, visible, onClose, shop }) => {
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

                {/* Footer Action Button */}
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <motion.button
                    onClick={onClose}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
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
  const isPremium = shop.plan === 'pro';
  const galleryImages = Array.isArray(media)
    ? media.map((entry) => normalizeImageUrl(entry?.image || entry?.src || entry?.url)).filter(Boolean)
    : [];
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

              {shop.phone && (
                <motion.a 
                  href={`https://wa.me/${(shop.whatsapp_number || shop.phone).replace(/\D/g, '')}`}
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
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
            <AdBanner />
          </div>
        )}
      </AnimatePresence>

      {/* Search Bar & Products Section */}
      <motion.section 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-12 pb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
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
      </motion.section>

      {/* Item Modal */}
      <ItemModal item={selectedItem} visible={showItemModal} onClose={closeModal} shop={shop} />
    </div>
  );
}