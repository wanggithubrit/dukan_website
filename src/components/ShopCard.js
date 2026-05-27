'use client';

import Link from 'next/link';
import { MapPin, ShoppingBag, ArrowUpRight, Clock } from 'lucide-react';

export default function ShopCard({ shop }) {
  const distance = shop.distance ?? 999;
  const itemCount = (shop.items || []).length;
  const isNearby = distance <= 2;
  const isOpen = shop.is_open;

  return (
    <Link href={`/shop/${shop.id}`} className="block group h-full">
      <article className="relative h-full bg-white rounded-3xl overflow-hidden border border-slate-100/80 hover:border-brand-green-200/60 hover:shadow-2xl hover:shadow-brand-green-900/8 transition-all duration-500 flex flex-col"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)' }}>

        {/* Image */}
        <div className="relative h-48 bg-slate-50 overflow-hidden shrink-0">
          <img
            src={shop.image || shop.cover_image || 'https://images.unsplash.com/photo-1542272604-787c62d465d1?w=600&h=400&fit=crop&auto=format&q=80'}
            alt={shop.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
          />

          {/* Subtle gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />

          {/* Top badges row */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
            {/* Category */}
            {shop.category && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold text-white tracking-wide"
                style={{ background: 'rgba(10, 92, 67, 0.88)', backdropFilter: 'blur(8px)' }}>
                {shop.category}
              </span>
            )}

            {/* Item count */}
            {itemCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold text-white"
                style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}>
                <ShoppingBag className="w-2.5 h-2.5" />
                {itemCount}
              </span>
            )}
          </div>

          {/* Bottom status row */}
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            {isNearby && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                style={{ background: 'rgba(10, 92, 67, 0.9)', backdropFilter: 'blur(8px)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Nearby
              </span>
            )}
            {isOpen !== undefined && (
              <span className={`ml-auto flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${
                isOpen
                  ? 'text-emerald-700 bg-emerald-50/95'
                  : 'text-slate-500 bg-white/80'
              }`} style={{ backdropFilter: 'blur(6px)' }}>
                <Clock className="w-2.5 h-2.5" />
                {isOpen ? 'Open' : 'Closed'}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-3 grow">

          {/* Name + arrow */}
          <div className="flex items-start justify-between gap-2">
            <h3
              className="text-[15px] font-bold text-slate-900 leading-snug group-hover:text-brand-green-700 transition-colors duration-300 line-clamp-2 flex-1"
              style={{ letterSpacing: '-0.01em' }}>
              {shop.name}
            </h3>
            <span className="shrink-0 w-7 h-7 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-brand-green-600 group-hover:border-brand-green-600 transition-all duration-300">
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-white transition-colors duration-300" />
            </span>
          </div>

          {/* Location footer */}
          <div className="flex items-center gap-2 mt-auto pt-3 border-t border-slate-50">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold">
              <div className="w-5 h-5 rounded-md bg-brand-green-50 flex items-center justify-center shrink-0">
                <MapPin className="w-3 h-3 text-brand-green-500" />
              </div>
              <span className={distance <= 1 ? 'text-brand-green-600' : distance >= 999 ? 'text-slate-400' : 'text-slate-500'}>
                {distance >= 999 ? 'N/A' : `${distance.toFixed(1)} km`}
              </span>
            </div>

            {shop.location && (
              <span className="text-[11px] text-slate-400 truncate flex-1 text-right leading-tight">
                {shop.location}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}