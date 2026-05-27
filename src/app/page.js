'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/utils/api';
import ShopCard from '@/components/ShopCard';
import { ShopCardSkeleton } from '@/components/Skeletons';
import {
  MapPin, Search, Clock, Store, ChevronDown, Heart,
  LayoutGrid, X, Package, ArrowRight, Navigation, Award,
  AlertCircle, Loader2, Building2
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import heroIllustration from '../../public/hero-illustration.png';

const PAGE_SIZE = 8;
const RANGES = [1, 5, 10, 25, 'All'];
const PREMIUM_PLANS = ['Pro', 'Business', 'Premium', 'pro', 'business', 'premium'];
const LOC_STORAGE_KEY = 'dukand_coords';

const CATEGORY_MAPPING = {
  All:         { activeBg: '#0A5C43', emoji: '🏪' },
  Grocery:     { activeBg: '#00A854', emoji: '🛒' },
  Footwear:    { activeBg: '#D97706', emoji: '👟' },
  Fashion:     { activeBg: '#DB2777', emoji: '👗' },
  Medicine:    { activeBg: '#DC2626', emoji: '💊' },
  Electronics: { activeBg: '#2563EB', emoji: '📱' },
  Bakeries:    { activeBg: '#D97706', emoji: '🥖' },
  Rentals:     { activeBg: '#7C3AED', emoji: '🔑' },
  Stationery:  { activeBg: '#0284C7', emoji: '📝' },
  Furniture:   { activeBg: '#6D28D9', emoji: '🛋️' },
  Books:       { activeBg: '#EA580C', emoji: '📚' },
  Others:      { activeBg: '#475569', emoji: '📦' },
};

const GLOBAL_CATEGORIES = Object.keys(CATEGORY_MAPPING);
const toKm = (d) => (d == null || d === '' || d === 'undefined') ? 999 : Number(d);
const byDistance = (a, b) => {
  const da = toKm(a.distance), db = toKm(b.distance);
  if (da !== db) return da - db;
  const ap = PREMIUM_PLANS.includes(a.plan), bp = PREMIUM_PLANS.includes(b.plan);
  return ap === bp ? 0 : ap ? -1 : 1;
};

// ─── LOCATION HOOK ─────────────────────────────────────────────────────────────
function useLocation() {
  const [coords, setCoords] = useState({ lat: null, lon: null });
  const [status, setStatus] = useState('idle');
  const [locLabel, setLocLabel] = useState('Set location');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(LOC_STORAGE_KEY);
      if (saved) {
        const { lat, lon, label } = JSON.parse(saved);
        if (lat && lon && lat !== 'undefined' && lon !== 'undefined') {
          setCoords({ lat: String(lat), lon: String(lon) });
          setLocLabel(label || `${Number(lat).toFixed(2)}, ${Number(lon).toFixed(2)}`);
          setStatus('granted');
        }
      }
    } catch (_) {}
  }, []);

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unavailable');
      return;
    }
    setStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = String(pos.coords.latitude);
        const lon = String(pos.coords.longitude);
        const label = `${Number(lat).toFixed(2)}, ${Number(lon).toFixed(2)}`;
        setCoords({ lat, lon });
        setLocLabel(label);
        setStatus('granted');
        try {
          localStorage.setItem(LOC_STORAGE_KEY, JSON.stringify({ lat, lon, label }));
        } catch (_) {}
      },
      (err) => { console.warn('Geolocation error:', err.message); setStatus('denied'); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  const hasCoords = status === 'granted' && !!coords.lat && !!coords.lon;
  return { lat: coords.lat, lon: coords.lon, status, hasCoords, locLabel, requestLocation };
}

// ─── HIGHLIGHT MATCH ──────────────────────────────────────────────────────────
function Highlight({ text = '', query = '' }) {
  if (!query.trim()) return <>{text}</>;
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-[#D1FAE5] text-[#065F46] rounded px-0.5 not-italic">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

// ─── SHOP SEARCH CARD ────────────────────────────────────────────────────────
function ShopSearchCard({ shop, query, onClick }) {
  const isPremium = PREMIUM_PLANS.includes(shop.plan);
  return (
    <Link
      href={`/shop/${shop.id}`}
      onClick={onClick}
      className="group relative flex flex-col bg-white border border-[#EAF3EE] rounded-2xl overflow-hidden transition-all duration-200 hover:border-[#0A5C43] hover:shadow-lg hover:-translate-y-0.5"
      style={{ '--tw-shadow': '0 8px 24px rgba(10,92,67,0.12)' }}
    >
      {isPremium && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">
          <Award className="w-2.5 h-2.5" />PRO
        </div>
      )}
      {/* Image */}
      <div className="w-full h-[72px] bg-[#F0FAF5] overflow-hidden shrink-0">
        {shop.cover_image || shop.image
          ? <img src={shop.cover_image || shop.image} alt={shop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-2xl">{CATEGORY_MAPPING[shop.category]?.emoji || '🏪'}</div>
        }
      </div>
      {/* Body */}
      <div className="p-2.5 flex flex-col gap-1 flex-1">
        <p className="text-[12px] font-bold text-slate-800 leading-tight truncate">
          <Highlight text={shop.name} query={query} />
        </p>
        <p className="text-[10px] text-slate-400 font-medium truncate">{shop.category}</p>
        <div className="flex items-center justify-between mt-auto pt-1">
          {shop.distance && (
            <span className="text-[10px] text-[#6B8E7E] font-semibold">{Number(shop.distance).toFixed(1)} km</span>
          )}
          {shop.is_open && (
            <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Open</span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── PRODUCT SEARCH CARD ─────────────────────────────────────────────────────
function ProductSearchCard({ item, idx, query, onClick }) {
  return (
    <Link
      href={`/shop/${item.shopId}`}
      onClick={onClick}
      className="group flex flex-col bg-white border border-[#EAF3EE] rounded-2xl overflow-hidden transition-all duration-200 hover:border-[#0A5C43] hover:shadow-lg hover:-translate-y-0.5"
      style={{ '--tw-shadow': '0 8px 24px rgba(10,92,67,0.12)' }}
    >
      {/* Image */}
      <div className="w-full h-[80px] bg-[#F3FAF6] overflow-hidden shrink-0 flex items-center justify-center">
        {item.image
          ? <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <Package className="w-7 h-7 text-[#0A5C43]/25" />
        }
      </div>
      {/* Body */}
      <div className="p-2.5 flex flex-col gap-1 flex-1">
        <p className="text-[12px] font-bold text-slate-800 leading-tight truncate">
          <Highlight text={item.name} query={query} />
        </p>
        <p className="text-[10px] text-slate-400 font-medium truncate">{item.shopName}</p>
        <div className="flex items-center justify-between mt-auto pt-1">
          {item.price && <span className="text-[13px] font-black text-[#0A5C43]">₹{item.price}</span>}
          {item.distance && <span className="text-[10px] text-[#6B8E7E] font-semibold">{Number(item.distance).toFixed(1)} km</span>}
        </div>
      </div>
    </Link>
  );
}

// ─── SEARCH OVERLAY ───────────────────────────────────────────────────────────
function SearchOverlay({ query, shops, range, onClose, onSubmit }) {
  const inputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const { filteredShops, productResults } = useMemo(() => {
    if (!Array.isArray(shops)) return { filteredShops: [], productResults: [] };
    const q = query.toLowerCase().trim();
    const cutoff = range !== 'All' ? Number(range) : null;
    const products = [];

    const filtered = shops.filter((s) => {
      if (cutoff != null && toKm(s.distance) > cutoff) return false;
      if (!q) return true;
      return s.name?.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q);
    }).sort(byDistance);

    shops.forEach((shop) => {
      (shop.items || []).forEach((item) => {
        if (q && !item.name?.toLowerCase().includes(q)) return;
        if (cutoff != null && toKm(shop.distance) > cutoff) return;
        products.push({ ...item, shopId: shop.id, shopName: shop.name, distance: shop.distance, plan: shop.plan, is_open: shop.is_open });
      });
    });
    products.sort(byDistance);
    return { filteredShops: filtered, productResults: products };
  }, [query, shops, range]);

  const showShops = activeTab === 'all' || activeTab === 'shops';
  const showProducts = activeTab === 'all' || activeTab === 'products';
  const hasResults = filteredShops.length > 0 || productResults.length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative z-10 flex flex-col bg-white w-full max-w-2xl mx-auto overflow-hidden"
        style={{
          borderRadius: '0 0 24px 24px',
          maxHeight: '92vh',
          boxShadow: '0 24px 80px rgba(0,0,0,0.28), 0 4px 12px rgba(10,92,67,0.12)',
          animation: 'searchIn 0.25s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* ── Search input ── */}
        <div className="px-4 pt-4 pb-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div
              className="flex-1 flex items-center gap-2.5 px-3.5 py-3 rounded-xl border-[1.5px] bg-[#F3FAF6] border-[#C8E8D6] transition-all duration-150 focus-within:border-[#0A5C43] focus-within:bg-white focus-within:shadow-sm"
              style={{ '--tw-shadow': '0 0 0 3px rgba(10,92,67,0.08)' }}
            >
              <Search className="w-4 h-4 text-[#0A5C43] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => onSubmit(e.target.value)}
                placeholder="Search shops, products, categories…"
                className="flex-1 bg-transparent text-sm font-medium text-slate-800 placeholder-[#9DB5A8] focus:outline-none"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
              />
              {query && (
                <button onClick={() => onSubmit('')} className="text-slate-400 hover:text-slate-600 transition shrink-0">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-11 h-11 rounded-xl border-[1.5px] border-[#E0EDE5] bg-[#F8FBF9] hover:bg-[#E8F5EE] flex items-center justify-center shrink-0 transition text-[#6B8E7E]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Result count */}
          <p className="text-[11px] text-slate-400 mt-2.5 px-1 font-medium">
            {query.trim()
              ? (hasResults ? `${filteredShops.length} shop${filteredShops.length !== 1 ? 's' : ''} · ${productResults.length} product${productResults.length !== 1 ? 's' : ''}` : 'No results found')
              : 'Start typing to search shops and products'}
          </p>

          {/* ── Tabs ── */}
          <div className="flex gap-1 mt-3">
            {[
              { id: 'all', label: 'All' },
              { id: 'shops', label: `Shops (${filteredShops.length})` },
              { id: 'products', label: `Products (${productResults.length})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3.5 py-2 text-[11px] font-bold rounded-t-lg transition-all ${
                  activeTab === t.id
                    ? 'bg-[#F3FAF6] text-[#0A5C43] border-b-2 border-[#0A5C43]'
                    : 'text-slate-400 hover:text-slate-600 border-b-2 border-transparent'
                }`}
                style={{ letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '10px' }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="h-px bg-[#F0F7F3]" />
        </div>

        {/* ── Results ── */}
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {!hasResults && query.trim() ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F3FAF6] border border-[#E0EDE5] flex items-center justify-center mb-3">
                <Search className="w-6 h-6 text-[#0A5C43]/25" />
              </div>
              <p className="text-sm font-bold text-slate-600">Nothing found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-400 mt-1">Try a different keyword or expand your range</p>
            </div>
          ) : (
            <div className="space-y-5 pt-4">

              {/* Shops grid */}
              {showShops && filteredShops.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Building2 className="w-3 h-3 text-[#0A5C43]/50" />
                    <span className="text-[10px] font-black text-[#0A5C43]/50 uppercase tracking-widest">Shops</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {filteredShops.map((shop) => (
                      <ShopSearchCard key={shop.id} shop={shop} query={query} onClick={onClose} />
                    ))}
                  </div>
                </div>
              )}

              {/* Products grid */}
              {showProducts && productResults.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Package className="w-3 h-3 text-[#0A5C43]/50" />
                    <span className="text-[10px] font-black text-[#0A5C43]/50 uppercase tracking-widest">Products</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {productResults.map((item, i) => (
                      <ProductSearchCard key={`${item.shopId}-${item.id || i}`} item={item} idx={i} query={query} onClick={onClose} />
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes searchIn {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── SECTION HEADER ──────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, iconColor = '#0A5C43', iconBg = '#E8F5EE', title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: iconBg }}>
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800 leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5 leading-snug">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center rounded-2xl border border-dashed border-[#C8E6D4] bg-[#FAFFFE]">
      <div className="w-12 h-12 rounded-xl bg-[#F0FAF5] flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-[#0A5C43]/30" />
      </div>
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1 max-w-[200px] leading-relaxed">{subtitle}</p>}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function HomeDashboard() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [range, setRange] = useState('All');
  const [activeBanner, setActiveBanner] = useState(0);
  const [shopPage, setShopPage] = useState(1);

  const { lat, lon, status, hasCoords, locLabel, requestLocation } = useLocation();

  useEffect(() => { setShopPage(1); }, [selectedCategory, range]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setSearchOpen(false); setSearch(''); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSearchChange = (value) => {
    setSearch(value);
    setSearchOpen(true);
  };

  const { data: bannerResponse = [] } = useQuery({
    queryKey: ['featuredBanners', lat, lon],
    queryFn: async () => {
      let url = '/banners/featured/';
      if (hasCoords) url += `?lat=${lat}&lon=${lon}`;
      const res = await api.get(url);
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (bannerResponse.length < 2) return;
    const t = setInterval(() => setActiveBanner((p) => (p + 1) % bannerResponse.length), 6000);
    return () => clearInterval(t);
  }, [bannerResponse.length]);

  const { data: shops = [], isLoading, isError } = useQuery({
    queryKey: ['cachedShops', lat, lon, range],
    queryFn: async () => {
      const rangeParam = range === 'All' ? '' : `&range=${range}`;
      const res = await api.get(`/shops/?lat=${lat}&lon=${lon}${rangeParam}`);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: hasCoords,
    refetchInterval: 20000,
    retry: 1,
  });

  const { filteredShops, openNowShops } = useMemo(() => {
    if (!Array.isArray(shops)) return { filteredShops: [], openNowShops: [] };
    const cutoff = range !== 'All' ? Number(range) : null;
    let filtered = shops.filter((s) => {
      if (cutoff != null && toKm(s.distance) > cutoff) return false;
      if (selectedCategory !== 'All' && s.category?.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      return true;
    });
    filtered.sort(byDistance);
    return { filteredShops: filtered, openNowShops: filtered.filter((s) => s.is_open) };
  }, [shops, selectedCategory, range]);

  return (
    <div
      className="w-full min-h-screen text-slate-900 pb-24"
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        background: '#F5FAF7',
      }}
    >
      {searchOpen && (
        <SearchOverlay
          query={search}
          shops={shops}
          range={range}
          onClose={() => { setSearchOpen(false); setSearch(''); }}
          onSubmit={handleSearchChange}
        />
      )}

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E2EFE8]" style={{ boxShadow: '0 1px 3px rgba(10,92,67,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">

          <Link href="/" className="flex items-center gap-2 shrink-0 hover:opacity-80 transition">
            <div className="w-8 h-8 rounded-lg bg-[#0A5C43] flex items-center justify-center text-white font-black text-sm shadow-sm">D</div>
            <span className="font-black text-base text-slate-900 hidden sm:inline tracking-tight">Dukand</span>
          </Link>

          <button
            onClick={requestLocation}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 shrink-0 transition max-w-[200px] hover:bg-slate-50 border border-[#E2EFE8] bg-white"
          >
            {status === 'requesting'
              ? <Loader2 className="w-3.5 h-3.5 text-[#0A5C43] animate-spin shrink-0" />
              : <MapPin className="w-3.5 h-3.5 text-[#0A5C43] shrink-0" />}
            <span className="truncate">{locLabel}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-0.5" />
          </button>

          {/* Search trigger — desktop */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex flex-1 items-center gap-2.5 max-w-md px-4 py-2.5 bg-[#F3FAF6] border border-[#D0E8DA] rounded-xl text-sm text-[#9DB5A8] font-medium hover:bg-[#EBF7F1] hover:border-[#A8D4BA] transition text-left"
          >
            <Search className="w-4 h-4 shrink-0" />
            Search shops, products…
            <span className="ml-auto text-[10px] font-bold text-slate-300 border border-slate-200 rounded px-1.5 py-0.5">⌘K</span>
          </button>

          <div className="ml-auto flex items-center gap-2 shrink-0">
            <Link href="/customer/login" className="hidden md:inline text-xs font-medium text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-[#E2EFE8]">Customer</Link>
            <Link href="/merchant/login" className="hidden md:inline text-xs font-medium text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-[#E2EFE8]">Merchant</Link>
            <Link href="/customer/signup" className="px-4 py-2 bg-[#0A5C43] hover:bg-[#084d38] active:bg-[#073d2e] text-white text-xs font-bold rounded-xl transition shadow-sm">Sign Up</Link>
          </div>
        </div>

        {/* Mobile: search + location row */}
        <div className="md:hidden px-3 pb-3 pt-1 flex items-center gap-2 bg-white">
          <button
            onClick={requestLocation}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-[#F3FAF6] border border-[#D0E8DA] text-xs font-medium text-slate-600 shrink-0 max-w-[110px] transition"
          >
            {status === 'requesting'
              ? <Loader2 className="w-3 h-3 text-[#0A5C43] animate-spin shrink-0" />
              : <MapPin className="w-3 h-3 text-[#0A5C43] shrink-0" />}
            <span className="truncate">{hasCoords ? locLabel : 'Location'}</span>
          </button>
          <button
            onClick={() => setSearchOpen(true)}
            className="flex-1 flex items-center gap-2 px-3 py-2 bg-[#F3FAF6] border border-[#D0E8DA] rounded-lg text-sm text-[#9DB5A8] font-medium"
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            Search…
          </button>
        </div>
      </header>

      {/* Location denied banner */}
      {status === 'denied' && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2.5 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-xs font-medium text-amber-800 flex-1">Location blocked — enable it in your browser settings.</p>
          <button onClick={requestLocation} className="text-xs font-bold text-amber-600 underline shrink-0">Retry</button>
        </div>
      )}

      <div className="max-w-7xl mx-auto">

        {/* ── HERO — desktop ── */}
        <div className="hidden md:grid grid-cols-2 gap-0 border-b border-[#D8EDE3] overflow-hidden" style={{ background: 'linear-gradient(135deg, #EAF5EE 0%, #F0FAF5 100%)' }}>
          <div className="px-10 pt-12 pb-10 flex flex-col justify-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#B0D9C0] bg-white/60 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0A5C43] animate-pulse" />
              <span className="text-xs font-semibold text-[#0A5C43]">Discover local shops</span>
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-black text-slate-900 leading-[1.08] tracking-tight">
                Find shops &amp; <span className="text-[#0A5C43]">products</span>
              </h1>
              <p className="text-4xl lg:text-5xl font-black text-slate-900 leading-[1.08] tracking-tight">near you</p>
            </div>
            <p className="text-sm text-slate-500 font-medium max-w-[300px] leading-relaxed">Shop local. Save time. Support your community.</p>
            <div className="flex flex-col gap-2 max-w-[280px] pt-1">
              {[
                { icon: Store,      label: 'Local shops near you' },
                { icon: LayoutGrid, label: 'Wide range of categories' },
                { icon: Heart,      label: 'Support local businesses' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 bg-white/70 border border-[#D0E9DB]">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-[#E6F5EC]">
                    <Icon className="w-3.5 h-3.5 text-[#0A5C43]" />
                  </div>
                  {label}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-end justify-center relative min-h-[340px]">
            <div className="relative w-full h-[380px] flex items-end justify-center overflow-hidden">
              <Image src={heroIllustration} alt="Dukand" priority className="w-full h-full object-contain object-bottom" />
              <div className="absolute top-8 left-6 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 z-10 bg-white border border-[#D0E9DB] shadow-sm">
                <Store className="w-4 h-4 text-[#0A5C43]" />Nearby shops
              </div>
              <div className="absolute top-20 right-6 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white z-10 bg-[#0A5C43]" style={{ boxShadow: '0 4px 16px rgba(10,92,67,0.3)' }}>
                <Clock className="w-3.5 h-3.5" />Save time everyday
              </div>
              <div className="absolute bottom-16 right-8 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 z-10 bg-white border border-[#D0E9DB] shadow-sm">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />Open now
              </div>
            </div>
          </div>
        </div>

        {/* ── TOOLBAR ── */}
        <div className="bg-white border-b border-[#E2EFE8] sticky top-14 z-40">
          {/* Range */}
          <div className="px-4 md:px-6 py-2.5 flex items-center gap-3 overflow-x-auto no-scrollbar border-b border-[#F0F7F3]">
            <button
              onClick={requestLocation}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 transition shrink-0 hover:bg-[#F3FAF6] border border-[#E2EFE8]"
            >
              <Navigation className="w-3.5 h-3.5 text-[#0A5C43]" />
              {status === 'requesting' ? 'Locating…' : 'My location'}
            </button>
            <div className="w-px h-4 bg-[#E2EFE8] hidden md:block shrink-0" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">Range</span>
            <div className="flex gap-1.5">
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${
                    range === r ? 'bg-[#0A5C43] text-white' : 'text-slate-500 bg-[#F3FAF6] hover:bg-[#E8F5EE] border border-[#E2EFE8]'
                  }`}
                >
                  {r === 'All' ? 'Any' : `${r}km`}
                </button>
              ))}
            </div>
          </div>
          {/* Categories */}
          <div className="flex items-center gap-2 px-4 md:px-6 py-2.5 overflow-x-auto no-scrollbar">
            {GLOBAL_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              const meta = CATEGORY_MAPPING[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs whitespace-nowrap transition shrink-0 ${
                    active ? 'text-white' : 'text-slate-600 bg-[#F3FAF6] hover:bg-[#E8F5EE] border border-[#E2EFE8]'
                  }`}
                  style={active ? { background: meta.activeBg } : {}}
                >
                  <span>{meta.emoji}</span>{cat}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-4 md:px-6 py-6 space-y-8">

          {/* ── BANNER ── */}
          {bannerResponse.length > 0 ? (
            <div className="w-full rounded-2xl overflow-hidden relative" style={{ boxShadow: '0 2px 12px rgba(10,92,67,0.10)' }}>
              {bannerResponse.map((b, i) => (
                <div key={b.id || i} className={`transition-opacity duration-700 ${i === activeBanner ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`} style={{ backgroundColor: b.background_color || '#0A5C43' }}>
                  {b.banner_type === 'image' && b.image
                    ? <div className="w-full aspect-video md:h-44"><img src={b.image} alt="banner" className="w-full h-full object-cover" /></div>
                    : <div className="px-7 py-8 text-white relative overflow-hidden">
                        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2 relative">{b.small_text || 'Save Time, Energy & Money'}</p>
                        <h3 className="text-2xl font-black relative tracking-tight">{b.title || 'Dukand'}</h3>
                        <p className="text-sm opacity-70 mt-1.5 relative">{b.subtitle || 'Make local shopping easy'}</p>
                      </div>
                  }
                </div>
              ))}
              {bannerResponse.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {bannerResponse.map((_, i) => (
                    <button key={i} onClick={() => setActiveBanner(i)} className={`rounded-full transition-all ${i === activeBanner ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #0A5C43 0%, #0d7a5a 100%)', boxShadow: '0 2px 16px rgba(10,92,67,0.18)' }}>
              <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="px-7 py-8 text-white relative">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Save Time, Energy &amp; Money</p>
                <h3 className="text-2xl font-black tracking-tight">DUKAND</h3>
                <p className="text-sm opacity-70 mt-1.5">Make local shopping easy</p>
              </div>
            </div>
          )}

          {/* ── OPEN NOW ── */}
          <section>
            <SectionHeader
              icon={Clock}
              iconColor="#059669"
              iconBg="#ECFDF5"
              title="Open Now Nearby"
              subtitle="Shops operational right now"
              action={
                hasCoords && openNowShops.length > PAGE_SIZE
                  ? <button className="text-xs font-semibold text-[#0A5C43] flex items-center gap-1 hover:underline shrink-0 pt-0.5">See all <ArrowRight className="w-3 h-3" /></button>
                  : null
              }
            />
            {hasCoords && isLoading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">{[...Array(3)].map((_, i) => <ShopCardSkeleton key={i} />)}</div>
            )}
            {hasCoords && !isLoading && openNowShops.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {openNowShops.slice(0, PAGE_SIZE).map((shop) => {
                  const isPremium = PREMIUM_PLANS.includes(shop.plan);
                  return (
                    <div key={`open-${shop.id}`} className="relative">
                      {isPremium && (
                        <div className="absolute top-2 right-2 z-10 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow flex items-center gap-0.5">
                          <Award className="w-2.5 h-2.5" />PRO
                        </div>
                      )}
                      <ShopCard shop={shop} />
                    </div>
                  );
                })}
              </div>
            )}
            {hasCoords && !isLoading && openNowShops.length === 0 && (
              <EmptyState icon={Clock} title="No shops open right now" subtitle="Check back later or explore all nearby shops below" />
            )}
          </section>

          {/* ── ALL NEARBY SHOPS ── */}
          <section>
            <SectionHeader
              icon={MapPin}
              iconColor="#0A5C43"
              iconBg="#E8F5EE"
              title="All Nearby Shops"
              subtitle={hasCoords ? `Within ${range === 'All' ? 'any distance' : range + ' km'} · ${selectedCategory !== 'All' ? selectedCategory : 'all categories'}` : 'Set your location to see shops near you'}
            />

            {!hasCoords && status !== 'requesting' && (
              <div className="bg-white border border-[#E2EFE8] rounded-2xl p-10 text-center space-y-4">
                <div className="w-14 h-14 bg-[#F3FAF6] border border-[#D0E9DB] rounded-2xl flex items-center justify-center mx-auto">
                  <Navigation className="w-6 h-6 text-[#0A5C43]" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Share your location</p>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-[240px] mx-auto leading-relaxed">We need your location to show nearby shops and accurate distances</p>
                </div>
                <button onClick={requestLocation} className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0A5C43] hover:bg-[#084d38] text-white text-sm font-semibold rounded-xl transition shadow-sm">
                  <Navigation className="w-4 h-4" />Use my location
                </button>
                {status === 'denied' && <p className="text-xs text-amber-600 font-medium">Location was blocked — allow it in browser settings and try again.</p>}
              </div>
            )}

            {status === 'requesting' && (
              <div className="bg-white border border-[#E2EFE8] rounded-2xl p-12 text-center space-y-3">
                <Loader2 className="w-7 h-7 text-[#0A5C43] animate-spin mx-auto" />
                <p className="text-sm text-slate-400">Getting your location…</p>
              </div>
            )}

            {hasCoords && isLoading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">{[...Array(6)].map((_, i) => <ShopCardSkeleton key={i} />)}</div>
            )}

            {hasCoords && isError && !isLoading && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-8 text-center space-y-2">
                <AlertCircle className="w-6 h-6 text-red-400 mx-auto" />
                <p className="text-sm font-semibold text-red-700">Failed to load shops</p>
                <p className="text-xs text-red-400">Check your connection and try again</p>
              </div>
            )}

            {hasCoords && !isLoading && !isError && (
              filteredShops.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {filteredShops.slice(0, shopPage * PAGE_SIZE).map((shop) => {
                      const isPremium = PREMIUM_PLANS.includes(shop.plan);
                      return (
                        <div key={shop.id} className="relative">
                          {isPremium && (
                            <div className="absolute top-2 right-2 z-10 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow flex items-center gap-0.5">
                              <Award className="w-2.5 h-2.5" />PRO
                            </div>
                          )}
                          <ShopCard shop={shop} />
                        </div>
                      );
                    })}
                  </div>
                  {filteredShops.length > shopPage * PAGE_SIZE && (
                    <div className="text-center pt-4">
                      <button onClick={() => setShopPage((p) => p + 1)} className="px-6 py-2.5 bg-white hover:bg-[#F3FAF6] text-sm font-semibold text-slate-600 rounded-xl border border-[#D8EDE3] transition">
                        Load more shops
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState icon={Store} title="No shops found" subtitle="Try a wider range or different category" />
              )
            )}
          </section>

        </div>
      </div>

      <BottomNav />
    </div>
  );
}