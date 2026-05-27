'use client';

import Link from 'next/link';
import { ShoppingBag, Star, Navigation } from 'lucide-react';

const CATEGORY_COLORS = {
  Grocery:     { bg: '#CFFADF', text: '#065F46', icon: '#00A854' },
  Footwear:    { bg: '#FEF3C7', text: '#7C4A00', icon: '#D97706' },
  Fashion:     { bg: '#FDE8F5', text: '#831B5C', icon: '#DB2777' },
  Medicine:    { bg: '#FEE2E2', text: '#881B1B', icon: '#DC2626' },
  Electronics: { bg: '#DBEAFE', text: '#1A3A8A', icon: '#2563EB' },
  Bakeries:    { bg: '#FEF3C7', text: '#7C4A00', icon: '#D97706' },
  Rentals:     { bg: '#EDE9FE', text: '#4C1D95', icon: '#7C3AED' },
  Stationery:  { bg: '#E0F2FE', text: '#0C4A6E', icon: '#0284C7' },
  Furniture:   { bg: '#F5F3FF', text: '#4C1D95', icon: '#6D28D9' },
  Books:       { bg: '#FFF7ED', text: '#9A3412', icon: '#EA580C' },
  Others:      { bg: '#F1F5F9', text: '#334155', icon: '#64748B' },
  All:         { bg: '#E6F4EF', text: '#065F46', icon: '#0A5C43' },
};

const PLACEHOLDER_BG = {
  Grocery: '#C8E6CB', Footwear: '#FFF9C4', Fashion: '#F8BBD9',
  Medicine: '#FFCDD2', Electronics: '#BBDEFB', Bakeries: '#FFE082',
  Rentals: '#D1C4E9', Stationery: '#B3E5FC', Furniture: '#E1BEE7',
  Books: '#FFE0B2', Others: '#CFD8DC',
};

const CATEGORY_EMOJI = {
  Grocery: '🛒', Footwear: '👟', Fashion: '👗', Medicine: '💊',
  Electronics: '📱', Bakeries: '🥖', Rentals: '🔑', Stationery: '📝',
  Furniture: '🛋️', Books: '📚', Others: '📦',
};

const PREMIUM_PLANS = ['Pro', 'Business', 'Premium', 'pro', 'business', 'premium'];

function normalizeCat(cat) {
  if (!cat) return 'Others';
  return Object.keys(CATEGORY_COLORS).find(
    (k) => k.toLowerCase() === cat.toLowerCase()
  ) || 'Others';
}

export default function ShopCard({ shop }) {
  const distance  = shop.distance ?? 999;
  const itemCount = (shop.items || []).length;
  const isOpen    = shop.is_open;
  const isPremium = PREMIUM_PLANS.includes(shop.plan);
  const catKey    = normalizeCat(shop.category);
  const catColor  = CATEGORY_COLORS[catKey] || CATEGORY_COLORS.Others;
  const hasImage  = !!(shop.cover_image || shop.image);
  const placeholderBg = PLACEHOLDER_BG[catKey] || '#CFD8DC';

  return (
    <Link href={`/shop/${shop.id}`} className="block group h-full">
      <article
        className="relative h-full flex flex-col overflow-hidden transition-all duration-300 group-hover:-translate-y-0.5"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          border: isPremium ? '2px solid #0A5C43' : '1.5px solid rgba(224,234,230,0.9)',
          boxShadow: isPremium
            ? '0 4px 16px rgba(10,58,40,0.16)'
            : '0 2px 8px rgba(10,58,40,0.07)',
        }}
      >
        {/* ── Image ── */}
        <div className="relative overflow-hidden shrink-0" style={{ height: 150 }}>
          {hasImage ? (
            <img
              src={shop.cover_image || shop.image}
              alt={shop.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
              onError={e => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '';
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: placeholderBg, display: hasImage ? 'none' : 'flex' }}
          >
            <span className="text-2xl" style={{ opacity: 0.4 }}>
              {CATEGORY_EMOJI[catKey] || '🏪'}
            </span>
          </div>

          {/* Open/Closed pill — top left */}
          <div
            className="absolute top-1.5 left-1.5 flex items-center gap-1 px-2 py-0.75 rounded-full"
            style={{ backgroundColor: isOpen ? '#CFFADF' : 'rgba(255,255,255,0.88)' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{
                backgroundColor: isOpen ? '#00C46A' : '#8FA9A0',
                boxShadow: isOpen ? '0 0 4px rgba(0,196,106,0.55)' : 'none',
              }}
            />
            <span
              className="text-[9px] font-bold leading-none"
              style={{ color: isOpen ? '#065F46' : '#4F6B62' }}
            >
              {isOpen ? 'Open' : 'Closed'}
            </span>
          </div>

          {/* Premium badge — top right */}
          {isPremium && (
            <div
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(0,0,0,0.48)',
                boxShadow: '0 0 7px rgba(255,215,0,0.5)',
              }}
            >
              <Star className="w-3 h-3 fill-[#FFD700] text-[#FFD700]" />
            </div>
          )}

          {/* Item count — bottom right (non-premium) */}
          {itemCount > 0 && !isPremium && (
            <div
              className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(0,0,0,0.42)' }}
            >
              <ShoppingBag className="w-2 h-2 text-white" />
              <span className="text-[9px] font-semibold text-white">{itemCount}</span>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="flex flex-col grow" style={{ padding: '8px 10px 9px' }}>

          {/* Name */}
          <p
            className="truncate leading-tight mb-1.5"
            style={{ fontWeight: 700, fontSize: 12, color: '#0D1F19', letterSpacing: -0.2 }}
          >
            {shop.name}
          </p>

          {/* Category tag */}
          {catKey && catKey !== 'All' && (
            <div
              className="inline-flex items-center gap-1 self-start px-1.5 py-0.5 rounded-lg mb-1.5"
              style={{
                backgroundColor: catColor.bg + '66',
                border: `1px solid ${catColor.icon}4D`,
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: catColor.icon, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: catColor.text, letterSpacing: -0.1 }}>
                {catKey}
              </span>
            </div>
          )}

          {/* Distance chip */}
          {distance < 999 && (
            <div
              className="inline-flex items-center gap-1 self-start px-1.5 py-0.5 rounded-lg mt-auto"
              style={{
                backgroundColor: '#F0F9F5',
                border: '1px solid rgba(10,92,67,0.14)',
              }}
            >
              <Navigation className="w-2 h-2 shrink-0" style={{ color: '#0A5C43' }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: '#0A5C43', letterSpacing: -0.1 }}>
                {Number(distance).toFixed(1)} km
              </span>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}