'use client';

import React, { useState, useMemo, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/utils/api';
import { useUserCoordinates } from '@/hooks/useUserCoordinates';

import {
  ArrowLeft,
  Search,
  AlertCircle,
  Store,
  CheckCircle2,
  MapPin,
  Star,
  ChevronDown,
  Download,
  User,
  Sparkles,
  Clock,
  Compass,
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  'All',
  'Grocery',
  'Footwear',
  'Fashion',
  'Medicine',
  'Electronics',
  'Bakeries',
  'Rentals',
  'Stationery',
  'Furniture',
  'Books',
  'Others',
];

const PREMIUM_PLANS = ['Pro', 'Business', 'Premium', 'pro', 'business', 'premium'];

// Nice custom fallback avatars for mock stack
const MOCK_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&auto=format&fit=crop&q=60',
];

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lat, lon } = useUserCoordinates();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    Promise.resolve().then(() => {
      setMounted(true);
    });
  }, []);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDistance, setSelectedDistance] = useState(25); // default slider limit
  const [minRating, setMinRating] = useState('All');

  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const {
    data: shops = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['searchShops', searchQuery, lat, lon],
    queryFn: async () => {
      try {
        const userLat = lat || 25.7937;
        const userLon = lon || 93.7297;
        const query = searchQuery.trim() || 'all';

        const res = await api.get(
          `/search?q=${encodeURIComponent(query)}&lat=${userLat}&lon=${userLon}`
        );
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        console.error('Search fetch failed:', err);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const filteredShops = useMemo(() => {
    let filtered = [...shops];

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(
        (s) => s.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (selectedDistance !== null && selectedDistance < 25) {
      filtered = filtered.filter((s) => {
        const distance = parseFloat(s.distance) || 999;
        return distance <= selectedDistance;
      });
    }

    if (minRating !== 'All') {
      const ratingThreshold = parseFloat(minRating);
      filtered = filtered.filter((s) => {
        // Mocking dynamic premium star rating if backend doesn't supply it
        const shopRating = s.rating || (PREMIUM_PLANS.includes(s.plan) ? 4.8 : 4.2);
        return shopRating >= ratingThreshold;
      });
    }

    // Default sort by premium plan and then by distance
    filtered.sort((a, b) => {
      const aPremium = PREMIUM_PLANS.includes(a.plan);
      const bPremium = PREMIUM_PLANS.includes(b.plan);
      if (aPremium && !bPremium) return -1;
      if (!aPremium && bPremium) return 1;
      return (parseFloat(a.distance) || 999) - (parseFloat(b.distance) || 999);
    });

    return filtered;
  }, [shops, selectedCategory, selectedDistance, minRating]);

  // Loading skeleton matching mock layout
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F9F5] pb-20 font-outfit">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-10 bg-slate-200 rounded-xl w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-3 space-y-6">
                <div className="h-64 bg-slate-200 rounded-3xl"></div>
              </div>
              <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-96 bg-slate-200 rounded-3xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F9F5] pb-20 text-[#092219] font-outfit">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E6F4EE] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#E6F4EE] flex items-center justify-center shadow-xs">
              <Image src="/logo_green.png" alt="MyDukan" width={22} height={22} />
            </div>
            <span className="text-lg font-black tracking-tight text-[#0A5C43]">
              My<span className="text-[#092219]">Dukan</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <Link href="/" className="hover:text-[#0A5C43] transition-colors">Shops</Link>
            <Link href="/search" className="text-[#0A5C43] hover:text-[#0A5C43] transition-colors">Products</Link>
            <Link href="/" className="hover:text-[#0A5C43] transition-colors">Offers</Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search neighborhood..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0A5C43] focus:bg-white transition-all font-medium"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded-md select-none pointer-events-none">
                ⌘K
              </span>
            </div>

            <Link href="/merchant/login">
              <motion.button
                className="flex items-center gap-2 px-4 py-2 bg-[#0A5C43] hover:bg-[#084834] text-white rounded-full text-xs font-black transition-colors shadow-xs"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <User className="w-3.5 h-3.5" />
                Account
              </motion.button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── BREADCRUMBS & HEADING ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="text-[11px] font-black tracking-wider uppercase text-slate-400 flex items-center gap-1.5 mb-2">
          <span>Discovery</span>
          <span>&gt;</span>
          <span className="text-[#0A5C43]">Search Results</span>
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#092219]">
          Found {filteredShops.length} local shops
        </h1>
      </div>

      {/* ── MAIN LAYOUT GRID ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* SIDEBAR FILTERS */}
          <div className="lg:col-span-3">
            <div className="sticky top-24 space-y-8 bg-white border border-[#E6F4EE] rounded-3xl p-6 shadow-xs text-left">
              
              {/* Category */}
              <div>
                <h3 className="text-sm font-black text-[#092219] mb-4">Category</h3>
                <div className="space-y-3.5">
                  {CATEGORY_OPTIONS.slice(0, 8).map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className="flex items-center gap-3 w-full group cursor-pointer text-left"
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-[#0A5C43] border-[#0A5C43] shadow-xs' 
                            : 'border-slate-300 group-hover:border-[#0A5C43]'
                        }`}>
                          {isSelected && (
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                          )}
                        </div>
                        <span className={`text-xs font-bold transition-colors ${
                          isSelected ? 'text-[#0A5C43] font-black' : 'text-slate-500 group-hover:text-slate-800'
                        }`}>
                          {cat === 'All' ? 'Artisanal Bakery' : cat}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Distance Slider */}
              <div className="pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black text-[#092219]">Distance</h3>
                  <span className="text-[10px] font-black bg-[#E6F4EE] text-[#0A5C43] px-2 py-0.5 rounded-full">
                    {selectedDistance} km
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="25"
                  value={selectedDistance}
                  onChange={(e) => setSelectedDistance(Number(e.target.value))}
                  className="w-full accent-[#0A5C43] h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2">
                  <span>1km</span>
                  <span>25km</span>
                </div>
              </div>

              {/* Min Rating Selector */}
              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-sm font-black text-[#092219] mb-3">Min Rating</h3>
                <div className="flex gap-2">
                  {['All', '2+', '3+', '4+'].map((rating) => {
                    const isSelected = minRating === rating;
                    return (
                      <button
                        key={rating}
                        onClick={() => setMinRating(rating)}
                        className={`flex-1 py-2 text-center rounded-xl text-xs font-black transition-all ${
                          isSelected 
                            ? 'bg-[#0A5C43] text-white shadow-sm' 
                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {rating}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* SHOP RESULTS */}
          <div className="lg:col-span-9">
            {filteredShops.length === 0 ? (
              <div className="bg-white border border-[#E6F4EE] rounded-3xl p-16 text-center shadow-xs">
                <Store className="w-12 h-12 text-[#0A5C43]/40 mx-auto mb-4" />
                <h3 className="text-xl font-black text-[#092219]">No local shops found</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
                  Try adjusting your distance range, category filters, or search terms to find more shops.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedDistance(25);
                    setMinRating('All');
                    setSearchQuery('');
                  }}
                  className="mt-6 px-6 py-2.5 bg-[#0A5C43] hover:bg-[#084834] text-white text-xs font-black rounded-full shadow-sm transition-all"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredShops.map((shop, idx) => {
                  const isPremium = PREMIUM_PLANS.includes(shop.plan);
                  
                  // Mock beautiful visuals & data tags strictly matching provided screenshots
                  const shopRating = shop.rating || (isPremium ? 4.9 - (idx % 2) * 0.1 : 4.5);
                  const isClosed = !shop.is_open;
                  const shopDesc = shop.description || (isPremium 
                    ? "Authentic neighborhood sourdough and organic pastries baked daily with locally..."
                    : "Carefully curated zero-waste products for a more conscious and sustainable neighborhood...");

                  return (
                    <motion.div
                      key={shop.id}
                      className="bg-white border border-[#E6F4EE] rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col group h-full"
                      whileHover={{ y: -2 }}
                    >
                      {/* Cover Photo */}
                      <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden shrink-0">
                        <img
                          src={shop.cover_image || shop.image || 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400'}
                          alt={shop.name}
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400';
                          }}
                        />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                          {isPremium && (
                            <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                              <CheckCircle2 className="w-2.5 h-2.5 text-[#2DD882]" />
                              PRO
                            </span>
                          )}
                          <span className="bg-white/80 backdrop-blur-md text-slate-800 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {shop.category || 'Local'}
                          </span>
                        </div>

                        {/* Distance Badge Bottom-Right */}
                        {shop.distance != null && (
                          <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-md text-[#092219] text-[9px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#0A5C43]" />
                            {shop.distance < 1 ? `Nearby (${Math.round(shop.distance * 1000)}m)` : `Approx. ${Number(shop.distance).toFixed(1)} km`}
                          </div>
                        )}
                      </div>

                      {/* Content Card Body */}
                      <div className="p-5 flex flex-col grow justify-between text-left">
                        <div>
                          {/* Heading & Rating */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-black text-[#092219] text-base group-hover:text-[#0A5C43] transition-colors leading-snug line-clamp-1">
                              {shop.name}
                            </h3>
                            <div className="flex items-center gap-1 shrink-0 text-[#092219]">
                              <Star className="w-3.5 h-3.5 fill-[#0A5C43] text-[#0A5C43]" />
                              <span className="text-xs font-black">{shopRating.toFixed(1)}</span>
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6 line-clamp-2">
                            {shopDesc}
                          </p>
                        </div>

                        {/* Card Action Footer */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                          {/* Left Tags / Avatars */}
                          {idx % 4 === 0 ? (
                            <div className="flex items-center">
                              <div className="flex -space-x-1.5 overflow-hidden">
                                {MOCK_AVATARS.map((avatar, aIdx) => (
                                  <img
                                    key={aIdx}
                                    className="inline-block h-5.5 w-5.5 rounded-full ring-2 ring-white object-cover"
                                    src={avatar}
                                    alt="User review avatar"
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] font-black text-slate-400 ml-1.5">+12</span>
                            </div>
                          ) : idx % 4 === 1 ? (
                            <div className="flex items-center gap-1 text-slate-400">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span className="text-[10px] font-bold">Closes 8:00 PM</span>
                            </div>
                          ) : idx % 4 === 2 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E6F4EE] text-[#0A5C43] text-[9px] font-black uppercase tracking-wider">
                              🍃 Free Delivery
                            </span>
                          ) : (
                            <span className="text-[10px] font-black text-slate-500 flex items-center gap-1">
                              🏷️ Rewards Program
                            </span>
                          )}

                          {/* Action Button */}
                          <Link href={`/shop/${shop.id}`}>
                            <motion.button
                              className="px-4 py-2 bg-[#0A5C43] hover:bg-[#084834] text-white text-xs font-black rounded-full transition-colors"
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              {idx % 4 === 0 ? 'View Menu' : idx % 4 === 1 ? 'Explore' : idx % 4 === 2 ? 'Browse' : 'Shop Now'}
                            </motion.button>
                          </Link>
                        </div>
                      </div>

                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* PAGINATION FOOTER */}
            {filteredShops.length > 0 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-white transition cursor-pointer text-slate-400 font-black">
                  &lt;
                </button>
                <button className="w-8 h-8 rounded-full bg-[#0A5C43] text-white flex items-center justify-center text-xs font-black shadow-xs">
                  1
                </button>
                <button className="w-8 h-8 rounded-full hover:bg-white text-slate-600 transition flex items-center justify-center text-xs font-bold cursor-pointer">
                  2
                </button>
                <button className="w-8 h-8 rounded-full hover:bg-white text-slate-600 transition flex items-center justify-center text-xs font-bold cursor-pointer">
                  3
                </button>
                <span className="text-slate-400 text-xs px-1">...</span>
                <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-white transition cursor-pointer text-slate-600 font-black">
                  &gt;
                </button>
              </div>
            )}

          </div>

        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="mt-20 border-t border-[#E6F4EE] bg-white pt-16 pb-12 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <span className="text-lg font-black tracking-tight text-[#0A5C43] mb-4 block">
              My<span className="text-[#092219]">Dukan</span>
            </span>
            <p className="text-slate-400 text-xs font-medium leading-relaxed pr-4">
              Empowering local neighborhoods through digital connectivity and sustainable commerce. Your local marketplace, reimagined.
            </p>
            <p className="text-[10px] text-slate-400 font-bold mt-6">
              © {new Date().getFullYear()} MyDukan. Digital Neighborhoods.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-black text-[#092219] uppercase tracking-wider mb-4">Company</h4>
            <div className="space-y-3 flex flex-col text-xs font-bold text-slate-500">
              <Link href="/about" className="hover:text-[#0A5C43] transition">About Us</Link>
              <Link href="/" className="hover:text-[#0A5C43] transition">Privacy Policy</Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-black text-[#092219] uppercase tracking-wider mb-4">Partners</h4>
            <div className="space-y-3 flex flex-col text-xs font-bold text-slate-500">
              <Link href="/merchant/login" className="hover:text-[#0A5C43] transition">Merchant Portal</Link>
              <Link href="/" className="hover:text-[#0A5C43] transition">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F4F9F5]">
          <div className="text-sm font-semibold text-[#0A5C43] animate-pulse">
            Loading Marketplace...
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}