'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/utils/api';
import ShopCard from '@/components/ShopCard';
import { ShopCardSkeleton } from '@/components/Skeletons';
import BottomNav from '@/components/BottomNav';
import heroIllustration from '../../public/hero-illustration.png';
import {
  MapPin, Search, Clock, Store, ChevronDown, Heart,
  LayoutGrid, X, Package, ArrowRight, Navigation, Award,
  AlertCircle, Loader2, Building2, Download,
} from 'lucide-react';

/* ─── CONSTANTS ───────────────────────────────────────────────────────────── */
const PAGE_SIZE = 6;
const RANGES = ['All', 1, 5, 10, 25];
const PREMIUM_PLANS = ['Pro', 'Business', 'Premium', 'pro', 'business', 'premium'];
const formatDistance = (distance) => {
  if (distance == null || distance === '' || distance === 'undefined') return '';
  const d = Number(distance);
  if (d < 1) return `Nearby (${Math.round(d * 1000)}m)`;
  return `Approx. ${d.toFixed(1)} km`;
};
const LOC_STORAGE_KEY = 'dukand_coords';

const CATEGORY_MAPPING = {
  All:         { emoji: '🏪', color: '#1a5c3a', bg: '#e8f5ee' },
  Grocery:     { emoji: '🛒', color: '#166534', bg: '#dcfce7' },
  Footwear:    { emoji: '👟', color: '#92400e', bg: '#fef3c7' },
  Fashion:     { emoji: '👗', color: '#9d174d', bg: '#fce7f3' },
  Medicine:    { emoji: '💊', color: '#991b1b', bg: '#fee2e2' },
  Electronics: { emoji: '📱', color: '#1e3a8a', bg: '#eff6ff' },
  Bakeries:    { emoji: '🥖', color: '#78350f', bg: '#fef3c7' },
  Rentals:     { emoji: '🔑', color: '#4c1d95', bg: '#ede9fe' },
  Stationery:  { emoji: '📝', color: '#0c4a6e', bg: '#e0f2fe' },
  Furniture:   { emoji: '🛋️', color: '#4a1d96', bg: '#ede9fe' },
  Books:       { emoji: '📚', color: '#7c2d12', bg: '#fff7ed' },
  Others:      { emoji: '📦', color: '#374151', bg: '#f3f4f6' },
};
const GLOBAL_CATEGORIES = Object.keys(CATEGORY_MAPPING);

const toKm = (d) => (d == null || d === '' || d === 'undefined') ? 999 : Number(d);
const byDistance = (a, b) => {
  const da = toKm(a.distance), db = toKm(b.distance);
  if (da !== db) return da - db;
  const ap = PREMIUM_PLANS.includes(a.plan), bp = PREMIUM_PLANS.includes(b.plan);
  return ap === bp ? 0 : ap ? -1 : 1;
};

function useLocation() {
  const [coords, setCoords] = useState({ lat: null, lon: null });
  const [status, setStatus] = useState('idle');
  const [locLabel, setLocLabel] = useState('Set location');

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unavailable'); return;
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
        try { localStorage.setItem(LOC_STORAGE_KEY, JSON.stringify({ lat, lon, label })); } catch (_) {}
      },
      (err) => { console.warn('Geolocation error:', err.message); setStatus('denied'); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  useEffect(() => {
    // 1. Read from localStorage on mount (client-only)
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOC_STORAGE_KEY);
        if (saved) {
          const { lat, lon, label } = JSON.parse(saved);
          if (lat && lon && lat !== 'undefined' && lon !== 'undefined') {
            const finalLabel = label || `${Number(lat).toFixed(2)}, ${Number(lon).toFixed(2)}`;
            setCoords({ lat: String(lat), lon: String(lon) });
            setStatus('granted');
            setLocLabel(finalLabel);
          }
        }
      } catch (_) {}
    }

    // 2. Always request fresh location in the background if browser supports it
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = String(pos.coords.latitude);
          const lon = String(pos.coords.longitude);
          const label = `${Number(lat).toFixed(2)}, ${Number(lon).toFixed(2)}`;
          setCoords({ lat, lon });
          setLocLabel(label);
          setStatus('granted');
          try { localStorage.setItem(LOC_STORAGE_KEY, JSON.stringify({ lat, lon, label })); } catch (_) {}
        },
        (err) => {
          console.warn('Geolocation mount error:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const hasCoords = status === 'granted' && !!coords.lat && !!coords.lon;
  return { lat: coords.lat, lon: coords.lon, status, hasCoords, locLabel, requestLocation };
}

/* ─── HIGHLIGHT ───────────────────────────────────────────────────────────── */
function Highlight({ text = '', query = '' }) {
  if (!query.trim()) return <>{text}</>;
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="dkn-mark">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

/* ─── SEARCH OVERLAY ──────────────────────────────────────────────────────── */
function SearchOverlay({ query, shops, range, onClose, onSubmit }) {
  const inputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

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
        products.push({ ...item, shopId: shop.id, shopName: shop.name, distance: shop.distance });
      });
    });
    products.sort(byDistance);
    return { filteredShops: filtered, productResults: products };
  }, [query, shops, range]);

  const showShops = activeTab === 'all' || activeTab === 'shops';
  const showProducts = activeTab === 'all' || activeTab === 'products';
  const hasResults = filteredShops.length > 0 || productResults.length > 0;

  return (
    <div className="dkn-overlay-root">
      <div className="dkn-overlay-backdrop" onClick={onClose} />
      <div className="dkn-overlay-panel">
        <div className="dkn-overlay-head">
          <div className="dkn-search-row">
            <div className="dkn-search-field">
              <Search size={16} className="dkn-search-ico" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => onSubmit(e.target.value)}
                placeholder="Search shops, products, categories…"
                className="dkn-search-input"
              />
              {query && (
                <button className="dkn-clear-btn" onClick={() => onSubmit('')}>
                  <X size={14} />
                </button>
              )}
            </div>
            <button className="dkn-overlay-close" onClick={onClose}><X size={16} /></button>
          </div>

          <p className="dkn-result-count">
            {query.trim()
              ? (hasResults
                  ? `${filteredShops.length} shop${filteredShops.length !== 1 ? 's' : ''} · ${productResults.length} product${productResults.length !== 1 ? 's' : ''}`
                  : 'No results found')
              : 'Start typing to search…'}
          </p>

          <div className="dkn-tabs">
            {[
              { id: 'all', label: 'All' },
              { id: 'shops', label: `Shops (${filteredShops.length})` },
              { id: 'products', label: `Products (${productResults.length})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`dkn-tab${activeTab === t.id ? ' active' : ''}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="dkn-tab-line" />
        </div>

        <div className="dkn-overlay-results">
          {!hasResults && query.trim() ? (
            <div className="dkn-empty-search">
              <div className="dkn-empty-icon"><Search size={22} /></div>
              <p className="dkn-empty-title">Nothing found for &ldquo;{query}&rdquo;</p>
              <p className="dkn-empty-sub">Try a different keyword or expand your range</p>
            </div>
          ) : (
            <div className="dkn-overlay-sections">
              {showShops && filteredShops.length > 0 && (
                <div>
                  <div className="dkn-section-pill"><Building2 size={11} /> Shops</div>
                  <div className="dkn-overlay-grid">
                    {filteredShops.map((shop) => (
                      <Link key={shop.id} href={`/shop/${shop.id}`} onClick={onClose} className="dkn-mini-card">
                        {PREMIUM_PLANS.includes(shop.plan) && <span className="dkn-pro-badge"><Award size={9} />PRO</span>}
                        <div className="dkn-mini-img">
                          {shop.cover_image || shop.image
                            ? <img src={shop.cover_image || shop.image} alt={shop.name} />
                            : <span>{CATEGORY_MAPPING[shop.category]?.emoji || '🏪'}</span>}
                        </div>
                        <div className="dkn-mini-body">
                          <p className="dkn-mini-name"><Highlight text={shop.name} query={query} /></p>
                          <p className="dkn-mini-cat">{shop.category}</p>
                          <div className="dkn-mini-foot">
                            {shop.distance != null && <span className="dkn-mini-dist">{formatDistance(shop.distance)}</span>}
                            {shop.is_open && <span className="dkn-mini-open">Open</span>}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {showProducts && productResults.length > 0 && (
                <div>
                  <div className="dkn-section-pill"><Package size={11} /> Products</div>
                  <div className="dkn-overlay-grid">
                    {productResults.map((item, i) => (
                      <Link key={`${item.shopId}-${item.id || i}`} href={`/shop/${item.shopId}`} onClick={onClose} className="dkn-mini-card">
                        <div className="dkn-mini-img">
                          {item.image ? <img src={item.image} alt={item.name} /> : <Package size={20} className="dkn-pkg-ico" />}
                        </div>
                        <div className="dkn-mini-body">
                          <p className="dkn-mini-name"><Highlight text={item.name} query={query} /></p>
                          <p className="dkn-mini-cat">{item.shopName}</p>
                          <div className="dkn-mini-foot">
                            {item.price && <span className="dkn-mini-price">₹{item.price}</span>}
                            {item.distance != null && <span className="dkn-mini-dist">{formatDistance(item.distance)}</span>}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ───────────────────────────────────────────────────────────── */
export default function HomeDashboard() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [range, setRange] = useState('All');
  const [activeBanner, setActiveBanner] = useState(0);
  const [shopPage, setShopPage] = useState(1);

  // Adjust state during render if category or range changes to avoid useEffect cascading renders
  const [prevCategory, setPrevCategory] = useState('All');
  const [prevRange, setPrevRange] = useState('All');
  if (selectedCategory !== prevCategory || range !== prevRange) {
    setPrevCategory(selectedCategory);
    setPrevRange(range);
    setShopPage(1);
  }

  const { lat, lon, status, hasCoords, locLabel, requestLocation } = useLocation();
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setSearchOpen(false); setSearch(''); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSearchChange = (value) => { setSearch(value); setSearchOpen(true); };

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

  const banners = useMemo(() => {
    return bannerResponse.length > 0 ? bannerResponse : [
      { id: '_d1', banner_type: 'text', title: 'MyDukan', subtitle: 'Make local shopping easy', small_text: 'Save time · energy · money', background_color: '#0f3d28' },
      { id: '_d2', banner_type: 'text', title: 'Live Store Status', subtitle: 'Know if a shop is open before you leave', small_text: 'New on MyDukan', background_color: '#0a3347' },
      { id: '_d3', banner_type: 'text', title: 'Shop by Category', subtitle: '12+ categories, thousands of local products', small_text: 'Browse Smart', background_color: '#2d1b69' },
    ];
  }, [bannerResponse]);

  const handleBannerClick = useCallback((b) => {
    if (!b.link) return;
    try {
      let targetUrl = b.link;
      if (b.link.includes('instagram.com') || b.link.startsWith('@')) {
        const u = b.link
          .replace(/https?:\/\/instagram\.com\//g, '')
          .replace(/@/g, '')
          .trim();
        targetUrl = `https://instagram.com/${u}`;
      } else if (
        b.link.includes('wa.me') ||
        b.link.includes('whatsapp') ||
        /^\d+$/.test(b.link)
      ) {
        targetUrl = `https://wa.me/${b.link.replace(/\D/g, '')}`;
      }
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setActiveBanner((p) => (p + 1) % banners.length), 6000);
    return () => clearInterval(t);
  }, [banners.length]);

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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap');

        @font-face {
          font-family: 'Milker';
          src: url('https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/fredokaone/FredokaOne-Regular.ttf') format('truetype');
          font-weight: 400;
          font-display: swap;
        }

        :root {
          --g:        #1a5c3a;
          --g2:       #206b45;
          --g3:       #2d9d63;
          --g-soft:   #eaf5ee;
          --g-pale:   #f2faf5;
          --cream:    #fafaf7;
          --parchment:#f5f3ee;
          --ink:      #111810;
          --ink2:     #2e4035;
          --ink3:     #6b7c71;
          --ink4:     #9aada2;
          --gold:     #c9973d;
          --gold-soft:#fdf4e3;
          --r:        16px;
          --r-sm:     10px;
          --r-lg:     24px;
          --shadow:   0 1px 12px rgba(17,24,16,0.07);
          --shadow-md:0 6px 28px rgba(17,24,16,0.12);
          --shadow-lg:0 16px 56px rgba(17,24,16,0.16);
          --flogo:    'Milker', 'Fredoka One', 'Nunito', system-ui, sans-serif;
          --fhead:    'Plus Jakarta Sans', system-ui, sans-serif;
          --fbody:    'Plus Jakarta Sans', system-ui, sans-serif;
          --border:   rgba(26,92,58,0.11);
          /* Mobile header height tracking */
          --mob-header-h: 100px;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .dkn-root {
          font-family: var(--fbody);
          background: var(--cream);
          color: var(--ink);
          min-height: 100vh;
          padding-top:10px;
          padding-bottom: 96px;
          padding-bottom: calc(96px + env(safe-area-inset-bottom));
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* ── HEADER ── */
        .dkn-header {
          position: sticky; top: 0; z-index: 80;
          background: rgba(250,250,247,0.96);
          backdrop-filter: blur(24px) saturate(200%);
          border-bottom: 1px solid var(--border);
          margin-bottom: 0;
          padding-bottom: 0;
        }
        .dkn-header-inner {
          max-width: 1360px; margin: 0 auto;
          height: 64px; padding: 0 24px;
          display: flex; align-items: center; gap: 12px;
        }

        /* Logo */
        .dkn-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; flex-shrink: 0; }
        .dkn-logo-mark {
          width: 36px; height: 36px; border-radius: 10px;
          background: var(--g);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 3px 10px rgba(26,92,58,0.28);
          margin-right:-12px;
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        .dkn-logo:hover .dkn-logo-mark { transform: scale(1.08) rotate(-4deg); }
        .dkn-logo-text {
          font-family: var(--flogo);
          font-weight: 900;
          font-size: 25px;
          color: var(--ink);
          letter-spacing: 0.02em;
          -webkit-text-stroke: 0.4px currentColor;
        }
        .dkn-logo-text span { color: var(--g); }

        /* Location pill */
        .dkn-loc-pill {
          display: flex; align-items: center; gap: 7px;
          background: var(--g-soft); border: 1px solid var(--border);
          border-radius: 50px; padding: 7px 13px; cursor: pointer;
          font-family: var(--fbody); font-size: 12px; font-weight: 500; color: var(--ink2);
          transition: all 0.18s; max-width: 180px; min-width: 0;
          letter-spacing: 0.01em; flex-shrink: 0;
        }
        .dkn-loc-pill:hover { background: rgba(26,92,58,0.1); border-color: var(--g3); }
        .dkn-loc-pill span { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .dkn-live-dot {
          width: 6px; height: 6px; border-radius: 50%; background: var(--g3);
          flex-shrink: 0; animation: dknPulse 2.4s ease-in-out infinite;
        }
        @keyframes dknPulse { 0%,100%{ opacity:1; transform:scale(1); } 50%{ opacity:.4; transform:scale(1.5); } }

        /* Search + Download group */
        .dkn-search-group {
          flex: 1; display: flex; align-items: center; gap: 8px; min-width: 0;
        }
        .dkn-search-trigger {
          flex: 1; min-width: 0;
          display: flex; align-items: center; gap: 10px;
          padding: 0 16px; height: 40px;
          background: white; border: 1.5px solid var(--border);
          border-radius: 50px; cursor: pointer;
          font-family: var(--fbody); font-size: 13px; color: var(--ink3); font-weight: 400;
          transition: all 0.18s; box-shadow: var(--shadow);
          letter-spacing: 0.01em;
        }
        .dkn-search-trigger:hover { border-color: var(--g3); box-shadow: 0 4px 18px rgba(26,92,58,0.1); }
        .dkn-kbd {
          margin-left: auto; font-size: 10px; font-weight: 600; color: var(--ink4);
          background: var(--parchment); border-radius: 6px; padding: 2px 7px;
          font-family: var(--fbody); border: 1px solid rgba(0,0,0,0.07); flex-shrink: 0;
        }

        /* Download button */
        .dkn-dl-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 8px 18px; border-radius: 50px; flex-shrink: 0;
          background: var(--g); color: white;
          font-family: var(--fbody); font-size: 12px; font-weight: 600;
          text-decoration: none; box-shadow: 0 3px 12px rgba(26,92,58,0.3);
          transition: all 0.18s; letter-spacing: 0.02em; white-space: nowrap;
        }
        .dkn-dl-btn:hover { background: #154e30; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(26,92,58,0.38); }

        /* Nav links */
        .dkn-header-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
        .dkn-nav-link {
          font-family: var(--fbody); font-size: 12px; font-weight: 500; color: var(--ink3);
          text-decoration: none; padding: 7px 10px; border-radius: 50px;
          transition: all 0.15s; letter-spacing: 0.01em; white-space: nowrap;
        }
        .dkn-nav-link:hover { background: var(--g-soft); color: var(--ink); }
        .dkn-signup-btn {
          padding: 8px 16px; background: transparent; color: var(--g);
          font-family: var(--fbody); font-size: 12px; font-weight: 700;
          border-radius: 50px; text-decoration: none; border: 1.5px solid var(--g);
          transition: all 0.18s; letter-spacing: 0.02em; white-space: nowrap;
        }
        .dkn-signup-btn:hover { background: var(--g); color: white; }

        /* ── MOBILE HEADER ── */
        .dkn-mobile-top {
          display: none;
          padding: 10px 14px 0;
          align-items: center; gap: 8px;
          background: rgba(250,250,247,0.96);
        }
        .dkn-mobile-search-row {
          display: none;
          padding: 8px 14px 10px;
          background: rgba(250,250,247,0.96);
        }
        .dkn-mob-search {
          width: 100%; display: flex; align-items: center; gap: 8px;
          background: white; border: 1.5px solid var(--border);
          border-radius: 50px; padding: 0 14px; height: 40px; cursor: pointer;
          font-family: var(--fbody); font-size: 13px; color: var(--ink3); box-shadow: var(--shadow);
          transition: border-color 0.15s;
        }
        .dkn-mob-search:hover { border-color: var(--g3); }
        .dkn-mob-loc {
          display: flex; align-items: center; gap: 6px;
          background: var(--g-soft); border: 1px solid var(--border);
          border-radius: 50px; padding: 8px 12px; cursor: pointer;
          font-family: var(--fbody); font-size: 12px; font-weight: 500; color: var(--ink2);
          flex-shrink: 0; flex: 1; min-width: 0; transition: all 0.15s;
        }
        .dkn-mob-loc span { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .dkn-mob-dl-btn {
          flex-shrink: 0;
          display: flex; align-items: center; gap: 5px;
          padding: 8px 14px; border-radius: 50px;
          background: var(--g); color: white;
          font-family: var(--fbody); font-size: 12px; font-weight: 600;
          text-decoration: none; box-shadow: 0 2px 8px rgba(26,92,58,0.22);
          white-space: nowrap;
        }

        @media (max-width: 767px) {
          .dkn-loc-pill,
          .dkn-search-group,
          .dkn-header-actions { display: none !important; }
          .dkn-mobile-top { display: flex !important; }
          .dkn-mobile-search-row { display: block !important; }
          /* Reset header-inner to auto height on mobile */
          .dkn-header-inner {
            height: auto;
            padding: 0;
            flex-direction: column;
            align-items: stretch;
            gap: 0;
          }
          /* Hide desktop logo — shown in mobile-top */
          .dkn-header-inner > .dkn-logo { display: none; }
        }

        /* Denied banner */
        .dkn-denied {
          background: #fffbeb; border-bottom: 1px solid #fde68a;
          padding: 10px 24px; display: flex; align-items: center; gap: 10px;
        }
        .dkn-denied p { font-family: var(--fbody); font-size: 12px; font-weight: 500; color: #78350f; flex: 1; }
        .dkn-denied button { font-family: var(--fbody); font-size: 12px; font-weight: 700; color: #92400e; background: none; border: none; cursor: pointer; text-decoration: underline; }

        /* Content */
        .dkn-content { max-width: 1360px; margin: 0 auto; }

        /* ── HERO DESKTOP ── */
        .dkn-hero-desktop {
          display: none;
          margin: 20px 24px 0;
          border-radius: 32px;
          overflow: hidden;
          background: var(--g);
          position: relative;
        }
        .dkn-hero-desktop::before {
          content: '';
          position: absolute; inset: 0; z-index: 1;
          background-image:
            radial-gradient(ellipse at 80% -10%, rgba(45,157,99,0.55) 0%, transparent 50%),
            radial-gradient(ellipse at 10% 110%, rgba(10,40,25,0.6) 0%, transparent 45%);
          pointer-events: none;
        }
        .dkn-hero-content {
          position: relative; z-index: 2;
          display: grid;
          grid-template-columns: 1fr 520px;
          grid-template-rows: 1fr auto;
        }
        .dkn-hero-left {
          padding: 52px 40px 48px 52px;
          display: flex; flex-direction: column; justify-content: center;
          grid-row: 1;
        }
        .dkn-hero-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--fbody); font-size: 11px; font-weight: 600;
          color: rgba(255,255,255,0.55); text-transform: uppercase; letter-spacing: 0.14em;
          margin-bottom: 18px;
        }
        .dkn-hero-eyebrow-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #6ee7a8;
          animation: dknPulse 2.4s ease-in-out infinite; flex-shrink: 0;
        }
        .dkn-hero-h1 {
          font-family: var(--fhead);
          font-weight: 800;
          font-size: clamp(36px, 3.6vw, 56px);
          line-height: 1.06;
          color: white;
          letter-spacing: -0.035em;
          margin-bottom: 16px;
        }
        .dkn-hero-h1 em { font-style: italic; color: #7ef5b8; font-weight: 600; }
        .dkn-hero-p {
          font-family: var(--fbody);
          font-size: 15px;
          color: rgba(255,255,255,0.58);
          line-height: 1.7;
          max-width: 380px;
          margin-bottom: 32px;
        }
        .dkn-hero-cta {
          display: inline-flex; align-items: center; gap: 10px;
          background: white; color: var(--g);
          border-radius: 50px; padding: 14px 26px; width: fit-content;
          font-family: var(--fbody); font-size: 14px; font-weight: 700;
          text-decoration: none; box-shadow: 0 8px 28px rgba(0,0,0,0.22);
          transition: all 0.22s; letter-spacing: 0.01em; margin-bottom: 28px;
        }
        .dkn-hero-cta:hover { transform: translateY(-3px); box-shadow: 0 14px 40px rgba(0,0,0,0.3); }
        .dkn-hero-feats { display: flex; flex-direction: column; gap: 9px; }
        .dkn-hero-feat {
          display: flex; align-items: center; gap: 10px;
          font-family: var(--fbody); font-size: 13px; font-weight: 400;
          color: rgba(255,255,255,0.6);
        }
        .dkn-hero-feat::before {
          content: ''; width: 5px; height: 5px; border-radius: 50%;
          background: #6ee7a8; flex-shrink: 0;
        }
        .dkn-hero-right {
          position: relative; grid-row: 1;
          display: flex; align-items: flex-end; justify-content: center;
          min-height: 420px; overflow: visible;
        }
        .dkn-hero-img-wrap {
          position: absolute; bottom: 0; left: 0; right: 50px; top: -20px;
        }
        .dkn-hero-img-wrap img { width: 100%; height: 100%; object-fit: contain; object-position: bottom center; }
        .dkn-hero-floater {
          position: absolute; z-index: 10;
          background: white; border-radius: 14px; padding: 9px 14px;
          font-family: var(--fbody); font-size: 12px; font-weight: 600; color: var(--ink);
          box-shadow: 0 8px 32px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08);
          display: flex; align-items: center; gap: 8px; white-space: nowrap;
          animation: dknFloat 4s ease-in-out infinite;
        }
        .dkn-hero-floater.f1 { top: 36px; left: -20px; animation-delay: 0s; }
        .dkn-hero-floater.f2 { top: 90px; right: -10px; background: #0c3522; color: rgba(255,255,255,0.88); animation-delay: 1.4s; }
        .dkn-hero-floater.f3 { bottom: 80px; right: -10px; animation-delay: 0.7s; }
        @keyframes dknFloat { 0%,100%{ transform:translateY(0px); } 50%{ transform:translateY(-6px); } }
        .dkn-floater-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; animation: dknPulse 2.4s ease-in-out infinite; flex-shrink: 0; }
        .dkn-floater-icon { width: 28px; height: 28px; border-radius: 8px; background: var(--g-soft); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .dkn-hero-stat-row {
          grid-column: 1 / -1; border-top: 1px solid rgba(255,255,255,0.09);
          display: grid; grid-template-columns: repeat(3,1fr);
        }
        .dkn-hero-stat {
          padding: 18px 52px; border-right: 1px solid rgba(255,255,255,0.09);
          display: flex; flex-direction: column; gap: 3px;
        }
        .dkn-hero-stat:last-child { border-right: none; }
        .dkn-hero-stat-val { font-family: var(--fhead); font-size: 22px; font-weight: 800; color: white; letter-spacing: -0.03em; }
        .dkn-hero-stat-lbl { font-family: var(--fbody); font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.1em; }

        @media (min-width: 768px) { .dkn-hero-desktop { display: block; } }
        @media (min-width: 768px) and (max-width: 1100px) {
          .dkn-hero-content { grid-template-columns: 1fr 380px; }
          .dkn-hero-left { padding: 40px 32px 40px 36px; }
          .dkn-hero-right { min-height: 360px; }
        }

        /* ── HERO MOBILE ── */
        .dkn-hero-mobile {
          margin: 12px 14px 0; border-radius: 22px;
          background: var(--g); padding: 26px 22px 0;
          overflow: hidden; position: relative;
        }
        .dkn-hero-mobile::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse at 80% 0%, rgba(45,157,99,0.4) 0%, transparent 55%);
          pointer-events: none;
        }
        .dkn-mob-eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: var(--fbody); font-size: 10px; font-weight: 600;
          color: rgba(255,255,255,0.55); text-transform: uppercase; letter-spacing: 0.12em;
          margin-bottom: 12px; position: relative;
        }
        .dkn-mob-h1 { font-family: var(--fhead); font-weight: 800; font-size: 30px; line-height: 1.08; color: white; letter-spacing: -0.03em; margin-bottom: 8px; position: relative; }
        .dkn-mob-h1 em { font-style: italic; color: #8ef5c0; font-weight: 600; }
        .dkn-mob-p { font-family: var(--fbody); font-size: 13px; color: rgba(255,255,255,0.58); line-height: 1.65; margin-bottom: 20px; position: relative; }
        .dkn-mob-cta {
          display: inline-flex; align-items: center; gap: 8px;
          background: white; color: var(--g); border-radius: 50px;
          padding: 11px 20px; font-family: var(--fbody); font-size: 13px; font-weight: 700;
          text-decoration: none; box-shadow: 0 5px 18px rgba(0,0,0,0.18);
          margin-bottom: 24px; transition: transform 0.15s; position: relative; letter-spacing: 0.01em;
        }
        .dkn-mob-cta:hover { transform: translateY(-1px); }
        .dkn-mob-stats { display: flex; border-top: 1px solid rgba(255,255,255,0.08); margin: 0 -22px; }
        .dkn-mob-stat { flex: 1; padding: 12px 0; text-align: center; border-right: 1px solid rgba(255,255,255,0.08); }
        .dkn-mob-stat:last-child { border-right: none; }
        .dkn-mob-stat-val { font-family: var(--fhead); font-size: 16px; font-weight: 700; color: white; letter-spacing: -0.02em; }
        .dkn-mob-stat-lbl { font-family: var(--fbody); font-size: 9px; font-weight: 500; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px; }
        @media (min-width: 768px) { .dkn-hero-mobile { display: none; } }

        /* ── TOOLBAR ─────────────────────────────────────────────────────────
           KEY FIX: On mobile the header is auto-height (two rows).
           We use top: 0 on a wrapper that sticks below the header via
           the natural document flow — no hardcoded pixel offset needed.
           The header is sticky top:0, the toolbar is sticky top:0 inside
           a flex column, so it naturally stacks flush below the header.
        ────────────────────────────────────────────────────────────────────── */
        .dkn-toolbar {
          position: sticky;
          top: 64px; /* desktop header height */
          z-index: 70;
          background: rgba(250,250,247,0.96);
          backdrop-filter: blur(20px) saturate(180%);
          border-bottom: 1px solid var(--border);
          margin-top: 0;
        }

        /* On mobile: header has no fixed height, so we use a CSS trick —
           set top to the actual rendered header height via a JS-set custom
           property, with a sensible fallback of 100px */
        @media (max-width: 767px) {
          .dkn-toolbar {
            /* Fallback: mobile top row ~52px + search row ~58px = ~110px */
            top: var(--mob-header-h, 110px);
          }
        }

        /* ── RANGE BAR ── */
        .dkn-range-bar {
          padding: 10px 24px; display: flex; align-items: center; gap: 8px;
          overflow-x: auto; border-bottom: 1px solid rgba(26,92,58,0.06);
          scrollbar-width: none;
        }
        .dkn-range-bar::-webkit-scrollbar { display: none; }
        .dkn-range-label {
          font-family: var(--fbody); font-size: 10px; font-weight: 600;
          color: var(--ink4); text-transform: uppercase; letter-spacing: 0.12em; flex-shrink: 0;
        }
        .dkn-range-chip {
          flex-shrink: 0; padding: 5px 13px; border-radius: 50px;
          font-family: var(--fbody); font-size: 12px; font-weight: 600;
          border: 1.5px solid var(--border); background: white; color: var(--ink3);
          cursor: pointer; transition: all 0.15s; letter-spacing: 0.01em;
        }
        .dkn-range-chip:hover { border-color: var(--g3); color: var(--g); }
        .dkn-range-chip.active { background: var(--g); color: white; border-color: var(--g); box-shadow: 0 2px 10px rgba(26,92,58,0.25); }

        @media (max-width: 767px) {
          .dkn-range-bar { padding: 8px 14px; gap: 6px; }
          .dkn-range-label { font-size: 9px; }
          .dkn-range-chip { padding: 5px 11px; font-size: 11px; }
        }

        /* ── CATEGORIES ── */
        .dkn-cats {
          padding: 9px 24px; display: flex; gap: 6px; overflow-x: auto;
          scrollbar-width: none;
        }
        .dkn-cats::-webkit-scrollbar { display: none; }
        .dkn-cat {
          flex-shrink: 0; display: flex; align-items: center; gap: 6px;
          padding: 6px 13px; border-radius: 50px;
          font-family: var(--fbody); font-size: 12px; font-weight: 500;
          border: 1.5px solid var(--border); background: white; color: var(--ink2);
          cursor: pointer; transition: all 0.15s; white-space: nowrap; letter-spacing: 0.01em;
        }
        .dkn-cat:hover { border-color: var(--g3); color: var(--g); background: var(--g-soft); }
        .dkn-cat.active { color: white; border-color: transparent; box-shadow: 0 2px 10px rgba(26,92,58,0.22); }
        .dkn-cat-emoji { font-size: 13px; line-height: 1; }

        @media (max-width: 767px) {
          .dkn-cats { padding: 8px 14px; gap: 5px; }
          .dkn-cat { padding: 5px 11px; font-size: 11px; }
          .dkn-cat-emoji { font-size: 12px; }
        }

        /* ── PAGE BODY ── */
        .dkn-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 32px; }
        @media (max-width: 767px) { .dkn-body { padding: 16px 14px; gap: 26px; } }

        /* ── BANNER ── */
        .dkn-banner-wrap { border-radius: 20px; overflow: hidden; position: relative; box-shadow: var(--shadow-md); }
        .dkn-banner-slide {
          padding: 24px 28px 28px; color: white; position: relative; overflow: hidden; display: none;
        }
        .dkn-banner-slide.active { display: block; animation: dknSlideIn 0.45s cubic-bezier(0.16,1,0.3,1); }
        @keyframes dknSlideIn { from{ opacity:0; transform:translateX(12px); } to{ opacity:1; transform:translateX(0); } }
        .dkn-banner-slide::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 85% 15%, rgba(255,255,255,0.07) 0%, transparent 50%); pointer-events: none; }
        .dkn-banner-eyebrow { font-family: var(--fbody); font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.14em; opacity: 0.5; margin-bottom: 7px; position: relative; }
        .dkn-banner-title { font-family: var(--fhead); font-size: 28px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 5px; position: relative; }
        .dkn-banner-sub { font-family: var(--fbody); font-size: 13px; opacity: 0.62; position: relative; line-height: 1.5; }
        .dkn-banner-img-slide { display: none; position: relative; }
        .dkn-banner-img-slide.active { display: block; }
        .dkn-banner-img-slide img { width: 100%; height: 180px; object-fit: cover; display: block; }
        .dkn-bdots { position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%); display: flex; gap: 5px; z-index: 10; }
        .dkn-bdot { width: 5px; height: 5px; border-radius: 50%; background: rgba(255,255,255,0.3); cursor: pointer; transition: all 0.28s ease; border: none; }
        .dkn-bdot.active { width: 18px; border-radius: 50px; background: white; }

        /* ── SECTION HEADER ── */
        .dkn-section-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
        .dkn-section-left { display: flex; align-items: flex-start; gap: 12px; }
        .dkn-section-icon-wrap { width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
        .dkn-section-title { font-family: var(--fhead); font-size: 17px; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; }
        .dkn-section-sub { font-family: var(--fbody); font-size: 11px; color: var(--ink3); margin-top: 2px; line-height: 1.4; }
        .dkn-see-all { font-family: var(--fbody); font-size: 12px; font-weight: 600; color: var(--g); background: transparent; border: 1.5px solid var(--border); border-radius: 50px; padding: 5px 13px; cursor: pointer; white-space: nowrap; flex-shrink: 0; transition: all 0.15s; letter-spacing: 0.01em; display: flex; align-items: center; gap: 5px; }
        .dkn-see-all:hover { background: var(--g-soft); border-color: var(--g3); }

        /* ── HORIZONTAL SHOP CARDS ── */
        .dkn-hscroll { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
        .dkn-hscroll::-webkit-scrollbar { display: none; }
        .dkn-shop-card { flex-shrink: 0; width: 164px; border-radius: 18px; background: white; border: 1px solid var(--border); overflow: hidden; cursor: pointer; transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1); box-shadow: var(--shadow); text-decoration: none; display: block; }
        .dkn-shop-card:hover { transform: translateY(-4px) scale(1.01); box-shadow: var(--shadow-md); }
        .dkn-card-img { width: 100%; height: 96px; background: var(--g-soft); display: flex; align-items: center; justify-content: center; font-size: 32px; position: relative; overflow: hidden; }
        .dkn-card-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.35s ease; }
        .dkn-shop-card:hover .dkn-card-img img { transform: scale(1.07); }
        .dkn-open-pill { position: absolute; bottom: 7px; left: 7px; background: white; border-radius: 50px; padding: 3px 8px; font-family: var(--fbody); font-size: 9px; font-weight: 700; color: #166534; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
        .dkn-open-dot { width: 5px; height: 5px; border-radius: 50%; background: #22c55e; animation: dknPulse 2.4s ease-in-out infinite; }
        .dkn-pro-badge { position: absolute; top: 7px; right: 7px; z-index: 2; background: var(--gold); color: white; border-radius: 6px; padding: 3px 7px; font-family: var(--fbody); font-size: 8px; font-weight: 700; letter-spacing: 0.06em; display: flex; align-items: center; gap: 3px; }
        .dkn-card-body { padding: 11px 12px 13px; }
        .dkn-card-name { font-family: var(--fhead); font-size: 13px; font-weight: 700; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.01em; }
        .dkn-card-cat { font-family: var(--fbody); font-size: 11px; color: var(--ink3); margin-top: 2px; }
        .dkn-card-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 9px; }
        .dkn-dist-pill { font-family: var(--fbody); font-size: 11px; font-weight: 700; color: var(--g); background: var(--g-soft); padding: 3px 8px; border-radius: 50px; }

        /* ── SHOP GRID ── */
        .dkn-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; }
        @media (min-width: 560px) { .dkn-grid { grid-template-columns: repeat(3,1fr); } }
        @media (min-width: 1024px) { .dkn-grid { grid-template-columns: repeat(4,1fr); gap: 12px; } }
        .dkn-grid-card { border-radius: 16px; background: white; overflow: hidden; border: 1px solid var(--border); box-shadow: var(--shadow); transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1); text-decoration: none; display: block; position: relative; }
        .dkn-grid-card:hover { transform: translateY(-3px) scale(1.01); box-shadow: var(--shadow-md); }
        .dkn-gc-img { width: 100%; height: 80px; background: var(--g-soft); display: flex; align-items: center; justify-content: center; font-size: 28px; position: relative; overflow: hidden; }
        .dkn-gc-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.35s ease; }
        .dkn-grid-card:hover .dkn-gc-img img { transform: scale(1.07); }
        .dkn-gc-body { padding: 10px 11px 12px; }
        .dkn-gc-name { font-family: var(--fhead); font-size: 12px; font-weight: 700; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; letter-spacing: -0.01em; }
        .dkn-gc-cat { font-family: var(--fbody); font-size: 10px; color: var(--ink3); margin-top: 2px; }
        .dkn-gc-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
        .dkn-gc-dist { font-family: var(--fbody); font-size: 10px; font-weight: 700; color: var(--g); }
        .dkn-gc-open { font-family: var(--fbody); font-size: 9px; font-weight: 700; color: #166534; background: #dcfce7; padding: 3px 7px; border-radius: 50px; text-transform: uppercase; letter-spacing: 0.05em; }
        .dkn-gc-closed { font-family: var(--fbody); font-size: 9px; font-weight: 700; color: #92400e; background: #fef3c7; padding: 3px 7px; border-radius: 50px; text-transform: uppercase; letter-spacing: 0.05em; }

        /* ── LOCATION CTA ── */
        .dkn-loc-cta { background: white; border-radius: 20px; padding: 40px 28px; text-align: center; border: 1px solid var(--border); box-shadow: var(--shadow); }
        .dkn-loc-cta-icon { width: 56px; height: 56px; border-radius: 16px; background: var(--g-soft); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
        .dkn-loc-cta h3 { font-family: var(--fhead); font-size: 20px; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; margin-bottom: 8px; }
        .dkn-loc-cta p { font-family: var(--fbody); font-size: 13px; color: var(--ink3); line-height: 1.65; max-width: 250px; margin: 0 auto 22px; }
        .dkn-loc-cta-btn { display: inline-flex; align-items: center; gap: 9px; background: var(--g); color: white; border: none; border-radius: 50px; padding: 12px 26px; font-family: var(--fbody); font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 18px rgba(26,92,58,0.28); transition: all 0.2s; letter-spacing: 0.01em; }
        .dkn-loc-cta-btn:hover { background: #154e30; transform: translateY(-1px); box-shadow: 0 8px 26px rgba(26,92,58,0.34); }
        .dkn-loc-denied-msg { font-family: var(--fbody); font-size: 12px; color: #92400e; font-weight: 500; margin-top: 12px; }

        /* ── STATES ── */
        .dkn-skeletons { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; }
        @media (min-width: 560px) { .dkn-skeletons { grid-template-columns: repeat(3,1fr); } }
        @media (min-width: 1024px) { .dkn-skeletons { grid-template-columns: repeat(4,1fr); } }
        .dkn-requesting { background: white; border-radius: 18px; padding: 48px 20px; text-align: center; border: 1px solid var(--border); box-shadow: var(--shadow); }
        .dkn-requesting p { font-family: var(--fbody); font-size: 13px; color: var(--ink3); margin-top: 12px; }
        .dkn-error { background: #fef2f2; border: 1px solid #fecaca; border-radius: 16px; padding: 32px 20px; text-align: center; }
        .dkn-error p { font-family: var(--fbody); font-size: 13px; font-weight: 700; color: #b91c1c; margin-top: 8px; }
        .dkn-error span { font-family: var(--fbody); font-size: 12px; color: #f87171; display: block; margin-top: 4px; }
        .dkn-empty { background: white; border: 1.5px dashed rgba(26,92,58,0.16); border-radius: 18px; padding: 40px 20px; text-align: center; }
        .dkn-empty-icon { width: 46px; height: 46px; background: var(--g-soft); border-radius: 13px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
        .dkn-empty p { font-family: var(--fhead); font-size: 14px; font-weight: 700; color: var(--ink); letter-spacing: -0.01em; }
        .dkn-empty span { font-family: var(--fbody); font-size: 12px; color: var(--ink3); margin-top: 4px; display: block; }

        /* ── LOAD MORE ── */
        .dkn-loadmore { text-align: center; padding-top: 8px; }
        .dkn-loadmore button { background: white; border: 1.5px solid var(--border); border-radius: 50px; padding: 11px 30px; font-family: var(--fbody); font-size: 13px; font-weight: 600; color: var(--ink2); cursor: pointer; box-shadow: var(--shadow); transition: all 0.18s; letter-spacing: 0.01em; }
        .dkn-loadmore button:hover { border-color: var(--g3); color: var(--g); box-shadow: var(--shadow-md); transform: translateY(-1px); }

        /* ── SEARCH OVERLAY ── */
        .dkn-overlay-root { position: fixed; inset: 0; z-index: 200; display: flex; flex-direction: column; }
        .dkn-overlay-backdrop { position: absolute; inset: 0; background: rgba(10,15,10,0.5); backdrop-filter: blur(8px); }
        .dkn-overlay-panel { position: relative; z-index: 1; width: 100%; max-width: 600px; margin: 0 auto; background: white; border-radius: 0 0 24px 24px; display: flex; flex-direction: column; max-height: 90vh; overflow: hidden; box-shadow: var(--shadow-lg); animation: dknSearchIn 0.22s cubic-bezier(0.16,1,0.3,1); }
        @keyframes dknSearchIn { from{ opacity:0; transform:translateY(-16px); } to{ opacity:1; transform:translateY(0); } }
        .dkn-overlay-head { padding: 16px 16px 0; background: white; }
        .dkn-search-row { display: flex; align-items: center; gap: 10px; }
        .dkn-search-field { flex: 1; display: flex; align-items: center; gap: 10px; border: 2px solid var(--border); border-radius: 12px; padding: 10px 13px; background: var(--g-pale); transition: all 0.15s; }
        .dkn-search-field:focus-within { border-color: var(--g3); background: white; box-shadow: 0 0 0 3px rgba(26,92,58,0.07); }
        .dkn-search-ico { color: var(--g); flex-shrink: 0; }
        .dkn-search-input { flex: 1; background: transparent; border: none; outline: none; font-family: var(--fbody); font-size: 14px; font-weight: 400; color: var(--ink); }
        .dkn-search-input::placeholder { color: var(--ink4); }
        .dkn-clear-btn { background: none; border: none; cursor: pointer; color: var(--ink3); display: flex; padding: 0; transition: color 0.15s; }
        .dkn-clear-btn:hover { color: var(--ink); }
        .dkn-overlay-close { width: 42px; height: 42px; border-radius: 12px; border: 1.5px solid var(--border); background: var(--g-soft); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--g); flex-shrink: 0; transition: all 0.15s; }
        .dkn-overlay-close:hover { background: rgba(26,92,58,0.12); }
        .dkn-result-count { font-family: var(--fbody); font-size: 11px; color: var(--ink3); margin: 10px 2px 0; font-weight: 500; }
        .dkn-tabs { display: flex; gap: 2px; margin-top: 12px; }
        .dkn-tab { padding: 8px 13px; font-family: var(--fbody); font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; border: none; background: none; color: var(--ink3); cursor: pointer; border-radius: 8px 8px 0 0; transition: all 0.15s; border-bottom: 2px solid transparent; }
        .dkn-tab:hover { color: var(--ink2); background: var(--g-soft); }
        .dkn-tab.active { color: var(--g); border-bottom-color: var(--g); background: var(--g-soft); }
        .dkn-tab-line { height: 1px; background: var(--border); }
        .dkn-overlay-results { flex: 1; overflow-y: auto; padding: 0 16px 24px; }
        .dkn-overlay-sections { padding-top: 16px; display: flex; flex-direction: column; gap: 20px; }
        .dkn-section-pill { display: inline-flex; align-items: center; gap: 5px; font-family: var(--fbody); font-size: 10px; font-weight: 700; color: var(--ink3); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; }
        .dkn-overlay-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
        .dkn-empty-search { display: flex; flex-direction: column; align-items: center; padding: 48px 0; text-align: center; }
        .dkn-empty-icon { width: 48px; height: 48px; border-radius: 14px; background: var(--g-soft); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; margin-bottom: 12px; color: var(--g); }
        .dkn-empty-title { font-family: var(--fhead); font-size: 15px; font-weight: 700; color: var(--ink); letter-spacing: -0.01em; }
        .dkn-empty-sub { font-family: var(--fbody); font-size: 12px; color: var(--ink3); margin-top: 5px; }
        .dkn-mini-card { border: 1px solid var(--border); border-radius: 14px; overflow: hidden; background: white; text-decoration: none; display: block; transition: all 0.18s; position: relative; }
        .dkn-mini-card:hover { border-color: var(--g3); transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .dkn-mini-img { width: 100%; height: 60px; background: var(--g-soft); display: flex; align-items: center; justify-content: center; font-size: 22px; overflow: hidden; position: relative; }
        .dkn-mini-img img { width: 100%; height: 100%; object-fit: cover; }
        .dkn-pkg-ico { color: rgba(26,92,58,0.22); }
        .dkn-mini-body { padding: 7px 8px 9px; }
        .dkn-mini-name { font-family: var(--fhead); font-size: 11px; font-weight: 700; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.01em; }
        .dkn-mini-cat { font-family: var(--fbody); font-size: 9px; color: var(--ink3); margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .dkn-mini-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 5px; }
        .dkn-mini-dist { font-family: var(--fbody); font-size: 9px; font-weight: 700; color: var(--g); }
        .dkn-mini-open { font-family: var(--fbody); font-size: 8px; font-weight: 700; color: #166534; background: #dcfce7; padding: 2px 5px; border-radius: 50px; }
        .dkn-mini-price { font-family: var(--fbody); font-size: 11px; font-weight: 700; color: var(--g); }

        /* Misc */
        .dkn-mark { background: #bbf7d0; color: #14532d; border-radius: 3px; padding: 0 2px; font-style: normal; }
        .dkn-spin { animation: dknSpin 0.9s linear infinite; }
        @keyframes dknSpin { to{ transform:rotate(360deg); } }
      `}</style>

      <div className="dkn-root">
        {/* JS: measure real header height and set --mob-header-h on mount */}
        <MobileHeaderHeightSync />

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
        <header className="dkn-header" id="dkn-header">
          {/* ── DESKTOP HEADER ROW ── */}
          <div className="dkn-header-inner">
            <Link href="/" className="dkn-logo">
              <div className="dkn-logo-mark" style={{ width: 36, height: 36, minWidth: 36, minHeight: 36, background: 'var(--g-pale)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(10,92,67,0.10)' }}>
                <Image src="/logo_green.png" alt="MyDukan" width={28} height={28} style={{ width: 28, height: 28 }} />
              </div>
              <span className="dkn-logo-text" style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', marginLeft: 8 }}>My<span style={{ color: 'var(--g)' }}>Dukan</span></span>
            </Link>

            <button className="dkn-loc-pill" onClick={requestLocation}>
              {status === 'requesting'
                ? <Loader2 size={12} className="dkn-spin" style={{ color: 'var(--g)' }} />
                : <span className="dkn-live-dot" />}
              <span>{locLabel}</span>
              <ChevronDown size={11} style={{ color: 'var(--ink4)', flexShrink: 0 }} />
            </button>

            {/* Search + Download grouped together */}
            <div className="dkn-search-group">
              <button className="dkn-search-trigger" onClick={() => setSearchOpen(true)}>
                <Search size={14} style={{ color: 'var(--ink3)' }} />
                Search shops, products…
                <span className="dkn-kbd">⌘K</span>
              </button>
              <a
                href="https://play.google.com/store/apps/details?id=com.mydukan.dukanapp"
                target="_blank" rel="noopener noreferrer"
                className="dkn-dl-btn"
              >
                <Download size={13} /> Download App
              </a>
            </div>

            {/* Auth links */}
            <div className="dkn-header-actions">
              <Link href="/customer/login" className="dkn-nav-link">Customer</Link>
              <Link href="/merchant/login" className="dkn-nav-link">Merchant</Link>
              <Link href="/customer/signup" className="dkn-signup-btn">Sign Up</Link>
            </div>
          </div>

          {/* ── MOBILE ROW 1: Logo + Location + Download ── */}
          <div className="dkn-mobile-top">
            <Link href="/" className="dkn-logo" style={{ flexShrink: 0 }}>
              <div style={{ width: 32, height: 32, minWidth: 32, minHeight: 32, background: 'var(--g-pale)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Image src="/logo_green.png" alt="MyDukan" width={24} height={24} style={{ width: 24, height: 24 }} />
              </div>
              <span className="dkn-logo-text" style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.02em', marginLeft: 6 }}>My<span style={{ color: 'var(--g)' }}>Dukan</span></span>
            </Link>

            <button className="dkn-mob-loc" onClick={requestLocation}>
              {status === 'requesting'
                ? <Loader2 size={11} className="dkn-spin" style={{ color: 'var(--g)' }} />
                : <span className="dkn-live-dot" />}
              <span>{hasCoords ? locLabel : 'Set location'}</span>
              <ChevronDown size={10} style={{ color: 'var(--ink4)', flexShrink: 0, marginLeft: 'auto' }} />
            </button>

            <a
              href="https://play.google.com/store/apps/details?id=com.mydukan.dukanapp"
              target="_blank" rel="noopener noreferrer"
              className="dkn-mob-dl-btn"
            >
              <Download size={13} /> App
            </a>
          </div>

          {/* ── MOBILE ROW 2: Search ── */}
          <div className="dkn-mobile-search-row">
            <button className="dkn-mob-search" onClick={() => setSearchOpen(true)}>
              <Search size={14} style={{ color: 'var(--ink3)' }} />
              <span style={{ color: 'var(--ink3)', fontSize: 13 }}>Search shops, products…</span>
            </button>
          </div>
        </header>

        {status === 'denied' && (
          <div className="dkn-denied">
            <AlertCircle size={14} style={{ color: '#d97706', flexShrink: 0 }} />
            <p>Location blocked — enable it in your browser settings.</p>
            <button onClick={requestLocation}>Retry</button>
          </div>
        )}

        <div className="dkn-content">

          {/* ── HERO DESKTOP ── */}
          <div className="dkn-hero-desktop">
            <div className="dkn-hero-content">
              <div className="dkn-hero-left">
                <div className="dkn-hero-eyebrow">
                  <span className="dkn-hero-eyebrow-dot" />
                  Discover local shops
                </div>
                <h1 className="dkn-hero-h1">
                  Find shops &amp; <em>products</em><br />near you
                </h1>
                <p className="dkn-hero-p">
                  Search local stores, check open times, and save favourites — all in one place.
                </p>
                <a
                  href="https://play.google.com/store/apps/details?id=com.mydukan.dukanapp"
                  target="_blank" rel="noopener noreferrer"
                  className="dkn-hero-cta"
                >
                  <Download size={15} /> Download the app <ArrowRight size={14} />
                </a>
                <div className="dkn-hero-feats">
                  {[
                    'Live open & close status for every shop',
                    'Browse products by category near you',
                    'Save favourites and get deal notifications',
                  ].map((f) => (
                    <div key={f} className="dkn-hero-feat">{f}</div>
                  ))}
                </div>
              </div>

              <div className="dkn-hero-right">
                <div className="dkn-hero-img-wrap">
                  <Image src={heroIllustration} alt="MyDukan app" priority fill sizes="(max-width: 768px) 100vw, 500px" style={{ objectFit: 'contain', objectPosition: 'bottom center' }} />
                </div>
                <div className="dkn-hero-floater f1">
                  <div className="dkn-floater-icon"><Store size={14} style={{ color: 'var(--g)' }} /></div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>Nearby shops</div>
                    <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 1 }}>10 open right now</div>
                  </div>
                </div>
                <div className="dkn-hero-floater f2">
                  <Clock size={14} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>Save time daily</div>
                    <div style={{ fontSize: 10, opacity: 0.6, marginTop: 1 }}>Check before you go</div>
                  </div>
                </div>
                <div className="dkn-hero-floater f3">
                  <span className="dkn-floater-dot" />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>Open now</div>
                    <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 1 }}>Confirmed live</div>
                  </div>
                </div>
              </div>

              <div className="dkn-hero-stat-row">
                {[
                  { val: 'Live', lbl: 'Shop status' },
                  { val: 'Instant', lbl: 'Search results' },
                  { val: 'Free', lbl: 'Always & forever' },
                ].map((s) => (
                  <div key={s.lbl} className="dkn-hero-stat">
                    <div className="dkn-hero-stat-val">{s.val}</div>
                    <div className="dkn-hero-stat-lbl">{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── HERO MOBILE ── */}
          <div className="dkn-hero-mobile">
            <div className="dkn-mob-eyebrow"><span className="dkn-hero-eyebrow-dot" /> Discover local</div>
            <h1 className="dkn-mob-h1">Find shops &amp; <em>products</em> near you</h1>
            <p className="dkn-mob-p">Search local stores, check open times, and save favourites.</p>
            <a
              href="https://play.google.com/store/apps/details?id=com.mydukan.dukanapp"
              target="_blank" rel="noopener noreferrer"
              className="dkn-mob-cta"
            >
              <Download size={14} /> Download app <ArrowRight size={12} />
            </a>
            <div className="dkn-mob-illus-wrap">
              <Image src={heroIllustration} alt="MyDukan app" width={500} height={280} style={{ width: '100%', height: 'auto', objectFit: 'contain', objectPosition: 'bottom', display: 'block' }} />
            </div>
            <div className="dkn-mob-stats">
              {[{ val: 'Live', lbl: 'Status' }, { val: 'Saved', lbl: 'Faves' }, { val: 'Free', lbl: 'Always' }].map((s) => (
                <div key={s.lbl} className="dkn-mob-stat">
                  <div className="dkn-mob-stat-val">{s.val}</div>
                  <div className="dkn-mob-stat-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── TOOLBAR ── */}
          <div className="dkn-toolbar">
            <div className="dkn-range-bar">
              <span className="dkn-range-label">Range</span>
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`dkn-range-chip${range === r ? ' active' : ''}`}
                >
                  {r === 'All' ? 'Any' : `${r} km`}
                </button>
              ))}
            </div>
            <div className="dkn-cats">
              {GLOBAL_CATEGORIES.map((cat) => {
                const meta = CATEGORY_MAPPING[cat];
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`dkn-cat${active ? ' active' : ''}`}
                    style={active ? { background: meta.color } : {}}
                  >
                    <span className="dkn-cat-emoji">{meta.emoji}</span>
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="dkn-body">

            {/* ── BANNER ── */}
            <div className="dkn-banner-wrap">
              {banners.map((b, i) => {
                if (b.banner_type === 'image' && b.image) {
                  return (
                    <div 
                      key={b.id} 
                      className={`dkn-banner-img-slide${i === activeBanner ? ' active' : ''}`}
                      onClick={() => handleBannerClick(b)}
                      style={{ cursor: b.link ? 'pointer' : 'default' }}
                    >
                      <img src={b.image} alt="banner" />
                      {b.link && (
                        <div className="dkn-banner-link-icon" style={{
                          position: 'absolute',
                          top: '16px',
                          right: '16px',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'rgba(0, 0, 0, 0.4)',
                          backdropFilter: 'blur(4px)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          zIndex: 5
                        }}>
                          ↗
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <div
                    key={b.id}
                    className={`dkn-banner-slide${i === activeBanner ? ' active' : ''}`}
                    style={{ background: b.background_color || '#0f3d28', cursor: b.link ? 'pointer' : 'default' }}
                    onClick={() => handleBannerClick(b)}
                  >
                    {b.link && (
                      <div className="dkn-banner-link-icon" style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        zIndex: 5
                      }}>
                        ↗
                      </div>
                    )}
                    <div className="dkn-banner-eyebrow">{b.small_text || 'Save time · energy · money'}</div>
                    <div className="dkn-banner-title">{b.title || 'MyDukan'}</div>
                    <div className="dkn-banner-sub">{b.subtitle || 'Make local shopping easy'}</div>
                  </div>
                );
              })}
              {banners.length > 1 && (
                <div className="dkn-bdots">
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      className={`dkn-bdot${i === activeBanner ? ' active' : ''}`}
                      onClick={() => setActiveBanner(i)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── OPEN NOW ── */}
            <section>
              <div className="dkn-section-head">
                <div className="dkn-section-left">
                  <div className="dkn-section-icon-wrap" style={{ background: '#dcfce7' }}>
                    <Clock size={15} style={{ color: '#166534' }} />
                  </div>
                  <div>
                    <div className="dkn-section-title">Open Now Nearby</div>
                    <div className="dkn-section-sub">Shops operating right now</div>
                  </div>
                </div>
                {hasCoords && openNowShops.length > PAGE_SIZE && (
                  <button className="dkn-see-all">See all <ArrowRight size={11} /></button>
                )}
              </div>

              {hasCoords && isLoading && (
                <div className="dkn-hscroll">
                  {[...Array(4)].map((_, i) => <ShopCardSkeleton key={i} />)}
                </div>
              )}
              {hasCoords && !isLoading && openNowShops.length > 0 && (
                <div className="dkn-hscroll">
                  {openNowShops.slice(0, PAGE_SIZE).map((shop) => {
                    const isPremium = PREMIUM_PLANS.includes(shop.plan);
                    const meta = CATEGORY_MAPPING[shop.category] || CATEGORY_MAPPING.Others;
                    return (
                      <Link key={`open-${shop.id}`} href={`/shop/${shop.id}`} className="dkn-shop-card">
                        <div className="dkn-card-img">
                          {shop.cover_image || shop.image
                            ? <img src={shop.cover_image || shop.image} alt={shop.name} />
                            : <span>{meta.emoji}</span>}
                          <div className="dkn-open-pill"><span className="dkn-open-dot" />Open</div>
                          {isPremium && <span className="dkn-pro-badge"><Award size={8} />PRO</span>}
                        </div>
                        <div className="dkn-card-body">
                          <div className="dkn-card-name">{shop.name}</div>
                          <div className="dkn-card-cat">{shop.category}</div>
                          <div className="dkn-card-foot">
                            {shop.distance != null && <span className="dkn-dist-pill">{formatDistance(shop.distance)}</span>}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
              {hasCoords && !isLoading && openNowShops.length === 0 && (
                <div className="dkn-empty">
                  <div className="dkn-empty-icon"><Clock size={18} style={{ color: 'var(--ink3)' }} /></div>
                  <p>No shops open right now</p>
                  <span>Check back later or explore all nearby shops below</span>
                </div>
              )}
              {!hasCoords && (
                <div className="dkn-empty">
                  <div className="dkn-empty-icon"><Clock size={18} style={{ color: 'var(--ink3)' }} /></div>
                  <p>Share your location to see open shops</p>
                </div>
              )}
            </section>

            {/* ── ALL NEARBY ── */}
            <section>
              <div className="dkn-section-head">
                <div className="dkn-section-left">
                  <div className="dkn-section-icon-wrap" style={{ background: 'var(--g-soft)' }}>
                    <MapPin size={15} style={{ color: 'var(--g)' }} />
                  </div>
                  <div>
                    <div className="dkn-section-title">All Nearby Shops</div>
                    <div className="dkn-section-sub">
                      {hasCoords
                        ? `Within ${range === 'All' ? 'any distance' : `${range} km`} · ${selectedCategory !== 'All' ? selectedCategory : 'all categories'}`
                        : 'Set your location to see shops near you'}
                    </div>
                  </div>
                </div>
              </div>

              {!hasCoords && status !== 'requesting' && (
                <div className="dkn-loc-cta">
                  <div className="dkn-loc-cta-icon">
                    <Navigation size={24} style={{ color: 'var(--g)' }} />
                  </div>
                  <h3>Share your location</h3>
                  <p>We need your location to show nearby shops and accurate distances.</p>
                  <button className="dkn-loc-cta-btn" onClick={requestLocation}>
                    <Navigation size={15} /> Use my location
                  </button>
                  {status === 'denied' && <p className="dkn-loc-denied-msg">Location was blocked — allow it in browser settings and try again.</p>}
                </div>
              )}

              {status === 'requesting' && (
                <div className="dkn-requesting">
                  <Loader2 size={26} className="dkn-spin" style={{ color: 'var(--g)' }} />
                  <p>Getting your location…</p>
                </div>
              )}

              {hasCoords && isLoading && (
                <div className="dkn-skeletons">
                  {[...Array(8)].map((_, i) => <ShopCardSkeleton key={i} />)}
                </div>
              )}

              {hasCoords && isError && !isLoading && (
                <div className="dkn-error">
                  <AlertCircle size={22} style={{ color: '#ef4444' }} />
                  <p>Failed to load shops</p>
                  <span>Check your connection and try again</span>
                </div>
              )}

              {hasCoords && !isLoading && !isError && (
                filteredShops.length > 0 ? (
                  <>
                    <div className="dkn-grid">
                      {filteredShops.slice(0, shopPage * PAGE_SIZE).map((shop) => {
                        const isPremium = PREMIUM_PLANS.includes(shop.plan);
                        const meta = CATEGORY_MAPPING[shop.category] || CATEGORY_MAPPING.Others;
                        return (
                          <Link key={shop.id} href={`/shop/${shop.id}`} className="dkn-grid-card">
                            {isPremium && (
                              <span className="dkn-pro-badge" style={{ position: 'absolute', top: 7, right: 7, zIndex: 2 }}>
                                <Award size={8} /> PRO
                              </span>
                            )}
                            <div className="dkn-gc-img">
                              {shop.cover_image || shop.image
                                ? <img src={shop.cover_image || shop.image} alt={shop.name} />
                                : <span>{meta.emoji}</span>}
                            </div>
                            <div className="dkn-gc-body">
                              <div className="dkn-gc-name">{shop.name}</div>
                              <div className="dkn-gc-cat">{shop.category}</div>
                              <div className="dkn-gc-foot">
                                {shop.distance != null && <span className="dkn-gc-dist">{formatDistance(shop.distance)}</span>}
                                {shop.is_open
                                  ? <span className="dkn-gc-open">Open</span>
                                  : <span className="dkn-gc-closed">Closed</span>}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                    {filteredShops.length > shopPage * PAGE_SIZE && (
                      <div className="dkn-loadmore">
                        <button onClick={() => setShopPage((p) => p + 1)}>Load more shops</button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="dkn-empty">
                    <div className="dkn-empty-icon"><Store size={18} style={{ color: 'var(--ink3)' }} /></div>
                    <p>No shops found</p>
                    <span>Try a wider range or different category</span>
                  </div>
                )
              )}
            </section>

          </div>
        </div>

        <BottomNav />
      </div>
    </>
  );
}

/* ─── MOBILE HEADER HEIGHT SYNC ──────────────────────────────────────────────
   Measures the real rendered header height after mount and on resize,
   then sets --mob-header-h so the toolbar sticks flush below with zero gap.
────────────────────────────────────────────────────────────────────────────── */
function MobileHeaderHeightSync() {
  useEffect(() => {
    const header = document.getElementById('dkn-header');
    if (!header) return;

    const update = () => {
      const h = header.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--mob-header-h', `${h}px`);
    };

    update();
    window.addEventListener('resize', update, { passive: true });
    // Also observe any layout changes (e.g. denied banner appearing)
    const ro = new ResizeObserver(update);
    ro.observe(header);

    return () => {
      window.removeEventListener('resize', update);
      ro.disconnect();
    };
  }, []);

  return null;
}