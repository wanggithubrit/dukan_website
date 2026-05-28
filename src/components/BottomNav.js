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
    <>
      <style>{`
        .dkn-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 90;
          background: rgba(250,250,247,0.97);
          backdrop-filter: blur(24px) saturate(200%);
          border-top: 1px solid rgba(26,92,58,0.11);
          padding: 8px 16px;
          padding-bottom: calc(8px + env(safe-area-inset-bottom));
          justify-content: space-around;
          align-items: center;
        }
        @media (max-width: 767px) {
          .dkn-bottom-nav { display: flex; }
        }

        .dkn-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 6px 16px;
          border-radius: 14px;
          text-decoration: none;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-size: 10px;
          font-weight: 500;
          color: #9aada2;
          transition: all 0.18s cubic-bezier(0.34,1.56,0.64,1);
          letter-spacing: 0.01em;
          border: none;
          background: transparent;
          cursor: pointer;
          position: relative;
        }
        .dkn-nav-item:hover {
          color: #1a5c3a;
          background: #eaf5ee;
        }
        .dkn-nav-item.active {
          color: #1a5c3a;
          background: #eaf5ee;
          font-weight: 700;
        }
        .dkn-nav-item.active .dkn-nav-icon {
          transform: scale(1.12);
        }

        .dkn-nav-icon {
          width: 20px; height: 20px;
          transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1);
          display: flex; align-items: center; justify-content: center;
        }

        .dkn-nav-label {
          font-size: 10px;
          line-height: 1;
          letter-spacing: 0.02em;
        }

        /* Active indicator dot */
        .dkn-nav-item.active::after {
          content: '';
          position: absolute;
          top: 4px; left: 50%; transform: translateX(-50%);
          width: 4px; height: 4px;
          border-radius: 50%;
          background: #1a5c3a;
        }
      `}</style>

      <nav className="dkn-bottom-nav">
        {navItems.map((item) => {
          if (item.auth && !user) return null;

          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.path}
              className={`dkn-nav-item${isActive ? ' active' : ''}`}
            >
              <span className="dkn-nav-icon">
                <Icon size={isActive ? 20 : 19} strokeWidth={isActive ? 2.5 : 1.8} />
              </span>
              <span className="dkn-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}