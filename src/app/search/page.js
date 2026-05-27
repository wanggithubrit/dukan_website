'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/utils/api';
import { ShopCardSkeleton } from '@/components/Skeletons';
import { useUserCoordinates } from '@/hooks/useUserCoordinates';

import {
  ArrowLeft,
  Search,
  AlertCircle,
  Store,
  CheckCircle2,
  MapPin,
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

const DISTANCE_RANGES = [
  { label: 'All', value: null },
  { label: '1 km', value: 1 },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '25 km', value: 25 },
];

const PREMIUM_PLANS = [
  'Pro',
  'Business',
  'Premium',
  'pro',
  'business',
  'premium',
];

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lat, lon } = useUserCoordinates();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDistance, setSelectedDistance] = useState(null);
  const [sortBy, setSortBy] = useState('distance');

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
        (s) =>
          s.category?.toLowerCase() ===
          selectedCategory.toLowerCase()
      );
    }

    if (selectedDistance !== null) {
      filtered = filtered.filter((s) => {
        const distance = parseFloat(s.distance) || 999;
        return distance <= selectedDistance;
      });
    }

    filtered.sort((a, b) => {
      if (sortBy === 'distance') {
        return (
          (parseFloat(a.distance) || 999) -
          (parseFloat(b.distance) || 999)
        );
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

      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
            >
              <ArrowLeft className="w-4 h-4 text-slate-700" />
            </button>

            <div>
              <h1 className="text-lg font-black text-slate-900">
                Search Marketplace
              </h1>

              <p className="text-xs text-slate-500">
                Discover nearby local shops
              </p>
            </div>
          </div>

          {/* SEARCH */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shops, products, categories..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
            />
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* SIDEBAR */}
          <div className="lg:col-span-3">

            <div className="sticky top-24 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-6">

              {/* CATEGORY */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  Categories
                </h3>

                <div className="space-y-2">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <label
                      key={cat}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        value={cat}
                        checked={selectedCategory === cat}
                        onChange={(e) =>
                          setSelectedCategory(e.target.value)
                        }
                        className="accent-green-700"
                      />

                      <span className="text-sm font-medium text-slate-700">
                        {cat}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* DISTANCE */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  Distance
                </h3>

                <div className="space-y-2">
                  {DISTANCE_RANGES.map((range) => (
                    <label
                      key={range.label}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        checked={selectedDistance === range.value}
                        onChange={() =>
                          setSelectedDistance(range.value)
                        }
                        className="accent-green-700"
                      />

                      <span className="text-sm font-medium text-slate-700">
                        {range.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* SORT */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  Sort By
                </h3>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="distance">
                    Nearest Distance
                  </option>

                  <option value="name">
                    Alphabetical Name
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* RESULTS */}
          <div className="lg:col-span-9">

            <div className="mb-5">
              <h2 className="text-lg font-black text-slate-900">
                {searchQuery
                  ? `Results for "${searchQuery}"`
                  : 'Nearby Shops'}
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Found {filteredShops.length} shops
              </p>
            </div>

            {/* LOADING */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <ShopCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />

                <h3 className="font-bold text-slate-900">
                  Failed to load shops
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  Please refresh and try again
                </p>
              </div>
            )}

            {/* EMPTY */}
            {!isLoading &&
              !error &&
              filteredShops.length === 0 && (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center">

                  <Store className="w-10 h-10 text-slate-300 mx-auto mb-3" />

                  <h3 className="text-lg font-bold text-slate-900">
                    No Shops Found
                  </h3>

                  <p className="text-sm text-slate-500 mt-2">
                    Try changing filters or search keywords
                  </p>

                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 mt-5 px-4 py-2 bg-green-700 text-white rounded-xl text-sm font-bold hover:bg-green-800 transition"
                  >
                    Back Home
                  </Link>
                </div>
              )}

            {/* RESULTS */}
            {!isLoading &&
              !error &&
              filteredShops.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

                  {filteredShops.map((shop) => {
                    const isPremium = PREMIUM_PLANS.includes(
                      shop.plan
                    );

                    return (
                      <Link
                        key={shop.id}
                        href={`/shop/${shop.id}`}
                        className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition group"
                      >
                        {/* IMAGE */}
                        <div className="aspect-[16/10] bg-slate-200 overflow-hidden relative">

                          <img
                            src={
                              shop.cover_image ||
                              shop.image ||
                              '/placeholder-shop.jpg'
                            }
                            alt={shop.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />

                          {shop.is_open && (
                            <div className="absolute top-2 left-2 bg-green-600 text-white text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                              OPEN
                            </div>
                          )}
                        </div>

                        {/* BODY */}
                        <div className="p-4">

                          <div className="flex items-center justify-between gap-2">

                            <h3 className="font-bold text-slate-900 truncate flex items-center gap-1">
                              {shop.name}

                              {isPremium && (
                                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                              )}
                            </h3>

                            {isPremium && (
                              <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                                PRO
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-slate-500 mt-1">
                            {shop.category}
                          </p>

                          <div className="flex items-center justify-between mt-4 border-t border-slate-200 pt-3">

                            {shop.distance ? (
                              <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                                <MapPin className="w-3 h-3 text-green-700" />
                                {Number(shop.distance).toFixed(1)} km
                              </div>
                            ) : (
                              <div />
                            )}

                            <span className="text-sm font-bold text-green-700">
                              Visit →
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

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-sm font-semibold text-slate-500">
            Loading Search...
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}