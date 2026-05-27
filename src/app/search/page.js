'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/utils/api';
import ShopCard from '@/components/ShopCard';
import { ShopCardSkeleton } from '@/components/Skeletons';
import { useUserCoordinates } from '@/hooks/useUserCoordinates';
import { ArrowLeft, Search, AlertCircle, Store, CheckCircle2, MapPin } from 'lucide-react';

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

const DISTANCE_RANGES = [
  { label: 'All', value: null },
  { label: '1 km', value: 1 },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '25 km', value: 25 },
];

const PREMIUM_PLANS = ['Pro', 'Business', 'Premium', 'pro', 'business', 'premium'];

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lat, lon, isLoaded } = useUserCoordinates();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDistance, setSelectedDistance] = useState(null);
  const [sortBy, setSortBy] = useState('distance');
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  // Fetch shops
  const { data: shops = [], isLoading, error } = useQuery({
    queryKey: ['searchShops', searchQuery, lat, lon],
    queryFn: async () => {
      try {
        const userLat = lat || 25.7937;
        const userLon = lon || 93.7297;
        const query = searchQuery.trim() || 'all';
        const res = await api.get(`/search?q=${encodeURIComponent(query)}&lat=${userLat}&lon=${userLon}`);
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        console.error('Failed to fetch search results:', err);
        return [];
      }
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Filter and sort shops
  const filteredShops = useMemo(() => {
    let filtered = shops;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(s => s.category?.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (selectedDistance !== null) {
      filtered = filtered.filter(s => {
        const distance = parseFloat(s.distance) || 999;
        return distance <= selectedDistance;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'distance') {
        const distA = parseFloat(a.distance) || 999;
        const distB = parseFloat(b.distance) || 999;
        return distA - distB;
      }
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0;
    });

    return filtered;
  }, [shops, selectedCategory, selectedDistance, sortBy]);

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Expanded Max-Width Header Framework */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3.5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-50 border border-slate-200/60 rounded-xl transition"
            >
              <ArrowLeft className="w-4 h-4 text-slate-700" />
            </button>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Search Marketplace</h1>
              <p className="text-[11px] text-slate-500 font-medium">Explore live local inventories instantly</p>
            </div>
          </div>

          {/* Full Screen Edge Width Input block configuration */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search store name, item tags, categories..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-brand-green-700 focus:bg-white transition"
            />
          </div>
        </div>
      </div>

      {/* Main Content container view structure */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Filters Sidebar Navigation */}
          <div className="lg:col-span-3">
            <div className="sticky top-24 space-y-5 p-4.5 bg-slate-50 rounded-2xl border border-slate-200/70">
              
              {/* Category Options Grid selector */}
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Category</h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <label key={cat} className="flex items-center gap-2.5 cursor-pointer hover:bg-white border border-transparent hover:border-slate-200/40 px-2.5 py-1.5 rounded-lg transition">
                      <input
                        type="radio"
                        name="category"
                        value={cat}
                        checked={selectedCategory === cat}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-3.5 h-3.5 accent-brand-green-700"
                      />
                      <span className="text-xs font-bold text-slate-700">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Distance Range Filter selector */}
              <div className="border-t border-slate-200/70 pt-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Max Radius</h3>
                <div className="space-y-1.5">
                  {DISTANCE_RANGES.map((range) => (
                    <label key={range.label} className="flex items-center gap-2.5 cursor-pointer hover:bg-white border border-transparent hover:border-slate-200/40 px-2.5 py-1.5 rounded-lg transition">
                      <input
                        type="radio"
                        name="distance"
                        value={range.value || ''}
                        checked={selectedDistance === range.value}
                        onChange={() => setSelectedDistance(range.value)}
                        className="w-3.5 h-3.5 accent-brand-green-700"
                      />
                      <span className="text-xs font-bold text-slate-700">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sorting Filter Selector layer */}
              <div className="border-t border-slate-200/70 pt-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Sort Priority</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-green-700"
                >
                  <option value="distance">Nearest Distance</option>
                  <option value="name">Alphabetical Name</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Output Canvas Framework */}
          <div className="lg:col-span-9">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-900 tracking-tight">
                  {searchQuery ? `Search Results for "${searchQuery}"` : 'All Available Shops'}
                </h2>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                  Found {filteredShops.length} matching asset{filteredShops.length !== 1 ? 's' : ''} in your area
                </p>
              </div>
            </div>

            {/* Loading Grid State (Configured to 3 Columns) */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {[...Array(6)].map((_, i) => <ShopCardSkeleton key={i} />)}
              </div>
            )}

            {/* Error Alert Display Box */}
            {error && (
              <div className="p-8 bg-red-50 border border-red-100 rounded-2xl text-center">
                <AlertCircle className="w-9 h-9 text-red-500 mx-auto mb-2" />
                <h3 className="font-bold text-xs text-slate-900 mb-0.5">Search execution pipeline failed</h3>
                <p className="text-[11px] text-slate-500">Could not sync up response arrays. Please reload browser view.</p>
              </div>
            )}

            {/* Empty Context Grid Result fallback block */}
            {!isLoading && !error && filteredShops.length === 0 && (
              <div className="p-12 bg-slate-50 rounded-2xl text-center border border-dashed border-slate-200">
                <Store className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-sm text-slate-900 mb-0.5">No matching stores found</h3>
                <p className="text-xs text-slate-500 mb-4">Try relaxing distance rules or clear filtering options</p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-green-700 text-white text-xs font-bold rounded-lg hover:bg-brand-green-800 transition shadow-sm"
                >
                  Return Dashboard
                </Link>
              </div>
            )}

            {/* Compact 3-Column Search Grid Result Set */}
            {!isLoading && !error && filteredShops.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {filteredShops.map((shop) => {
                  const isPremium = PREMIUM_PLANS.includes(shop.plan);
                  return (
                    <Link
                      key={shop.id}
                      href={`/shop/${shop.id}`}
                      className="flex flex-col bg-slate-50 hover:bg-brand-green-50/20 border border-slate-200/70 hover:border-brand-green-200 rounded-xl overflow-hidden transition group shadow-3xs"
                    >
                      {/* Image Thumbnail layout with Open Now Badge */}
                      <div className="w-full aspect-[16/10] bg-slate-200 relative overflow-hidden">
                        <img
                          src={shop.cover_image || shop.image || '/placeholder-shop.jpg'}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                          alt={shop.name}
                        />
                        {/* Open Now Absolute overlay */}
                        {shop.is_open && (
                          <div className="absolute top-2 left-2 bg-green-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded tracking-wider flex items-center gap-1 shadow-xs">
                            <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
                            OPEN NOW
                          </div>
                        )}
                      </div>

                      {/* Dense Card Body Frame */}
                      <div className="p-2.5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-bold text-xs text-slate-900 truncate leading-tight flex items-center gap-0.5">
                              {shop.name}
                              {isPremium && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-50 shrink-0" />
                              )}
                            </h4>
                            {isPremium && (
                              <span className="text-[8px] font-extrabold text-amber-700 bg-amber-100 border border-amber-200/50 px-1 rounded shrink-0">
                                PRO
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{shop.category}</p>
                        </div>

                        {/* Card Minimal Footer container */}
                        <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 mt-2.5">
                          {shop.distance ? (
                            <span className="text-[10px] font-bold text-slate-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-4xs">
                              <MapPin className="w-2.5 h-2.5 text-brand-green-700" />
                              {Number(shop.distance).toFixed(1)} km
                            </span>
                          ) : (
                            <div />
                          )}
                          <span className="text-[10px] font-bold text-brand-green-700 opacity-80 group-hover:opacity-100 transition-opacity">
                            Visit Store
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}