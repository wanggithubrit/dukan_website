import React from 'react';
import { Sparkles } from 'lucide-react';

export default function AdBanner() {
  return (
    <div className="w-full my-6 flex justify-center items-center">
      <div className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden group shadow-sm transition-all duration-300 hover:shadow-md max-w-4xl">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-green-700/5 via-transparent to-brand-green-500/5 opacity-60 pointer-events-none" />
        <div className="absolute top-2 left-2 bg-brand-green-50 dark:bg-brand-green-950/50 text-brand-green-700 dark:text-brand-green-400 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
          <Sparkles className="w-2 h-2 animate-pulse" />
          <span>Sponsored Promotion</span>
        </div>
        
        <div className="flex items-center gap-4 mt-2 sm:mt-0 text-left">
          <div className="w-12 h-12 rounded-xl bg-brand-green-100 dark:bg-brand-green-950/40 flex items-center justify-center text-xl shadow-sm shrink-0">
            📈
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white font-outfit uppercase tracking-wider">Boost Your Shop Visibility</h4>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-relaxed">
              Get up to 10x more customer impressions, priority search ranking, and premium banner placements!
            </p>
          </div>
        </div>

        <button 
          onClick={() => alert('Dukan Ad campaigns are configured automatically for premium sellers.')}
          className="bg-brand-green-600 hover:bg-brand-green-700 text-white font-black text-[10px] uppercase px-4 py-2 rounded-xl tracking-wider shrink-0 transition-all shadow-sm group-hover:scale-102"
        >
          Promote Now
        </button>
      </div>
    </div>
  );
}
