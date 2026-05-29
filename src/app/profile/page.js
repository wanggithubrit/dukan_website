'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import api from '@/utils/api';
import BottomNav from '@/components/BottomNav';
import { 
  Heart, 
  MessageSquare, 
  ChevronDown, 
  ChevronRight, 
  LogOut, 
  Mail, 
  Check, 
  User, 
  Award,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Custom robust inline SVG icons for Instagram and YouTube
const Instagram = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const Youtube = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);

// Avatars mapping matching app public folder assets
const AVATARS = {
  male_1: '/avatars/man.png',
  male_2: '/avatars/woman.png',
  female_1: '/avatars/cat.png',
  female_2: '/avatars/panda.png',
};
const AVATAR_KEYS = Object.keys(AVATARS);

export default function CustomerProfilePage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatar, setAvatar] = useState('male_1');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);

  // Fetch profile on mount
  const fetchProfile = useCallback(async () => {
    if (!user?.user_id) return;
    try {
      const res = await api.get(`user/${user.user_id}/`);
      setProfileData(res.data);
      if (res.data.avatar) {
        setAvatar(res.data.avatar);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user === null) {
      router.push('/customer/login');
      return;
    }
    fetchProfile();
  }, [user, fetchProfile, router]);

  // Update avatar selection
  const handleUpdateAvatar = async (key) => {
    if (!key) return;
    try {
      await api.post('avatar/update/', { avatar: key });
      setAvatar(key);
      showToast('Avatar updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update avatar', 'error');
    }
  };

  // Submit Help & Feedback
  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setSendingFeedback(true);
    try {
      await api.post('feedback/', { message: feedback.trim() });
      setFeedback('');
      setShowFeedback(false);
      showToast('Feedback submitted successfully! Thank you.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to send feedback', 'error');
    } finally {
      setSendingFeedback(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    logout();
    showToast('Signed out successfully', 'info');
    router.push('/customer/login');
  };

  if (loading || !user) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#F4F7F6]">
        <Loader2 className="w-10 h-10 text-[#2F5D50] animate-spin mb-3" />
        <h2 className="text-xs font-bold text-slate-400 font-outfit uppercase tracking-wider">Loading profile...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7F6] text-[#0F1F1B] pb-24 font-sans text-left">
      
      {/* Header wrapper matching App style */}
      <div className="max-w-md mx-auto px-4 pt-6 pb-4 flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-[#0F1F1B] font-outfit tracking-tight">My Profile</h1>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 hover:border-red-200 text-xs font-semibold transition-all shadow-xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign out</span>
        </button>
      </div>

      {/* Profile Main Shelf */}
      <div className="max-w-md mx-auto px-4 space-y-6">
        
        {/* HERO PROFILE CARD */}
        <div className="bg-white border border-[#E4EDE9] rounded-3xl overflow-hidden shadow-sm relative p-5">
          {/* Accent decoration background circle */}
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-[#2F5D50]/5 pointer-events-none" />

          <div className="flex items-center gap-4 relative z-10">
            <div className="relative">
              <div className="w-[72px] h-[72px] rounded-full overflow-hidden border-2 border-[#3D7A68] bg-slate-50 flex items-center justify-center">
                <img src={AVATARS[avatar] || AVATARS.male_1} alt="User Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#0F1F1B] font-outfit truncate">{profileData?.username || user?.username}</h2>
              <p className="text-xs text-[#6B8A82] flex items-center gap-1 mt-0.5 truncate">
                <Mail className="w-3 h-3 text-[#A0BAB4] shrink-0" />
                <span>{profileData?.email || 'No email associated'}</span>
              </p>
            </div>
          </div>

          {/* Stats strip matching the app */}
          <div className="flex border-t border-[#E4EDE9] mt-5 pt-4 text-center divide-x divide-[#E4EDE9]">
            <div className="flex-1 flex flex-col items-center">
              <span className="text-sm font-bold text-[#0F1F1B]">4</span>
              <span className="text-[10px] text-[#6B8A82] font-semibold uppercase tracking-wider mt-0.5">Avatars</span>
            </div>
            
            <div className="flex-1 flex flex-col items-center">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-sm font-bold text-[#1A5A2D]">Active</span>
              </div>
              <span className="text-[10px] text-[#6B8A82] font-semibold uppercase tracking-wider mt-0.5">Status</span>
            </div>

            <div className="flex-1 flex flex-col items-center">
              <span className="text-sm font-bold text-[#1A5A2D] flex items-center gap-0.5 justify-center">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>Free</span>
              </span>
              <span className="text-[10px] text-[#6B8A82] font-semibold uppercase tracking-wider mt-0.5">Plan</span>
            </div>
          </div>
        </div>

        {/* AVATAR SELECTION GRID SECTION */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold text-[#A0BAB4] uppercase tracking-wider ml-1">Choose Avatar</h3>
          <div className="bg-white border border-[#E4EDE9] rounded-2xl p-4 shadow-xs">
            <div className="grid grid-cols-4 gap-3 justify-center">
              {AVATAR_KEYS.map((key) => {
                const active = avatar === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleUpdateAvatar(key)}
                    className={`aspect-square rounded-xl overflow-hidden relative border transition-all p-1 bg-slate-50 hover:bg-slate-100/50 ${
                      active ? 'border-[#3D7A68] ring-2 ring-[#2F5D50]/15' : 'border-[#E4EDE9]'
                    }`}
                  >
                    <img src={AVATARS[key]} alt={key} className="w-full h-full object-cover" />
                    {active && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#2F5D50] flex items-center justify-center text-white shadow-xs">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ACCOUNT LIST MATRIX OPTIONS */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold text-[#A0BAB4] uppercase tracking-wider ml-1">Account Options</h3>
          <div className="bg-white border border-[#E4EDE9] rounded-2xl overflow-hidden shadow-xs divide-y divide-[#E4EDE9]">
            
            {/* Saved Shops / Favorites link */}
            <Link 
              href="/favorites"
              className="flex items-center gap-3.5 px-4.5 py-4 hover:bg-slate-50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#1B7F34] flex items-center justify-center shrink-0">
                <Heart className="w-4.5 h-4.5 fill-current" />
              </div>
              <div className="flex-grow min-w-0">
                <h4 className="text-xs font-bold text-[#0F1F1B]">Saved Shops</h4>
                <p className="text-[10px] text-[#6B8A82] font-medium mt-0.5">Your favorite local stores</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#A0BAB4] transition-transform group-hover:translate-x-0.5" />
            </Link>

            {/* Help & Feedback expandable panel */}
            <div className="bg-white">
              <button
                onClick={() => setShowFeedback(!showFeedback)}
                className="w-full flex items-center gap-3.5 px-4.5 py-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4.5 h-4.5" />
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="text-xs font-bold text-[#0F1F1B]">Help & Feedback</h4>
                  <p className="text-[10px] text-[#6B8A82] font-medium mt-0.5">We would love to hear from you</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-[#A0BAB4] transition-transform duration-200 ${showFeedback ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence initial={false}>
                {showFeedback && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden bg-[#F4F7F6]/40"
                  >
                    <form onSubmit={handleSubmitFeedback} className="p-4 border-t border-[#E4EDE9] space-y-3">
                      <textarea
                        rows="3"
                        placeholder="What's on your mind? Tell us how we can improve..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        required
                        className="w-full text-xs p-3 rounded-xl border border-[#E4EDE9] bg-white text-[#0F1F1B] outline-none focus:ring-2 focus:ring-[#2F5D50]/30 placeholder-[#A0BAB4] transition-all resize-none"
                      />
                      <button
                        type="submit"
                        disabled={sendingFeedback || !feedback.trim()}
                        className="w-full bg-[#2F5D50] hover:bg-[#3D7A68] text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {sendingFeedback ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <span>Submit Feedback</span>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>

        {/* FOLLOW US CARD SECTION */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold text-[#A0BAB4] uppercase tracking-wider ml-1">Follow Us</h3>
          <div className="grid grid-cols-2 gap-3">
            
            {/* Instagram */}
            <a 
              href="https://www.instagram.com/dukand.service/"
              target="_blank" rel="noopener noreferrer"
              className="bg-white border border-[#E4EDE9] rounded-2xl p-3 flex items-center gap-3 hover:bg-slate-50 transition-all text-left shadow-2xs group"
            >
              <div className="w-8 h-8 rounded-xl bg-pink-50 hover:bg-pink-100 text-[#E1306C] flex items-center justify-center shrink-0 transition-colors">
                <Instagram className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-[#0F1F1B] leading-none">Instagram</h4>
                <span className="text-[9px] text-[#6B8A82] font-semibold mt-1 block truncate">@dukand.service</span>
              </div>
            </a>

            {/* YouTube */}
            <a 
              href="https://www.youtube.com/@dukan-316"
              target="_blank" rel="noopener noreferrer"
              className="bg-white border border-[#E4EDE9] rounded-2xl p-3 flex items-center gap-3 hover:bg-slate-50 transition-all text-left shadow-2xs group"
            >
              <div className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 text-[#FF0000] flex items-center justify-center shrink-0 transition-colors">
                <Youtube className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-[#0F1F1B] leading-none">YouTube</h4>
                <span className="text-[9px] text-[#6B8A82] font-semibold mt-1 block truncate">@dukand-316</span>
              </div>
            </a>

          </div>
        </div>

        {/* Brand footer metadata details */}
        <p className="text-[10px] text-[#A0BAB4] text-center font-semibold pt-4">
          dukanpersonal316@gmail.com
        </p>

      </div>

      {/* Sticky footer tab navigation bar wrapper */}
      <BottomNav />

    </div>
  );
}
