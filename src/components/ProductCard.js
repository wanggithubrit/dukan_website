'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, ShoppingBag, Store, Navigation, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProductCard({ item, showShopInfo = true, shopPhone, shopWhatsApp }) {
  const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');
  const normalizeImageUrl = (img) => {
    if (!img || typeof img !== 'string') return '';
    const value = img.trim();
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith('/')) return `${API_BASE_URL}${value}`;
    return `${API_BASE_URL}/${value.replace(/^\/+/, '')}`;
  };
  const imageUrl = normalizeImageUrl(item.image) || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60';
  
  // Dynamic stock logic directly mapping core serializers get_quantity_status
  const isOut = item.quantity_status === 'out';
  const isLow = item.quantity_status === 'low';
  const isIn = item.quantity_status === 'in';
  const hasQtyFeature = item.shop_has_quantity_feature && item.track_quantity;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow flex flex-col justify-between text-left group"
    >
      {/* Product Image Section */}
      <div className="relative aspect-square w-full bg-linear-to-br from-slate-50 to-slate-100 overflow-hidden shrink-0">
        <motion.img
          src={imageUrl}
          alt={item.name}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.4 }}
          loading="lazy"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Price Badge */}
        {item.price !== null && item.price !== undefined && (
          <motion.div 
            className="absolute bottom-3 left-3 bg-linear-to-br from-green-600 to-green-700 px-3 py-1.5 rounded-xl text-white font-black text-xs shadow-lg"
            whileHover={{ scale: 1.1 }}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            ₹{item.price % 1 === 0 ? parseFloat(item.price).toFixed(0) : parseFloat(item.price).toFixed(2)}
          </motion.div>
        )}

        {/* Stock Badge */}
        {hasQtyFeature && (
          <motion.div 
            className="absolute top-3 left-3"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
          >
            {isOut && (
              <span className="inline-block px-2.5 py-1 rounded-lg text-[9px] font-black tracking-wide bg-red-100 text-red-700 border border-red-200 uppercase shadow-sm">
                Out of stock
              </span>
            )}
            {isLow && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black tracking-wide bg-yellow-100 text-yellow-700 border border-yellow-200 shadow-sm">
                <AlertCircle className="w-2.5 h-2.5" />
                <span>Only {item.quantity} left</span>
              </span>
            )}
            {isIn && (
              <span className="inline-block px-2.5 py-1 rounded-lg text-[9px] font-black tracking-wide bg-green-100 text-green-700 border border-green-200 uppercase shadow-sm">
                In Stock
              </span>
            )}
          </motion.div>
        )}
      </div>

      {/* Info Body */}
      <div className="p-3.5 grow flex flex-col justify-between gap-3 bg-white">
        <div>
          <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 min-h-8 leading-snug">
            {item.name}
          </h4>
        </div>

        <div>
          {/* Shop details block */}
          {showShopInfo && item.shop_details && (
            <div className="border-t border-slate-100 pt-3 mt-1 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-[10px] text-slate-600">
                <span className="flex items-center gap-1 font-bold max-w-27.5 truncate text-slate-700">
                  <Store className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  {item.shop_details.name}
                </span>
                
                {item.shop_details.distance !== undefined && item.shop_details.distance !== null && (
                  <span className="flex items-center gap-0.5 shrink-0 font-extrabold text-green-600">
                    <Navigation className="w-3 h-3 shrink-0" />
                    {item.shop_details.distance < 1 ? `Nearby (${Math.round(item.shop_details.distance * 1000)}m)` : `Approx. ${item.shop_details.distance.toFixed(1)} km`}
                  </span>
                )}
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href={`/shop/${item.shop_details.id}`}
                  className="w-full text-center py-2 rounded-lg bg-linear-to-r from-green-600 to-green-700 hover:shadow-lg text-white font-black text-[10px] tracking-wide transition-all flex items-center justify-center gap-1 shadow-md"
                >
                  <ShoppingBag className="w-3 h-3" />
                  <span>Visit Store</span>
                </Link>
              </motion.div>
            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
}
