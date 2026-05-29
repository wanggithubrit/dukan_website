'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, Store, Sparkles, MapPin, CheckCircle2, User } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F4F9F5] pb-20 text-[#092219] font-outfit text-left">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E6F4EE] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#E6F4EE] flex items-center justify-center shadow-xs">
              <Image src="/logo_green.png" alt="MyDukan" width={22} height={22} />
            </div>
            <span className="text-lg font-black tracking-tight text-[#0A5C43]">
              My<span className="text-[#092219]">Dukan</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-655">
            <Link href="/" className="hover:text-[#0A5C43] transition-colors">Shops</Link>
            <Link href="/search" className="hover:text-[#0A5C43] transition-colors">Products</Link>
            <Link href="/" className="hover:text-[#0A5C43] transition-colors">Offers</Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <Link href="/merchant/login">
              <motion.button
                className="flex items-center gap-2 px-4 py-2 bg-[#0A5C43] hover:bg-[#084834] text-white rounded-full text-xs font-black transition-colors shadow-xs"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <User className="w-3.5 h-3.5" />
                Account
              </motion.button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-black text-[#0A5C43] hover:text-[#084834] transition-colors mb-6 uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white border border-[#E6F4EE] rounded-3xl p-8 sm:p-12 shadow-sm space-y-8"
        >
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-[#E6F4EE] text-[#0A5C43] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              Who We Are
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#092219]">
              About Us
            </h1>
          </div>

          <div className="text-sm text-slate-655 dark:text-slate-350 space-y-5 leading-relaxed font-medium">
            <p className="text-base text-[#0A5C43] font-extrabold leading-normal">
              Dukan is a hyperlocal marketplace designed to help people discover nearby shops, products, and offers in their community.
            </p>

            <p>
              Our mission is to make local businesses more visible online and help customers easily find and connect with shops around them.
            </p>

            <p>
              Whether you&apos;re looking for groceries, fashion, electronics, restaurants, or other local services, Dukan brings local commerce closer to you.
            </p>

            <p>
              We believe small businesses are the backbone of every community. By helping local merchants showcase their products and services digitally, we aim to strengthen local economies and create more opportunities for growth.
            </p>
          </div>

          {/* Features Checklist */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <h3 className="text-xs font-black text-[#092219] uppercase tracking-wider">Features:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                'Discover nearby shops',
                'Browse products and offers',
                'Connect directly with merchants',
                'Support local businesses',
                'Promote and grow your shop'
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer citation */}
          <div className="pt-6 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-[#0A5C43]">
            <MapPin className="w-4 h-4 text-[#0A5C43]" />
            <span>Founded in Nagaland, built for local communities.</span>
          </div>
        </motion.div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="mt-20 border-t border-[#E6F4EE] bg-white pt-16 pb-12 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <span className="text-lg font-black tracking-tight text-[#0A5C43] mb-4 block">
              My<span className="text-[#092219]">Dukan</span>
            </span>
            <p className="text-slate-400 text-xs font-medium leading-relaxed pr-4">
              Empowering local neighborhoods through digital connectivity and sustainable commerce. Your local marketplace, reimagined.
            </p>
            <p className="text-[10px] text-slate-400 font-bold mt-6">
              © {new Date().getFullYear()} MyDukan. Digital Neighborhoods.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-black text-[#092219] uppercase tracking-wider mb-4">Company</h4>
            <div className="space-y-3 flex flex-col text-xs font-bold text-slate-550">
              <Link href="/about" className="hover:text-[#0A5C43] transition">About Us</Link>
              <Link href="/" className="hover:text-[#0A5C43] transition">Privacy Policy</Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-black text-[#092219] uppercase tracking-wider mb-4">Partners</h4>
            <div className="space-y-3 flex flex-col text-xs font-bold text-slate-550">
              <Link href="/merchant/login" className="hover:text-[#0A5C43] transition">Merchant Portal</Link>
              <Link href="/" className="hover:text-[#0A5C43] transition">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
