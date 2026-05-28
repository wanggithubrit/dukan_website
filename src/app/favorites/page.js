'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';
import ShopCard from '@/components/ShopCard';
import { ShopCardSkeleton } from '@/components/Skeletons';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useUserCoordinates } from '@/hooks/useUserCoordinates';
import { 
  Heart, 
  ArrowLeft, 
  Store, 
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function FavoritesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const { lat, lon, isLoaded } = useUserCoordinates();

  // Fetch favorite shops via API
  const { data: shops = [], isLoading, error } = useQuery({
    queryKey: ['favoriteShops', lat, lon, user?.username],
    queryFn: async () => {
      const userLat = lat || 25.7937;
      const userLon = lon || 93.7297;
      const res = await api.get(`/favorites/?lat=${userLat}&lon=${userLon}`);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!user && isLoaded,
    staleTime: 5 * 60 * 1000,
  });

  // Redirect if not logged in
  useEffect(() => {
    if (user === null && isLoaded) {
      showToast('Please login to view saved shops', 'error');
      router.replace('/customer/login');
    }
  }, [user, isLoaded, router, showToast]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-3xl border border-[#E0EAE6] shadow-premium max-w-sm w-full flex flex-col items-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <h3 className="text-sm font-extrabold text-slate-800">Checking Auth Status...</h3>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-white flex flex-col"
      style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
    >
      {/* Header */}
      <div className="sticky top-16 z-30 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                Saved Shops
              </h1>
              <p className="text-sm text-slate-600 mt-1">Your favorite local stores</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grow w-full">
        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <ShopCardSkeleton key={idx} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-red-200 p-8 max-w-md mx-auto flex flex-col items-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
            <h3 className="font-bold text-slate-900">Failed to load saved shops</h3>
            <p className="text-sm text-slate-600 mt-2">
              Could not retrieve your favorites. Please try again later.
            </p>
          </div>
        )}

        {/* Empty favorites list */}
        {!isLoading && !error && shops.length === 0 && (
          <div className="text-center py-16 bg-slate-50 rounded-xl border border-slate-200 p-8 max-w-md mx-auto flex flex-col items-center">
            <Heart className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="font-bold text-slate-900 mb-1">Your favorites list is empty</h3>
            <p className="text-sm text-slate-600 mb-6">
              Save your favorite shops to keep track of them
            </p>
            <Link 
              href="/"
              className="inline-flex items-center gap-2 bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-all"
            >
              <Store className="w-4 h-4" />
              Explore Shops
            </Link>
          </div>
        )}

        {/* Saved Shops Grid */}
        {!isLoading && !error && shops.length > 0 && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">
                Saved Shops
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {shops.length} {shops.length === 1 ? 'shop' : 'shops'} saved
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {shops.map((shop) => (
                <ShopCard 
                  key={shop.id} 
                  shop={shop} 
                  initiallyFavorited={true}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}