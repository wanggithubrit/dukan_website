'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, User, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    {
      label: 'Home',
      icon: Home,
      path: '/',
    },
    {
      label: 'Search',
      icon: Search,
      path: '/search',
    },
    {
      label: 'Favorites',
      icon: Heart,
      path: '/favorites',
      auth: true,
    },
    {
      label: user?.role === 'merchant' ? 'Dashboard' : 'Portal',
      icon: user?.role === 'merchant' ? LayoutDashboard : User,
      path: user?.role === 'merchant' ? '/merchant/dashboard' : '/merchant/login',
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 py-2 px-4 flex justify-around items-center">
      {navItems.map((item) => {
        // Skip favorites tab if user is not authenticated
        if (item.auth && !user) return null;

        const isActive = pathname === item.path;
        const Icon = item.icon;

        return (
          <Link
            key={item.label}
            href={item.path}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-all ${
              isActive
                ? 'text-brand-green-700 font-bold scale-105'
                : 'text-slate-500 hover:text-brand-green-600'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] tracking-wide font-medium">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
