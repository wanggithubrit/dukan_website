'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, User, LayoutDashboard, ShoppingBag, Store, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isMerchantPath = (pathname.startsWith('/merchant') || user?.role === 'merchant') && pathname !== '/merchant/login' && pathname !== '/merchant/signup';

  const navItems = isMerchantPath
    ? [
        {
          label: 'Home',
          icon: Home,
          path: '/merchant/dashboard',
        },
        {
          label: 'Items',
          icon: ShoppingBag,
          path: '/merchant/items',
        },
        {
          label: 'Profile',
          icon: Store,
          path: '/merchant/profile',
        },
      ]
    : [
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
          path: user ? (user.role === 'merchant' ? '/merchant/dashboard' : '/profile') : '/customer/login',
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
          background: var(--bottom-nav-bg, rgba(250,250,247,0.97));
          backdrop-filter: blur(24px) saturate(200%);
          border-top: 1px solid var(--bottom-nav-border, rgba(26,92,58,0.11));
          padding: 8px 16px;
          padding-bottom: calc(8px + env(safe-area-inset-bottom));
          justify-content: space-around;
          align-items: center;
        }
        @media (max-width: 767px) {
          .dkn-bottom-nav { display: flex; }
        }

        /* Premium Dark Theme for Merchant Portal Bottom Nav */
        .dkn-bottom-nav.merchant-nav {
          background: #0F2118 !important;
          border-top: 1px solid rgba(255,255,255,0.08) !important;
          --nav-item-inactive-color: #8E9A96;
          --nav-item-active-color: #00E676;
          --nav-item-active-bg: rgba(255,255,255,0.08);
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
          color: var(--nav-item-inactive-color, #9aada2);
          transition: all 0.18s cubic-bezier(0.34,1.56,0.64,1);
          letter-spacing: 0.01em;
          border: none;
          background: transparent;
          cursor: pointer;
          position: relative;
        }
        .dkn-nav-item:hover {
          color: var(--nav-item-active-color, #1a5c3a);
          background: var(--nav-item-active-bg, #eaf5ee);
        }
        .dkn-nav-item.active {
          color: var(--nav-item-active-color, #1a5c3a);
          background: var(--nav-item-active-bg, #eaf5ee);
          font-weight: 700;
        }
        .dkn-nav-item.active .dkn-nav-icon {
          transform: scale(1.12);
        }

        .dkn-bottom-nav.merchant-nav .dkn-nav-item {
          padding: 8px 16px;
          border-radius: 16px;
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
          background: var(--nav-item-active-color, #1a5c3a);
        }

        /* Disable dot active indicator in merchant portal capsule view */
        .dkn-bottom-nav.merchant-nav .dkn-nav-item.active::after {
          display: none;
        }

        .dkn-floating-add-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #1a5c3a;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(26, 92, 58, 0.3);
          transform: translateY(-16px);
          transition: all 0.2s ease;
          border: 4px solid var(--bottom-nav-bg, rgba(250,250,247,0.97));
        }
        .dkn-floating-add-btn:hover {
          background: #14472c;
          transform: translateY(-18px) scale(1.05);
        }
        .dkn-floating-add-btn:active {
          transform: translateY(-14px) scale(0.95);
        }

        /* Glowing center button for merchant dark portal */
        .dkn-bottom-nav.merchant-nav .dkn-floating-add-btn {
          background: #1b4d3e;
          border-color: #0F2118;
          box-shadow: 0 0 0 1px #00E676, 0 4px 12px rgba(0, 230, 118, 0.2);
        }
        .dkn-bottom-nav.merchant-nav .dkn-floating-add-btn:hover {
          background: #143b2f;
          transform: translateY(-18px) scale(1.05);
        }
      `}</style>

      <nav className={`dkn-bottom-nav ${isMerchantPath ? 'merchant-nav' : ''}`}>
        {navItems.map((item) => {
          if (item.auth && !user) return null;

          const isActive = isMerchantPath
            ? pathname === item.path || (item.path && pathname.split('?')[0] === item.path.split('?')[0])
            : pathname === item.path;
          const Icon = item.icon;

          if (item.isFloating) {
            return (
              <Link
                key={item.label}
                href={item.path}
                className="dkn-floating-add-btn"
                title="Add New Product"
              >
                <Plus size={24} strokeWidth={3} className="text-white" />
              </Link>
            );
          }

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