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
  ArrowLeft, Phone, MapPin, Share2, Heart, Smartphone, Zap, Compass, ShoppingBag, ChevronRight, Search, X, Sparkles
} from 'lucide-react';

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
const ItemModal = ({ item, visible, onClose }) => {
  if (!item) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Product Image */}
            <div className="relative w-full aspect-square bg-slate-100 overflow-hidden">
              <motion.img
                src={item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60'}
                alt={item.name}
                className="w-full h-full object-cover"
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />

              {/* Close Button */}
              <motion.button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5 text-slate-900" />
              </motion.button>
            </div>

            {/* Content */}
            <motion.div
              className="p-6 sm:p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Price Badge */}
              {item.price !== null && item.price !== undefined && (
                <motion.div
                  className="inline-flex items-center gap-2 bg-linear-to-br from-green-50 to-green-100 px-4 py-2 rounded-xl border border-green-200 mb-4"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  <span className="text-2xl font-black text-green-700">
                    ₹{item.price % 1 === 0 ? parseFloat(item.price).toFixed(0) : parseFloat(item.price).toFixed(2)}
                  </span>
                </motion.div>
              )}

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 leading-tight">
                {item.name}
              </h2>

              {/* Description */}
              {item.description && (
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                  {item.description}
                </p>
              )}

              {/* Stock Status */}
              {item.track_quantity && (
                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {item.quantity_status === 'out' && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 text-red-700 border border-red-200 font-bold text-sm">
                      <span className="w-2 h-2 rounded-full bg-red-700" />
                      Out of Stock
                    </div>
                  )}
                  {item.quantity_status === 'low' && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-100 text-yellow-700 border border-yellow-200 font-bold text-sm">
                      <span className="w-2 h-2 rounded-full bg-yellow-700" />
                      Only {item.quantity} left
                    </div>
                  )}
                  {item.quantity_status === 'in' && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 text-green-700 border border-green-200 font-bold text-sm">
                      <span className="w-2 h-2 rounded-full bg-green-700 animate-pulse" />
                      {item.quantity || 'In Stock'}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <motion.button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-900 font-bold hover:bg-slate-50 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Close
                </motion.button>
                <motion.button
                  className="flex-1 py-3 rounded-xl bg-linear-to-r from-green-600 to-green-700 text-white font-bold hover:shadow-lg transition-shadow"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Contact Shop
                </motion.button>
              </div>
            </motion.div>
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
  const [isFavorited, setIsFavorited] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
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

  const { shop = {}, banners = [], items = [] } = data;
  const isPremium = shop.plan === 'pro';
  
  // Format distance
  const formatDistance = (distance) => {
    if (!distance) return '';
    const d = Number(distance);
    if (d < 1) return `${Math.round(d * 1000)} m`;
    if (d < 100) return `${d.toFixed(1)} km`;
    return `${Math.round(d)} km`;
  };

  // Check if favorite
  useEffect(() => {
    if (user && shop.id) {
      const faves = JSON.parse(localStorage.getItem('favorites') || '[]');
      setIsFavorited(faves.includes(shop.id));
    }
  }, [user, shop.id]);

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
    setLoadingFav(true);
    try {
      const faves = JSON.parse(localStorage.getItem('favorites') || '[]');
      const updated = isFavorited 
        ? faves.filter((favId) => favId !== shop.id) 
        : [...faves, shop.id];
      localStorage.setItem('favorites', JSON.stringify(updated));
      setIsFavorited(!isFavorited);
      showToast(isFavorited ? 'Removed from favorites' : 'Added to favorites', 'success');
    } catch (err) {
      showToast('Error updating favorites', 'error');
    } finally {
      setLoadingFav(false);
    }
  }, [user, shop.id, isFavorited, showToast]);

  // Handle share
  const handleShare = useCallback(() => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      showToast('Store link copied!', 'success');
    }
  }, [showToast]);

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

  if (isLoading) {
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
        <p className="text-slate-600 mt-2 text-center">The shop you're looking for doesn't exist or is no longer available.</p>
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

  const coverImage = shop.cover_image || shop.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=60';
  const avatarUrl = shop.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&auto=format&fit=crop&q=60';
  
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
        <motion.img
          src={coverImage}
          alt={shop.name}
          className="w-full h-full object-cover"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8 }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/30 to-transparent" />
        
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
                className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-md shrink-0 border-2 border-green-100 bg-slate-100"
                whileHover={{ scale: 1.05 }}
              >
                <img src={avatarUrl} alt={shop.name} className="w-full h-full object-cover" />
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
                onClick={() => showToast("Opening Dukand app...", "info")}
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
        {banners.length > 0 && (
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

            <div className="space-y-3">
              {banners.slice(0, 4).map((banner, idx) => {
                const gradients = [
                  'from-green-600 via-green-700 to-green-800',
                  'from-blue-600 via-blue-700 to-blue-800',
                  'from-purple-600 via-purple-700 to-purple-800',
                  'from-rose-600 via-rose-700 to-rose-800',
                ];
                const bgGradient = gradients[idx % 4];

                return (
                  <motion.div
                    key={banner.id || idx}
                    className={`group relative overflow-hidden bg-linear-to-br ${bgGradient} p-6 sm:p-8 shadow-lg min-h-40 flex flex-col justify-between cursor-pointer mx-4 sm:mx-6 lg:mx-8 rounded-2xl`}
                    initial={{ opacity: 0, x: -100 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                    whileHover={{ scale: 1.02, shadow: '2xl' }}
                  >
                    {/* Animated Background */}
                    <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                      <ShoppingBag className="absolute -right-16 -top-16 w-48 h-48 text-white" />
                    </div>

                    {/* Content */}
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-5 h-5 text-yellow-300" />
                        <span className="text-xs uppercase tracking-widest font-black text-white/90">
                          {banner.discount ? 'Hot Deal' : 'Limited'}
                        </span>
                      </div>

                      <h3 className="font-black text-white text-base sm:text-lg mb-2 line-clamp-2">
                        {banner.text || banner.title || banner.name || 'Exclusive Offer'}
                      </h3>

                      {(banner.subtext || banner.description || banner.subtitle) && (
                        <p className="text-xs sm:text-sm text-white/85 font-medium line-clamp-2">
                          {banner.subtext || banner.description || banner.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between relative z-10">
                      {banner.discount && (
                        <span className="text-sm sm:text-base font-black text-yellow-300">
                          {banner.discount}
                        </span>
                      )}
                      <span className="text-xs font-bold text-white/80 ml-auto flex items-center gap-1 group-hover:text-white transition-colors">
                        Shop Now
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
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
            <p className="text-xs text-slate-500 mt-2">This vendor hasn't uploaded any products yet</p>
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
                <ProductCard key={item.id} item={item} showShopInfo={false} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.section>

      {/* Item Modal */}
      <ItemModal item={selectedItem} visible={showItemModal} onClose={closeModal} />
    </div>
  );
}