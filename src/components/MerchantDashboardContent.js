'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import api from '@/utils/api';
import AdBanner from '@/components/AdBanner';
import { 
  Store, 
  ShoppingBag, 
  Gift, 
  Image as ImageIcon, 
  TrendingUp, 
  Users, 
  Plus, 
  Trash2, 
  Edit, 
  BadgeCheck, 
  Zap, 
  Save, 
  AlertCircle,
  LogOut,
  Menu,
  X,
  Lock,
  RefreshCw,
  Minus,
  CheckCircle2,
  Compass,
  MapPin,
  Clock,
  Navigation,
  Award,
  Loader2,
  Heart,
  Search,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Mail,
  Check,
  ExternalLink,
  Eye
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

// Category mapping metadata matching root page.js
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
  'Home & Kitchen':           { emoji: '🍳', color: '#b45309', bg: '#fffbeb' },
  '🔧 Hardware & Tools':     { emoji: '🔧', color: '#475569', bg: '#f1f5f9' },
  'Computers & Accessories': { emoji: '💻', color: '#0369a1', bg: '#f0f9ff' },
  '🎁 Gifts & Toys':         { emoji: '🎁', color: '#be185d', bg: '#fdf2f8' },
  Others:      { emoji: '📦', color: '#374151', bg: '#f3f4f6' },
};
const GLOBAL_CATEGORIES = Object.keys(CATEGORY_MAPPING);
const PREMIUM_PLANS = ['Pro', 'Business', 'Premium', 'pro', 'business', 'premium'];
const toKm = (d) => (d == null || d === '' || d === 'undefined') ? 999 : Number(d);
const byDistance = (a, b) => {
  const da = toKm(a.distance), db = toKm(b.distance);
  if (da !== db) return da - db;
  const ap = PREMIUM_PLANS.includes(a.plan), bp = PREMIUM_PLANS.includes(b.plan);
  return ap === bp ? 0 : ap ? -1 : 1;
};

export default function MerchantDashboard({ defaultTab = 'overview' }) {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-955 p-6">
        <div className="w-8 h-8 rounded-lg bg-brand-green-50 flex items-center justify-center font-black text-brand-green-650 animate-spin mb-3">🏪</div>
        <h2 className="text-xs font-bold text-slate-455 font-outfit uppercase tracking-wider animate-pulse">Syncing environment...</h2>
      </div>
    }>
      <DashboardContent defaultTab={defaultTab} />
    </Suspense>
  );
}

function DashboardContent({ defaultTab = 'overview' }) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const actionParam = searchParams.get('action');

  const [activeTab, setActiveTab] = useState(defaultTab); // overview | discover | profile | products | banners | gallery | referrals

  // Sync activeTab when defaultTab prop changes from route component
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  useEffect(() => {
    if (tabParam && ['overview', 'products', 'profile', 'discover', 'referrals'].includes(tabParam)) {
      setActiveTab(tabParam);
      if (tabParam === 'products' && actionParam === 'add') {
        setTimeout(() => {
          handleOpenAddProduct();
        }, 150);
      }
    }
  }, [tabParam, actionParam]);

  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Search logic from items.js layout mapping
  const [searchQuery, setSearchQuery] = useState('');

  // Discover Local state variables
  const [discoverCoords, setDiscoverCoords] = useState({ lat: null, lon: null });
  const [discoverLocStatus, setDiscoverLocStatus] = useState('idle');
  const [discoverLocLabel, setDiscoverLocLabel] = useState('Set location');
  const [discoverShops, setDiscoverShops] = useState([]);
  const [loadingDiscover, setLoadingDiscover] = useState(false);
  const [discoverSearch, setDiscoverSearch] = useState('');
  const [discoverCategory, setDiscoverCategory] = useState('All');
  const [discoverRange, setDiscoverRange] = useState(5);
  const [discoverFeaturedBanners, setDiscoverFeaturedBanners] = useState([]);
  const [discoverActiveBanner, setDiscoverActiveBanner] = useState(0);
  const [discoverShopPage, setDiscoverShopPage] = useState(1);
  const [discoverProductPage, setDiscoverProductPage] = useState(1);

  // App Profile-style state variables for Merchant Profile tab
  const [profileAvatar, setProfileAvatar] = useState('male_1');
  const [profileShowFeedback, setProfileShowFeedback] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState('');
  const [profileSendingFeedback, setProfileSendingFeedback] = useState(false);
  const [profileShowSettings, setProfileShowSettings] = useState(false);
  const [shopForm, setShopForm] = useState({
    name: '',
    phone: '',
    whatsapp_number: '',
    address: '',
    latitude: '',
    longitude: '',
    description: '',
  });

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productForm, setProductForm] = useState({
    id: null,
    name: '',
    description: '',
    price: '',
    quantity: 0,
    track_quantity: false,
    imageFile: null,
    imagePreview: '',
  });
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(false);
  const [uploadMode, setUploadMode] = useState('item'); // cover | item | offer
  const [coverForm, setCoverForm] = useState({
    imageFile: null,
    imagePreview: '',
  });
  const [showQRModal, setShowQRModal] = useState(false);

  // Banners state
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    discount: '',
    template: 'green',
    imageFile: null,
    imagePreview: '',
  });
  const [creatingBanner, setCreatingBanner] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Gallery Cover states
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Check auth
  useEffect(() => {
    if (!user) {
      router.push('/merchant/login');
    }
  }, [user, router]);

  // Reset page sizes when filters alter
  useEffect(() => {
    setDiscoverShopPage(1);
    setDiscoverProductPage(1);
  }, [discoverSearch, discoverCategory, discoverRange]);

  // ─── GEOLOCATION AND DATA FETCH FOR DISCOVER ───
  const fetchDiscoverShops = useCallback(async (lat, lon) => {
    if (!lat || !lon) return;
    setLoadingDiscover(true);
    try {
      const rangeParam = discoverRange === 'All' ? '' : `&range=${discoverRange}`;
      const res = await api.get(`shops/?lat=${lat}&lon=${lon}${rangeParam}`);
      if (Array.isArray(res.data)) {
        setDiscoverShops(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDiscover(false);
    }
  }, [discoverRange]);

  const fetchDiscoverFeaturedBanners = useCallback(async (lat, lon) => {
    try {
      let url = 'banners/featured/';
      if (lat && lon) {
        url += `?lat=${lat}&lon=${lon}`;
      }
      const res = await api.get(url);
      if (Array.isArray(res.data)) {
        setDiscoverFeaturedBanners(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const requestDiscoverLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setDiscoverLocStatus('unavailable');
      return;
    }
    setDiscoverLocStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = String(pos.coords.latitude);
        const lon = String(pos.coords.longitude);
        const label = `${Number(lat).toFixed(2)}, ${Number(lon).toFixed(2)}`;
        setDiscoverCoords({ lat, lon });
        setDiscoverLocLabel(label);
        setDiscoverLocStatus('granted');
        
        // Cache location locally
        try {
          localStorage.setItem('dukand_coords', JSON.stringify({ lat, lon, label }));
        } catch (_) {}

        fetchDiscoverShops(lat, lon);
        fetchDiscoverFeaturedBanners(lat, lon);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setDiscoverLocStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  }, [fetchDiscoverShops, fetchDiscoverFeaturedBanners]);

  // Load cached location on mount if exists
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dukand_coords');
        if (saved) {
          const { lat, lon, label } = JSON.parse(saved);
          if (lat && lon) {
            setDiscoverCoords({ lat, lon });
            setDiscoverLocLabel(label || `${Number(lat).toFixed(2)}, ${Number(lon).toFixed(2)}`);
            setDiscoverLocStatus('granted');
            fetchDiscoverShops(lat, lon);
            fetchDiscoverFeaturedBanners(lat, lon);
          }
        }
      } catch (_) {}
    }
  }, [fetchDiscoverShops, fetchDiscoverFeaturedBanners]);

  // Autoplay carousel banner loop for featured campaigns matching app 6s interval
  useEffect(() => {
    if (discoverFeaturedBanners.length < 2) return;
    const interval = setInterval(() => {
      setDiscoverActiveBanner((prev) => (prev + 1) % discoverFeaturedBanners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [discoverFeaturedBanners]);

  // Fetch all dashboard stats and content from backend API
  const fetchDashboardData = useCallback(async (silent = false) => {
    if (!user?.user_id) return;
    if (!silent) setLoadingProducts(true);
    try {
      const res = await api.get(`merchant/dashboard/${user.user_id}/`);
      setDashboardData(res.data);
      
      // Initialize Shop form details
      if (res.data.shop) {
        const s = res.data.shop;
        setShopForm({
          name: s.name || '',
          phone: s.phone || '',
          whatsapp_number: s.whatsapp_number || '',
          address: s.address || '',
          latitude: s.latitude || '',
          longitude: s.longitude || '',
          description: s.description || '',
        });
        
        // Load products for the shop
        try {
          const itemsRes = await api.get(`items/${s.id}/`);
          setProducts(Array.isArray(itemsRes.data) ? itemsRes.data : []);
        } catch (err) {
          console.error(err);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoadingDashboard(false);
      setLoadingProducts(false);
      setRefreshing(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchDashboardData();
    });
  }, [fetchDashboardData]);

  // Handle explicit sync refresh trigger action from items.js
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  // Filtered computed list mapping logic from items.js
  const filteredProducts = useMemo(() => {
    return products.filter(item => 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  // App Profile handlers for Merchant
  useEffect(() => {
    if (activeTab === 'profile' && user?.user_id) {
      api.get(`user/${user.user_id}/`).then(res => {
        if (res.data.avatar) {
          setProfileAvatar(res.data.avatar);
        }
      }).catch(err => console.error(err));
    }
  }, [activeTab, user]);

  const handleUpdateProfileAvatar = async (key) => {
    if (!key) return;
    try {
      await api.post('avatar/update/', { avatar: key });
      setProfileAvatar(key);
      showToast('Avatar updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update avatar', 'error');
    }
  };

  const handleProfileFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!profileFeedback.trim()) return;
    setProfileSendingFeedback(true);
    try {
      await api.post('feedback/', { message: profileFeedback.trim() });
      setProfileFeedback('');
      setProfileShowFeedback(false);
      showToast('Feedback submitted successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to submit feedback', 'error');
    } finally {
      setProfileSendingFeedback(false);
    }
  };

  // Copy referral code
  const handleCopyReferral = () => {
    if (dashboardData?.referral_code) {
      navigator.clipboard.writeText(dashboardData.referral_code);
      showToast('Referral code copied!', 'success');
    }
  };

  // Update Shop Details PUT Api
  const handleUpdateShop = async (e) => {
    e.preventDefault();
    try {
      await api.put('/shop/update/', shopForm);
      showToast('Shop details updated successfully', 'success');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      showToast('Failed to update shop details', 'error');
    }
  };

  // Toggle open/closed status POST Api
  const handleStatusToggle = async () => {
    if (!dashboardData?.shop) return;
    const currentStatus = dashboardData.shop.is_open;
    const newStatus = currentStatus ? 'close' : 'open';
    
    try {
      await api.post('/shop/status/', {
        shop_id: dashboardData.shop.id,
        status: newStatus,
      });
      showToast(`Shop is now ${newStatus === 'open' ? 'OPEN' : 'CLOSED'}`, 'success');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      showToast('Failed to toggle status', 'error');
    }
  };

  // ==================== PRODUCT CRUD INTEGRATION ====================
  const handleOpenAddProduct = () => {
    setProductForm({
      id: null,
      name: '',
      description: '',
      price: '',
      quantity: 0,
      track_quantity: false,
      imageFile: null,
      imagePreview: '',
    });
    setCoverForm({
      imageFile: null,
      imagePreview: '',
    });
    setBannerForm({
      title: '',
      subtitle: '',
      discount: '',
      template: 'green',
      imageFile: null,
      imagePreview: '',
    });
    setUploadMode('item');
    setEditingProduct(false);
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod) => {
    setProductForm({
      id: prod.id,
      name: prod.name,
      description: prod.description || '',
      price: prod.price || '',
      quantity: prod.quantity || 0,
      track_quantity: prod.track_quantity || false,
      imageFile: null,
      imagePreview: prod.image || '',
    });
    setUploadMode('item');
    setEditingProduct(true);
    setProductModalOpen(true);
  };

  const handleCoverSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!coverForm.imageFile) {
      showToast('Please add a banner image to continue.', 'error');
      return;
    }
    const formData = new FormData();
    formData.append('image', coverForm.imageFile);
    setLoadingProducts(true);
    try {
      await api.post('/shop/media/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('Cover photo uploaded successfully', 'success');
      setProductModalOpen(false);
      setCoverForm({ imageFile: null, imagePreview: '' });
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      showToast('Failed to upload cover media', 'error');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) {
      showToast('Please fill in required fields', 'error');
      return;
    }

    const isPro = dashboardData?.shop?.plan === 'pro';
    const itemsCount = products.length;

    if (!isPro && itemsCount >= 15 && !editingProduct) {
      showToast('Limit reached! Standard plans can upload max 15 products. Upgrade to PRO.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('name', productForm.name);
    formData.append('description', productForm.description);
    formData.append('price', parseFloat(productForm.price));
    formData.append('quantity', parseInt(productForm.quantity));
    formData.append('track_quantity', productForm.track_quantity ? 'true' : 'false');
    
    if (productForm.imageFile) {
      formData.append('image', productForm.imageFile);
    }

    setLoadingProducts(true);
    try {
      if (editingProduct) {
        await api.put(`/item/update/${productForm.id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        showToast('Product updated successfully', 'success');
      } else {
        await api.post('/items/create/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        showToast('Product created successfully', 'success');
      }
      setProductModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      showToast('Failed to save product', 'error');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleDeleteProduct = async (prodId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/item/delete/${prodId}/`);
      showToast('Product deleted successfully', 'success');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete product', 'error');
    }
  };

  // ==================== BANNERS (OFFERS) MANAGEMENT ====================
  const handleBannerSubmit = async (e) => {
    e.preventDefault();
    if (!bannerForm.title || (!bannerForm.imageFile && !bannerForm.discount)) {
      showToast('Please provide a title and either a discount rate or banner image', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('title', bannerForm.title);
    formData.append('subtitle', bannerForm.subtitle);
    formData.append('discount', bannerForm.discount);
    formData.append('template', bannerForm.template);

    if (bannerForm.imageFile) {
      formData.append('image', bannerForm.imageFile);
    }

    setCreatingBanner(true);
    try {
      await api.post('/banner/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('New promotion banner created successfully', 'success');
      setBannerForm({
        title: '',
        subtitle: '',
        discount: '',
        template: 'green',
        imageFile: null,
        imagePreview: '',
      });
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      showToast('Failed to upload promotional offer', 'error');
    } finally {
      setCreatingBanner(false);
    }
  };

  const handleDeleteBanner = async (bannerId) => {
    try {
      await api.delete(`/banner/delete/${bannerId}/`);
      showToast('Promotion banner deleted successfully', 'success');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete banner', 'error');
    }
  };

  // ==================== GALLERY & COVERS ====================
  const handleGalleryUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploadingGallery(true);
    try {
      await api.post('/shop/media/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('Cover photo uploaded successfully', 'success');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      showToast('Failed to upload cover media', 'error');
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    try {
      await api.delete(`/shop/media/delete/${mediaId}/`);
      showToast('Cover photo removed', 'success');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      showToast('Failed to remove media', 'error');
    }
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(false);
        return;
      }
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlanUpgrade = async () => {
    try {
      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        showToast('Razorpay SDK failed to load. Please check your internet connection.', 'error');
        return;
      }

      // 1️⃣ Create order via backend API
      const res = await api.post('/payment/create-order/');
      const orderData = res.data;

      // 2️⃣ Open Razorpay Checkout
      const options = {
        key: orderData.key || 'rzp_test_XXXXXXXXXXXXXX',
        amount: orderData.amount,
        currency: 'INR',
        name: 'Dukan',
        description: 'Dukan Pro Plan',
        order_id: orderData.order_id,
        prefill: {
          email: user?.email || '',
          contact: '9999999999',
        },
        handler: async function (response) {
          // 3️⃣ Verify payment via backend API
          try {
            await api.post('/shop/upgrade/', {
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature
            });
            showToast('Upgrade Successful! Shop is now PRO. 🎉', 'success');
            fetchDashboardData();
          } catch (err) {
            console.error(err);
            showToast('Payment verification failed', 'error');
          }
        },
        theme: { color: '#2F5D50' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      showToast('Payment initialization failed', 'error');
    }
  };

  // ==================== LIFETIME QUANTITY TRACKING UNLOCK ====================
  const handleUnlockQuantityTracking = async () => {
    try {
      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        showToast('Razorpay SDK failed to load. Please check your internet connection.', 'error');
        return;
      }

      // 1️⃣ Create order via backend API
      const res = await api.post('/payment/quantity/create/');
      const orderData = res.data;

      // 2️⃣ Open Razorpay Checkout
      const options = {
        key: orderData.key || 'rzp_test_XXXXXXXXXXXXXX',
        amount: orderData.amount,
        currency: 'INR',
        name: 'Dukan',
        description: 'Inventory Management Unlock',
        order_id: orderData.order_id,
        prefill: {
          email: user?.email || '',
          contact: '',
        },
        handler: async function (response) {
          // 3️⃣ Verify payment via backend API
          try {
            await api.post('/payment/quantity/verify/', {
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature
            });
            showToast('Inventory Features Unlocked Across Ecosystem 🎉', 'success');
            fetchDashboardData();
          } catch (err) {
            console.error(err);
            showToast('Payment verification failed', 'error');
          }
        },
        theme: { color: '#147A5A' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      showToast('Payment initialization failed', 'error');
    }
  };
  const s = dashboardData?.shop || {};
  const stats = dashboardData?.stats || {};
  const gallery = dashboardData?.media || [];
  const bannersList = dashboardData?.banners || [];
  const isPro = s.plan === 'pro';
  
  // Checking whether the store has paid for the lifecycle feature unlock (mapped from products array flags in items.js)
  const hasQuantityTrackingFeature = products[0]?.shop_has_quantity_feature || s.shop_has_quantity_feature || false;



  if (loadingDashboard) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 p-6">
        <Store className="w-10 h-10 text-brand-green-600 animate-spin mb-3" />
        <h2 className="text-xs font-bold text-slate-400 font-outfit uppercase tracking-wider">Loading workspace...</h2>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white dark:bg-slate-950 flex flex-col md:flex-row pb-16 md:pb-0">
      
      {/* MOBILE BAR TOP HEADER STATUS */}
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex md:hidden justify-between items-center px-4 py-3.5 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-green-50 flex items-center justify-center font-black text-brand-green-600 text-xs">
            {s.name?.charAt(0)}
          </div>
          <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate max-w-[160px] font-outfit">{s.name}</span>
        </div>
      </div>

      {/* 1. SIDEBAR CONTAINER NAVIGATION */}
      <aside className={`fixed inset-y-0 left-0 transform ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative md:inset-auto md:transform-none md:sticky md:top-16 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 p-6 flex flex-col justify-between shrink-0 transition-transform duration-300 ease-in-out h-[calc(100vh-64px)] overflow-y-auto`}>
        <div className="space-y-6">
          {/* Shop Profile Widget */}
          <div className="border-b border-slate-100 dark:border-slate-800 pb-5 text-left hidden md:block">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-green-50 dark:bg-brand-green-950 flex items-center justify-center font-black text-brand-green-600 dark:text-brand-green-400 text-sm">
                {s.name?.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-bold text-slate-900 dark:text-white block truncate font-outfit">{s.name}</span>
                <span className="text-[10px] text-slate-400 font-bold block mt-0.5 uppercase tracking-wide">{s.category} Store</span>
              </div>
            </div>

            {/* Status toggle pill row */}
            <button 
              onClick={handleStatusToggle}
              className={`w-full mt-4 text-[10px] font-extrabold py-2 rounded-xl border text-center transition-all shadow-sm ${
                s.is_open 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/60'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/60'
              }`}
            >
              Shop Status: {s.is_open ? '● OPEN' : '○ CLOSED'}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 text-left">
            {[
              { id: 'overview', label: 'Home Dashboard', icon: TrendingUp, path: '/merchant/dashboard' },
              { id: 'discover', label: 'Discover Local', icon: Compass, path: '/merchant/dashboard?tab=discover' },
              { id: 'products', label: 'Inventory Catalog', icon: ShoppingBag, path: '/merchant/items' },
              { id: 'profile', label: 'Store Profile', icon: Store, path: '/merchant/profile' },
              { id: 'referrals', label: 'Invite & Upgrades', icon: Zap, path: '/merchant/dashboard?tab=referrals' },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    router.push(tab.path);
                    setMobileSidebarOpen(false);
                  }}
                  className={`items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    tab.id === 'discover' ? 'md:flex hidden' : 'flex'
                  } ${
                    activeTab === tab.id
                      ? 'bg-brand-green-600 text-white shadow-sm font-extrabold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-brand-green-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Workspace Footer Actions */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-2">
          <div className="md:hidden block mb-2">
            <button 
              onClick={handleStatusToggle}
              className={`w-full text-[10px] font-extrabold py-2 rounded-xl border text-center transition-all ${
                s.is_open ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}
            >
              Toggle Status: {s.is_open ? 'OPEN' : 'CLOSED'}
            </button>
          </div>

          <Link 
            href={`/shop/${s.id}`} 
            className="w-full text-center py-2.5 rounded-xl bg-brand-green-50 dark:bg-brand-green-950/40 text-brand-green-600 dark:text-brand-green-400 font-bold text-[11px] tracking-wide transition-colors border border-brand-green-100/40"
          >
            Visit Public Storefront
          </Link>
          <button 
            onClick={() => {
              logout();
              router.push('/');
            }} 
            className="w-full text-center py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold text-[11px] transition-colors flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout Portal</span>
          </button>
        </div>
      </aside>

      {/* OVERLAY WRAPPER FOR SIDEBAR DISMISSAL */}
      {mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)} 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
        />
      )}
      <main className="flex-grow p-4 sm:p-8 max-w-5xl mx-auto w-full text-left">
        
        {/* Permanent App Header shown on Home/Discover views exactly like the screenshot */}
        {(activeTab === 'overview' || activeTab === 'discover') && (
          <>
            <div className="flex justify-between items-center gap-4 pb-4 text-left">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest block font-sans">GOOD MORNING</span>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white font-outfit mt-0.5">Merchant Portal</h2>
              </div>
              <Link
                href="/"
                className="w-10 h-10 rounded-full bg-[#0d1f19] dark:bg-slate-900 flex items-center justify-center shadow-md transition-all hover:scale-105"
                title="Visit Customer View"
              >
                <span className="text-white text-base">🏪</span>
              </Link>
            </div>

            {/* Sub-tab selection bar matching screenshot */}
            <div className="bg-slate-105 dark:bg-slate-900/65 p-1 rounded-2xl flex gap-1 mb-6 max-w-md border border-slate-200/20 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
                  activeTab === 'overview'
                    ? 'bg-[#2F5D50] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>My Dashboard</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('discover')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
                  activeTab === 'discover'
                    ? 'bg-[#2F5D50] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>Discover Local</span>
              </button>
            </div>
          </>
        )}

        <AnimatePresence mode="wait">
          
          {/* TAB SHELF 1: OVERVIEW ENGINE */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview-tab"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="space-y-6"
            >
              {/* Shop Hero Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-green-900 flex items-center justify-center font-black text-white text-lg shrink-0">
                    {s.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white font-outfit truncate max-w-[200px] sm:max-w-xs">{s.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${s.is_open ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`} />
                      <span className={`text-xs font-bold ${s.is_open ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                        {s.is_open ? 'Open for business' : 'Closed'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={handleStatusToggle}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-xs font-black tracking-wider uppercase transition-all shadow-xs shrink-0 ${
                    s.is_open 
                      ? 'bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60'
                      : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/20 text-brand-green-700 dark:text-brand-green-400 border-emerald-200 dark:border-brand-green-900/60'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${s.is_open ? 'bg-red-500' : 'bg-brand-green-650'}`} />
                  <span>{s.is_open ? 'Close Shop' : 'Open Shop'}</span>
                </button>
              </div>

              {/* Stats Row */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-around divide-x divide-slate-100 dark:divide-slate-800">
                <div className="flex flex-col items-center flex-1 gap-1 text-center">
                  <div className="w-8 h-8 rounded-lg bg-brand-green-50 dark:bg-brand-green-950/40 flex items-center justify-center text-brand-green-600 dark:text-brand-green-400 mb-1">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <span className="text-xl font-black text-slate-900 dark:text-white font-outfit">{gallery.length}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Posts</span>
                </div>
                <div className="flex flex-col items-center flex-1 gap-1 text-center">
                  <div className="w-8 h-8 rounded-lg bg-brand-green-50 dark:bg-brand-green-950/40 flex items-center justify-center text-brand-green-600 dark:text-brand-green-400 mb-1">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-xl font-black text-slate-900 dark:text-white font-outfit">{stats.followers || 0}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Followers</span>
                </div>
                <div className="flex flex-col items-center flex-1 gap-1 text-center">
                  <div className="w-8 h-8 rounded-lg bg-brand-green-50 dark:bg-brand-green-950/40 flex items-center justify-center text-brand-green-600 dark:text-brand-green-400 mb-1">
                    <Eye className="w-4 h-4" />
                  </div>
                  <span className="text-xl font-black text-slate-900 dark:text-white font-outfit">{stats.views || 0}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Views</span>
                </div>
              </div>



              {/* Quick Actions Row */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Quick Actions</h4>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      const fileInput = document.getElementById('dashboard-gallery-file-input');
                      if (fileInput) fileInput.click();
                    }}
                    className="bg-brand-green-950 hover:bg-slate-950 dark:bg-slate-900 dark:hover:bg-slate-800 border border-transparent dark:border-slate-800 text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all shadow-sm text-center"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-bold tracking-wide uppercase">New Post</span>
                  </button>
                  
                  <Link
                    href={`/shop/${s.id}`}
                    target="_blank"
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all shadow-sm text-center"
                  >
                    <div className="w-9 h-9 rounded-xl bg-brand-green-50 dark:bg-brand-green-950 flex items-center justify-center">
                      <Store className="w-5 h-5 text-brand-green-600 dark:text-brand-green-400" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 tracking-wide uppercase">Store</span>
                  </Link>

                  <button
                    onClick={() => setActiveTab('profile')}
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all shadow-sm text-center"
                  >
                    <div className="w-9 h-9 rounded-xl bg-brand-green-50 dark:bg-brand-green-950 flex items-center justify-center">
                      <Edit className="w-5 h-5 text-brand-green-600 dark:text-brand-green-400" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 tracking-wide uppercase">Settings</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Sponsored Promotion AdBanner matching Mobile Spacing */}
              <AdBanner />

              {/* Banners carousel block */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Banners</h4>
                    {bannersList.length > 0 && (
                      <span className="text-[10px] font-black bg-brand-green-50 text-brand-green-700 px-2 py-0.5 rounded-full">{bannersList.length}</span>
                    )}
                  </div>
                  {isPro && (
                    <button
                      onClick={() => setCreatingBanner(!creatingBanner)}
                      className="text-xs font-black text-brand-green-600 hover:text-brand-green-700 flex items-center gap-1"
                    >
                      {creatingBanner ? 'Dismiss Upload' : '+ Upload Promotion'}
                    </button>
                  )}
                </div>

                {/* Creating Banner Inline Form */}
                {creatingBanner && (
                  <form onSubmit={handleBannerSubmit} className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 p-4 rounded-2xl flex flex-col gap-3 shadow-inner">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Campaign Headline *</label>
                        <input
                          type="text" required
                          value={bannerForm.title}
                          onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                          placeholder="e.g. Mega Clearance Sale"
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Subtext Line</label>
                        <input
                          type="text"
                          value={bannerForm.subtitle}
                          onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                          placeholder="e.g. Valid until Sunday midnight"
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Discount Rate</label>
                        <input
                          type="text"
                          value={bannerForm.discount}
                          onChange={(e) => setBannerForm({ ...bannerForm, discount: e.target.value })}
                          placeholder="e.g. 50% OFF"
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Cover Graphic Image</label>
                        <input
                          type="file" accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setBannerForm({
                                ...bannerForm,
                                imageFile: file,
                                imagePreview: URL.createObjectURL(file)
                              });
                            }
                          }}
                          className="w-full text-[10px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-slate-100 dark:file:bg-slate-800 cursor-pointer"
                        />
                      </div>
                    </div>
                    {bannerForm.imagePreview && (
                      <div className="relative aspect-video max-w-[240px] rounded-xl overflow-hidden border">
                        <img src={bannerForm.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <button
                      type="submit"
                      className="w-full bg-brand-green-600 hover:bg-brand-green-700 text-white font-black text-xs py-2.5 rounded-xl transition-all"
                    >
                      Publish Banner
                    </button>
                  </form>
                )}

                {/* Horizontally scrolling list of banners */}
                {!isPro ? (
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-6 rounded-2xl text-center flex flex-col items-center">
                    <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
                    <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-outfit">Promotion Features Locked</h5>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                      Marketing banners require a Pro upgrade. Get active banner ranking placements now!
                    </p>
                    <button 
                      onClick={() => setShowUpgradeModal(true)}
                      className="mt-3 bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold text-[10px] px-4 py-2 rounded-xl uppercase tracking-wider shadow-sm transition-all"
                    >
                      Upgrade to Pro
                    </button>
                  </div>
                ) : bannersList.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-200/60 dark:border-slate-800 rounded-2xl text-xs text-slate-400">
                    No promotional banners active. Click &quot;+ Upload Promotion&quot; to add one.
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar scroll-smooth snap-x">
                    {bannersList.map((banner) => (
                      <div 
                        key={banner.id} 
                        className="snap-start shrink-0 w-72 h-36 rounded-2xl relative overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800"
                      >
                        {banner.image ? (
                          <img src={banner.image} className="w-full h-full object-cover" alt="Campaign Banner" />
                        ) : (
                          <div className="w-full h-full bg-brand-green-700 text-white p-5 flex flex-col justify-between text-left">
                            <div>
                                {banner.discount && <span className="text-[9px] uppercase font-black bg-brand-green-950 text-brand-green-200 px-2 py-0.5 rounded-full tracking-wider inline-block mb-1">{banner.discount}</span>}
                              <h5 className="font-black text-sm text-white truncate leading-snug">{banner.title}</h5>
                            </div>
                            <p className="text-[10px] text-white/80 truncate">{banner.subtitle}</p>
                          </div>
                        )}
                        
                        {/* Delete Badge */}
                        <button
                          onClick={() => handleDeleteBanner(banner.id)}
                          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/45 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
                          title="Remove Banner"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Gallery posts block */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Gallery</h4>
                    {gallery.length > 0 && (
                      <span className="text-[10px] font-black bg-brand-green-50 text-brand-green-700 px-2 py-0.5 rounded-full">{gallery.length}</span>
                    )}
                  </div>

                  {/* File upload label triggers dynamic media upload */}
                  <label className="text-xs font-black text-brand-green-600 hover:text-brand-green-700 cursor-pointer flex items-center gap-1">
                    <span>{uploadingGallery ? 'Uploading...' : '+ Upload Photo'}</span>
                    <input 
                      id="dashboard-gallery-file-input"
                      type="file" 
                      accept="image/*" 
                      disabled={uploadingGallery} 
                      onChange={handleGalleryUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>

                {gallery.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-200/60 dark:border-slate-800 rounded-2xl text-xs text-slate-400">
                    No gallery photos uploaded. Click &quot;+ Upload Photo&quot; to add one.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {gallery.map((img) => (
                      <div key={img.id} className="aspect-square rounded-2xl overflow-hidden bg-slate-50 border dark:border-slate-800 relative group shadow-sm">
                        <img src={img.image} className="w-full h-full object-cover" alt="Gallery cover item" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => handleDeleteMedia(img.id)}
                            className="bg-white text-red-600 p-2.5 rounded-xl shadow-md hover:scale-105 transition-transform"
                            title="Remove Post"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB SHELF 1.5: DISCOVER LOCAL Tab implementation */}
          {activeTab === 'discover' && (
            <motion.div
              key="discover-tab"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="space-y-6"
            >
              {/* Toolbar Section matching Screenshot 2 location indicator row */}
              <div className="flex items-center gap-2 pb-1 text-left">
                {/* Location indicator pill */}
                <button
                  onClick={requestDiscoverLocation}
                  className={`flex-grow flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all shadow-2xs ${
                    discoverLocStatus === 'granted'
                      ? 'bg-emerald-50/50 dark:bg-brand-green-950/20 border-emerald-100/60 dark:border-brand-green-900/40 text-brand-green-700 dark:text-brand-green-400'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-brand-green-600 dark:text-brand-green-400 shrink-0" />
                    <span className="text-[11px] font-bold font-outfit truncate">
                      {discoverLocStatus === 'requesting' ? 'Locating...' : discoverLocLabel === 'Set location' ? 'Nagaland' : discoverLocLabel}
                    </span>
                  </div>
                  <RefreshCw className={`w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0 ml-2 ${discoverLocStatus === 'requesting' ? 'animate-spin' : ''}`} />
                </button>

                {/* Favorites button */}
                <Link
                  href="/favorites"
                  className="w-10 h-10 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-[#2F5D50] hover:bg-slate-50 transition-colors shadow-2xs shrink-0"
                  title="View Favorite Shops"
                >
                  <Heart className="w-4 h-4 fill-current" />
                </Link>
              </div>

              {/* Location permission fallback CTA when location not shared */}
              {discoverLocStatus !== 'granted' && (
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center max-w-md mx-auto space-y-4 shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-brand-green-50 dark:bg-brand-green-950 flex items-center justify-center text-brand-green-600 dark:text-brand-green-400 mx-auto">
                    <Navigation className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-outfit">Enable Location Services</h3>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                    To discover stores, matching products, and real-time inventory in your vicinity, please allow access to your device location.
                  </p>
                  <button
                    onClick={requestDiscoverLocation}
                    disabled={discoverLocStatus === 'requesting'}
                    className="w-full bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {discoverLocStatus === 'requesting' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Detecting Location...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-4 h-4" />
                        <span>Share Location</span>
                      </>
                    )}
                  </button>
                  {discoverLocStatus === 'denied' && (
                    <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider mt-2.5">
                      Permission Denied. Please enable location permissions in browser settings.
                    </p>
                  )}
                </div>
              )}

              {/* Primary discover views when location coordinates unlocked */}
              {discoverLocStatus === 'granted' && (
                <div className="space-y-6">
                  
                  {/* Search input field and distance slider row */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                      <input 
                        type="text"
                        placeholder="Search nearby stores or product items..."
                        value={discoverSearch}
                        onChange={(e) => setDiscoverSearch(e.target.value)}
                        className="w-full text-xs pl-10 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200/80 dark:border-slate-800 text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-brand-green-600/50"
                      />
                      {discoverSearch && (
                        <button 
                          onClick={() => setDiscoverSearch('')}
                          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-650"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Radius Slider selection mapping from app RANGES */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Search Range Horizon</span>
                      <div className="flex items-center gap-1.5">
                        {[1, 5, 10, 25, 'All'].map((r) => (
                          <button
                            key={r}
                            onClick={() => {
                              setDiscoverRange(r);
                              // Trigger reload on next cycle
                              setTimeout(() => fetchDiscoverShops(discoverCoords.lat, discoverCoords.lon), 50);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                              discoverRange === r
                                ? 'bg-brand-green-600 border-transparent text-white shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-955 border-slate-100 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {r === 'All' ? 'Infinite' : `${r} km`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Scrollable Category Selector Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                    {GLOBAL_CATEGORIES.map((catName) => {
                      const mapping = CATEGORY_MAPPING[catName] || CATEGORY_MAPPING.Others;
                      const active = discoverCategory === catName;
                      return (
                        <button
                          key={catName}
                          onClick={() => setDiscoverCategory(catName)}
                          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-xs font-bold transition-all shrink-0 ${
                            active
                              ? 'bg-brand-green-600 border-transparent text-white shadow-sm font-extrabold'
                              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <span className="text-sm shrink-0">{mapping.emoji}</span>
                          <span>{catName}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* ── AUTOPLAY FEATURED CAMPAIGNS CAROUSEL ── */}
                  {discoverFeaturedBanners.length > 0 && (
                    <div className="relative">
                      <div className="relative overflow-hidden aspect-[2.85/1] sm:aspect-[21/9] md:h-[220px] md:aspect-auto rounded-2xl border border-white/10 shadow-sm bg-[#094E38] text-white">
                        {/* Active Slide Renderer */}
                        {(() => {
                          const b = discoverFeaturedBanners[discoverActiveBanner];
                          if (!b) return null;
                          return (
                            <motion.div 
                              key={`banner-slide-${b.id}`}
                              initial={{ opacity: 0.6 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.4 }}
                              className="absolute inset-0 w-full h-full p-4 sm:p-7 flex flex-col justify-between overflow-hidden"
                              style={b.background_color && b.background_color !== '#0f3d28' ? { backgroundColor: b.background_color } : { backgroundColor: '#094E38' }}
                            >
                              {b.image && (
                                <>
                                  <img src={b.image} alt={b.title} className="absolute inset-0 w-full h-full object-cover z-0" />
                                  <div className="absolute inset-0 bg-black/55 z-10" />
                                </>
                              )}
                              
                              {/* Storefront background icon */}
                              <div className="absolute right-4 bottom-2.5 sm:right-6 sm:bottom-6 z-10 text-white/[0.12] dark:text-white/[0.08] pointer-events-none">
                                <Store className="w-14 h-14 sm:w-24 sm:h-24 stroke-[1.2]" />
                              </div>

                              {/* External Link/Share icon in top right */}
                              {b.link && (
                                <Link 
                                  href={b.link} 
                                  target="_blank"
                                  className="absolute top-3 right-3 z-30 flex items-center justify-center w-6 h-6 sm:w-9 sm:h-9 rounded-md bg-white/[0.08] hover:bg-white/[0.16] border border-white/15 text-white transition-all active:scale-95 shadow-sm"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-white" />
                                </Link>
                              )}
                              
                              <div className="z-20 relative text-left">
                                <span className="text-[7.5px] sm:text-[9.5px] uppercase font-semibold text-[#BDE2D7] block tracking-[0.14em] leading-none font-sans">
                                  {b.small_text || 'SAVE YOUR TIME, ENERGY AND MONEY.'}
                                </span>
                                <h3 className="font-black text-lg sm:text-2xl mt-2 leading-none font-outfit max-w-lg text-white tracking-[0.05em]">
                                  {(b.title && b.title !== 'MYDUKAN' && b.title !== 'Dukan') ? b.title : 'mydukan'}
                                </h3>
                                {b.discount && (
                                  <span className="inline-block mt-1 bg-brand-green-600/90 text-white text-[7px] font-black uppercase tracking-wider px-1 py-0.5 rounded leading-none">
                                    {b.discount}
                                  </span>
                                )}
                              </div>

                              <div className="z-20 relative text-left flex justify-between items-end gap-3">
                                <p className="text-[8px] sm:text-[10px] text-white/95 tracking-[0.12em] font-extrabold leading-none font-sans truncate max-w-[200px] sm:max-w-md">
                                  {b.subtitle && b.subtitle !== 'MAKE LOCAL SHOPPING EASY' ? b.subtitle : 'Make your local shopping easy nextime'}
                                </p>
                              </div>
                            </motion.div>
                          );
                        })()}
                      </div>

                      {/* Dots Navigation indicator row below the card */}
                      {discoverFeaturedBanners.length > 1 && (
                        <div className="flex items-center justify-center gap-1.5 mt-3.5">
                          {discoverFeaturedBanners.map((_, i) => (
                            <button
                              key={`dot-${i}`}
                              onClick={() => setDiscoverActiveBanner(i)}
                              className={`rounded-full transition-all duration-300 ${
                                i === discoverActiveBanner ? 'bg-[#0A5C43] w-4 h-1' : 'bg-[#0A5C43]/20 w-1.5 h-1'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* COMPUTED COMBINED FILTERS LOGIC */}
                  {(() => {
                    const q = discoverSearch.toLowerCase().trim();
                    const cutoff = discoverRange !== 'All' ? Number(discoverRange) : null;
                    
                    // Filter Shops
                    const openNowFiltered = discoverShops.filter((shop) => {
                      if (!shop.is_open) return false;
                      if (discoverCategory !== 'All' && shop.category !== discoverCategory) return false;
                      if (cutoff != null && toKm(shop.distance) > cutoff) return false;
                      if (q) {
                        return shop.name?.toLowerCase().includes(q) || shop.category?.toLowerCase().includes(q);
                      }
                      return true;
                    }).sort(byDistance);

                    const allNearbyFiltered = discoverShops.filter((shop) => {
                      if (discoverCategory !== 'All' && shop.category !== discoverCategory) return false;
                      if (cutoff != null && toKm(shop.distance) > cutoff) return false;
                      if (q) {
                        return shop.name?.toLowerCase().includes(q) || shop.category?.toLowerCase().includes(q);
                      }
                      return true;
                    }).sort(byDistance);

                    // Extract products matching search filters
                    const productFiltered = [];
                    discoverShops.forEach((shop) => {
                      if (cutoff != null && toKm(shop.distance) > cutoff) return;
                      if (discoverCategory !== 'All' && shop.category !== discoverCategory) return;
                      
                      (shop.items || []).forEach((item) => {
                        if (q && !item.name?.toLowerCase().includes(q)) return;
                        productFiltered.push({
                          ...item,
                          shopId: shop.id,
                          shopName: shop.name,
                          distance: shop.distance,
                          shop_is_open: shop.is_open
                        });
                      });
                    });
                    productFiltered.sort(byDistance);

                    return (
                      <div className="space-y-6">
                        
                        {/* ── OPEN NOW SECTION ── */}
                        <div>
                          <div className="flex items-center gap-2 mb-3.5">
                            <Clock className="w-4 h-4 text-brand-green-600" />
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-outfit">Open Now Nearby</h3>
                            <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-extrabold text-[9px] px-2 py-0.5 rounded-full">
                              {openNowFiltered.length} Open
                            </span>
                          </div>

                          {loadingDiscover ? (
                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider py-8 text-center animate-pulse">Syncing nearby maps...</div>
                          ) : openNowFiltered.length === 0 ? (
                            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl text-center text-slate-400 text-[11px] font-medium border dark:border-slate-800">
                              No stores currently operating open in this horizon range.
                            </div>
                          ) : (
                            <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                              {openNowFiltered.map((shop) => {
                                const isPremium = PREMIUM_PLANS.includes(shop.plan);
                                const meta = CATEGORY_MAPPING[shop.category] || CATEGORY_MAPPING.Others;
                                return (
                                  <Link 
                                    key={`open-${shop.id}`} 
                                    href={`/shop/${shop.id}`}
                                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl shadow-xs w-48 shrink-0 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors block text-left font-sans"
                                  >
                                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950 relative border dark:border-slate-850">
                                      {shop.cover_image || shop.image ? (
                                        <img src={shop.cover_image || shop.image} alt={shop.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl bg-brand-green-50 dark:bg-brand-green-950/20">{meta.emoji}</div>
                                      )}
                                      <div className="absolute bottom-2 left-2 bg-emerald-500/95 text-white font-black text-[9px] px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                        <span>Open</span>
                                      </div>
                                      {isPremium && (
                                        <span className="absolute top-2 right-2 bg-brand-green-600 text-white font-black text-[8px] uppercase px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                          <Award className="w-2 h-2 text-white" /> PRO
                                        </span>
                                      )}
                                    </div>
                                    <div className="mt-2.5">
                                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate font-outfit leading-tight">{shop.name}</h4>
                                      <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">{shop.category}</span>
                                      {shop.distance && (
                                        <span className="inline-block mt-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-355 text-[9px] font-black px-2 py-0.5 rounded">
                                          {shop.distance < 1 ? `Nearby (${Math.round(shop.distance * 1000)}m)` : `Approx. ${Number(shop.distance).toFixed(1)} km`}
                                        </span>
                                      )}
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* ── STORES AND PRODUCTS GRID MAPPING ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                          
                          {/* Store Grid Panel */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Store className="w-4 h-4 text-brand-green-600" />
                                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-outfit">Stores Directory</h3>
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{allNearbyFiltered.length} Found</span>
                            </div>

                            {loadingDiscover ? (
                              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider py-8 text-center animate-pulse">Scanning nearby stores...</div>
                            ) : allNearbyFiltered.length === 0 ? (
                              <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl text-center text-slate-400 text-[11px] font-medium border dark:border-slate-800">
                                No stores found matching these categories.
                              </div>
                            ) : (
                              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                                {allNearbyFiltered.slice(0, discoverShopPage * 10).map((shop) => {
                                  const isPremium = PREMIUM_PLANS.includes(shop.plan);
                                  const meta = CATEGORY_MAPPING[shop.category] || CATEGORY_MAPPING.Others;
                                  return (
                                    <Link
                                      key={shop.id}
                                      href={`/shop/${shop.id}`}
                                      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left block"
                                    >
                                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950 shrink-0 relative border dark:border-slate-850 flex items-center justify-center">
                                        {shop.cover_image || shop.image ? (
                                          <img src={shop.cover_image || shop.image} alt={shop.name} className="w-full h-full object-cover" />
                                        ) : (
                                          <span className="text-xl">{meta.emoji}</span>
                                        )}
                                      </div>
                                      <div className="flex-grow min-w-0 flex flex-col justify-between">
                                        <div>
                                          <div className="flex items-center gap-1.5">
                                            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate font-outfit leading-tight">{shop.name}</h4>
                                            {isPremium && (
                                              <span className="bg-brand-green-600/10 text-brand-green-600 text-[7px] font-black uppercase px-1 rounded flex items-center gap-0.5 shrink-0">
                                                PRO
                                              </span>
                                            )}
                                          </div>
                                          <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">{shop.category}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {shop.distance && (
                                            <span className="text-[9px] font-black text-slate-500 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                              {shop.distance < 1 ? `Nearby (${Math.round(shop.distance * 1000)}m)` : `Approx. ${Number(shop.distance).toFixed(1)} km`}
                                            </span>
                                          )}
                                          <span className={`text-[9px] font-bold ${shop.is_open ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            {shop.is_open ? '● Open' : 'Closed'}
                                          </span>
                                        </div>
                                      </div>
                                    </Link>
                                  );
                                })}

                                {allNearbyFiltered.length > discoverShopPage * 10 && (
                                  <button
                                    onClick={() => setDiscoverShopPage((p) => p + 1)}
                                    className="w-full text-center py-2.5 rounded-xl border border-slate-150 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 transition-colors"
                                  >
                                    Load More Stores
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Product Grid Panel */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4 text-brand-green-600" />
                                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-outfit">Local Marketplace</h3>
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{productFiltered.length} Goods</span>
                            </div>

                            {loadingDiscover ? (
                              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider py-8 text-center animate-pulse">Scouring local catalog...</div>
                            ) : productFiltered.length === 0 ? (
                              <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl text-center text-slate-400 text-[11px] font-medium border dark:border-slate-800">
                                No products catalogued matching filters.
                              </div>
                            ) : (
                              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                                {productFiltered.slice(0, discoverProductPage * 10).map((prod) => (
                                  <Link
                                    key={prod.id}
                                    href={`/shop/${prod.shopId}`}
                                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left block"
                                  >
                                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950 shrink-0 relative border dark:border-slate-850 flex items-center justify-center">
                                      {prod.image ? (
                                        <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <ShoppingBag className="w-6 h-6 text-slate-300" />
                                      )}
                                      {prod.price && (
                                        <span className="absolute bottom-1 left-1 bg-slate-955/80 backdrop-blur-sm text-white font-black text-[8px] px-1.5 py-0.5 rounded">
                                          ₹{Number(prod.price).toFixed(0)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex-grow min-w-0 flex flex-col justify-between">
                                      <div>
                                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate font-outfit leading-tight">{prod.name}</h4>
                                        <span className="text-[10px] text-slate-400 block mt-0.5 font-medium truncate">from {prod.shopName}</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        {prod.distance && (
                                          <span className="text-[9px] font-black text-slate-500 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                            {prod.distance < 1 ? `Nearby (${Math.round(prod.distance * 1000)}m)` : `Approx. ${Number(prod.distance).toFixed(1)} km`}
                                          </span>
                                        )}
                                        {prod.track_quantity && (
                                          <span className={`text-[8px] font-black uppercase px-1 rounded ${
                                            prod.quantity_status === 'out' 
                                              ? 'bg-red-55 text-red-600 border border-red-100/50' 
                                              : prod.quantity_status === 'low' 
                                                ? 'bg-amber-55 text-amber-600 border border-amber-100/50' 
                                                : 'bg-emerald-55 text-emerald-600 border border-emerald-100/50'
                                          }`}>
                                            {prod.quantity_status === 'out' ? 'Out of stock' : prod.quantity_status === 'low' ? 'Low Stock' : 'In stock'}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </Link>
                                ))}

                                {productFiltered.length > discoverProductPage * 10 && (
                                  <button
                                    onClick={() => setDiscoverProductPage((p) => p + 1)}
                                    className="w-full text-center py-2.5 rounded-xl border border-slate-150 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 transition-colors"
                                  >
                                    Load More Goods
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile-tab"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="space-y-6 max-w-2xl mx-auto"
            >
              {/* Profile Title Header */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center text-left">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white font-outfit">Merchant Panel</h2>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">Manage your shop details, billing, and settings.</p>
                </div>
              </div>

              {/* HERO CARD */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-[#2F5D50] flex items-center justify-center font-black text-white text-lg shrink-0">
                    {s.name?.[0]?.toUpperCase() || 'D'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white font-outfit truncate">{s.name}</h3>
                    <div className="inline-block mt-1 bg-[#EDF4ED] dark:bg-emerald-950/20 text-[#2F5D50] dark:text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {s.category || 'General'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <div className="bg-[#F5F8F5] dark:bg-slate-950/60 rounded-2xl p-3 flex flex-col items-center justify-center text-center border border-slate-100 dark:border-slate-900/60">
                    <Users className="w-4 h-4 text-[#2F5D50] mb-1" />
                    <span className="text-sm font-black text-slate-900 dark:text-white font-outfit">{stats.followers || 0}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Followers</span>
                  </div>
                  <div className="bg-[#F5F8F5] dark:bg-slate-950/60 rounded-2xl p-3 flex flex-col items-center justify-center text-center border border-slate-100 dark:border-slate-900/60">
                    <ShoppingBag className="w-4 h-4 text-[#2F5D50] mb-1" />
                    <span className="text-sm font-black text-slate-900 dark:text-white font-outfit">{products.length}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Items</span>
                  </div>
                  <div className="bg-[#F5F8F5] dark:bg-slate-950/60 rounded-2xl p-3 flex flex-col items-center justify-center text-center border border-slate-100 dark:border-slate-900/60">
                    <Eye className="w-4 h-4 text-[#2F5D50] mb-1" />
                    <span className="text-sm font-black text-slate-900 dark:text-white font-outfit">{stats.views || 0}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Views</span>
                  </div>
                </div>
              </div>

              {/* PLAN CARD */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isPro 
                  ? 'bg-[#2F5D50]/5 dark:bg-[#2F5D50]/15 border-[#2F5D50] dark:border-emerald-800' 
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="bg-[#2F5D50]/10 dark:bg-emerald-950/30 rounded-full px-3 py-1 text-[10px] font-black text-[#2F5D50] dark:text-emerald-450 uppercase tracking-wider">
                    {isPro ? 'PRO PLAN' : 'FREE PLAN'}
                  </div>
                  {!isPro && (
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="bg-[#2F5D50] hover:bg-[#1A6B3A] text-white text-[11px] font-black px-3.5 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1"
                    >
                      <span>Upgrade</span>
                      <span>🚀</span>
                    </button>
                  )}
                </div>
              </div>
 
              {/* ONDC NETWORKING INTEGRATION CARD */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 text-left space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-[#0F2118] dark:text-white font-outfit">ONDC Network Visibility</h4>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-450 border border-emerald-250/20 text-[9px] font-black uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-slate-450 dark:text-slate-400 font-medium leading-relaxed">
                  Your store is registered on the ONDC registry protocol. Customers across buyer apps on the ONDC network can discover and view your menu.
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400">
                  <span>Registry Node:</span>
                  <span className="font-extrabold text-[#2F5D50] dark:text-emerald-400 font-mono">mydukan.ondc.gateway</span>
                </div>
              </div>

              {/* REFERRAL CARD */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 text-left space-y-4 shadow-sm">
                <h4 className="text-sm font-black text-[#0F2118] dark:text-white font-outfit">Refer & Earn Pro</h4>
                
                <div className="space-y-1.5">
                  <div className="w-full bg-[#EDF4ED] dark:bg-slate-950 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#2F5D50] rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(((dashboardData?.referral_count || 0) / 3) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#4A6B55] dark:text-slate-400 font-bold">
                    {dashboardData?.referral_count || 0}/3 Friends Invited
                  </p>
                </div>

                <button
                  onClick={handleCopyReferral}
                  className="w-full bg-[#2F5D50] hover:bg-[#1A6B3A] text-white font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Invite Merchants</span>
                </button>
              </div>

              {/* QR TRIGGER BUTTON */}
              <button
                onClick={() => setShowQRModal(true)}
                className="w-full bg-[#0F2118] hover:bg-[#1b4d3e] text-white font-black text-xs py-3.5 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-sm uppercase tracking-wider"
              >
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Show My Shop QR</span>
              </button>

              {/* QR CODE MODAL */}
              {showQRModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs transition-opacity duration-200">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xs p-6 shadow-2xl flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex flex-col items-center text-center space-y-2.5 pt-2">
                      <div className="w-12 h-12 rounded-2xl bg-[#2F5D50]/8 flex items-center justify-center">
                        <Store className="w-6 h-6 text-[#2F5D50] dark:text-emerald-450" />
                      </div>
                      <h4 className="text-sm font-black text-[#0F2118] dark:text-white uppercase tracking-wider">Scan to visit our shop</h4>
                      <p className="text-xs font-bold text-slate-400 truncate max-w-[200px]">{s.name}</p>
                    </div>

                    <div className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin + '/shop/' + s.id : 'https://dukan.app/shop/' + s.id)}`} 
                        alt="Shop QR Code" 
                        className="w-44 h-44 object-contain bg-white" 
                      />
                    </div>

                    <p className="text-[10px] text-slate-400 font-bold">Powered by Dukan · Shop Smart</p>

                    <div className="w-full flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <a
                        href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin + '/shop/' + s.id : 'https://dukan.app/shop/' + s.id)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-[#2F5D50] hover:bg-[#1A6B3A] text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-xs text-center block"
                      >
                        Open QR Code Link
                      </a>
                      <button
                        onClick={() => setShowQRModal(false)}
                        className="w-full py-2.5 text-center text-xs font-bold text-slate-400 hover:text-slate-650 dark:hover:text-slate-350 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* BUSINESS SETTINGS SECTION */}
              <div className="space-y-2.5 text-left">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Settings</h4>
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-850">
                  
                  {/* Edit Shop Profile */}
                  <button
                    type="button"
                    onClick={() => setProfileShowSettings(!profileShowSettings)}
                    className="w-full flex items-center gap-3.5 px-4.5 py-4 hover:bg-slate-50 dark:hover:bg-slate-950/60 transition-colors text-left group"
                  >
                    <div className="w-8.5 h-8.5 rounded-xl bg-[#2F5D50]/8 text-[#2F5D50] flex items-center justify-center shrink-0">
                      <Edit className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="text-xs font-black text-[#0F2118] dark:text-white">Edit Shop Profile</h4>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${profileShowSettings ? 'rotate-90' : 'group-hover:translate-x-0.5'}`} />
                  </button>

                  {/* Add Shop Photos */}
                  <button
                    type="button"
                    onClick={() => {
                      setUploadMode('cover');
                      setProductModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3.5 px-4.5 py-4 hover:bg-slate-50 dark:hover:bg-slate-950/60 transition-colors text-left group"
                  >
                    <div className="w-8.5 h-8.5 rounded-xl bg-[#2F5D50]/8 text-[#2F5D50] flex items-center justify-center shrink-0">
                      <ImageIcon className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="text-xs font-black text-[#0F2118] dark:text-white">Add Shop Photos</h4>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                  </button>

                  {/* Logout */}
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Are you sure you want to logout?')) {
                        logout();
                      }
                    }}
                    className="w-full flex items-center gap-3.5 px-4.5 py-4 hover:bg-slate-50 dark:hover:bg-slate-950/60 transition-colors text-left group"
                  >
                    <div className="w-8.5 h-8.5 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center shrink-0">
                      <LogOut className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="text-xs font-black text-red-500">Logout</h4>
                    </div>
                    <ChevronRight className="w-4 h-4 text-red-400/80 transition-transform group-hover:translate-x-0.5" />
                  </button>

                </div>
              </div>

              {/* COLLAPSIBLE EDIT SHOP FORM CONTAINER */}
              <AnimatePresence initial={false}>
                {profileShowSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden bg-[#F5F8F5] dark:bg-slate-950/60 border border-[#D6E8D6] dark:border-slate-800 rounded-3xl p-5 text-left"
                  >
                    <form onSubmit={handleUpdateShop} className="space-y-4">
                      <h4 className="text-xs font-black text-[#0F2118] dark:text-white uppercase tracking-wider">Update Shop Details</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#4A6B55] dark:text-slate-400 uppercase tracking-wider block">Shop Name</label>
                          <input
                            type="text"
                            required
                            value={shopForm.name}
                            onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                            className="w-full text-xs p-3 rounded-xl border-2 border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#1A6B3A] transition-colors"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#4A6B55] dark:text-slate-400 uppercase tracking-wider block">Contact Phone</label>
                          <input
                            type="text"
                            required
                            value={shopForm.phone}
                            onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                            className="w-full text-xs p-3 rounded-xl border-2 border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#1A6B3A] transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#4A6B55] dark:text-slate-400 uppercase tracking-wider block">WhatsApp Integration</label>
                          <input
                            type="text"
                            value={shopForm.whatsapp_number || ''}
                            onChange={(e) => setShopForm({ ...shopForm, whatsapp_number: e.target.value })}
                            placeholder="Include country token (+91XXXXXXXXXX)"
                            className="w-full text-xs p-3 rounded-xl border-2 border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#1A6B3A] transition-colors"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[#4A6B55] dark:text-slate-400 uppercase tracking-wider block">Latitude</label>
                            <input
                              type="text"
                              value={shopForm.latitude}
                              onChange={(e) => setShopForm({ ...shopForm, latitude: e.target.value })}
                              className="w-full text-xs p-3 rounded-xl border-2 border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#1A6B3A] transition-colors"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[#4A6B55] dark:text-slate-400 uppercase tracking-wider block">Longitude</label>
                            <input
                              type="text"
                              value={shopForm.longitude}
                              onChange={(e) => setShopForm({ ...shopForm, longitude: e.target.value })}
                              className="w-full text-xs p-3 rounded-xl border-2 border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#1A6B3A] transition-colors"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#4A6B55] dark:text-slate-400 uppercase tracking-wider block">Shop Description / Colony / Ward Location</label>
                        <textarea
                          rows="3"
                          placeholder="Colony name, ward number, nearby landmark, or shop description (optional)"
                          value={shopForm.description || ''}
                          onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })}
                          className="w-full text-xs p-3 rounded-xl border-2 border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#1A6B3A] transition-colors resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-brand-green-600 hover:bg-brand-green-700 text-white font-black text-xs py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* FOLLOW US CARD ROW */}
              <div className="space-y-2.5 text-left">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Follow Us</h4>
                <div className="grid grid-cols-2 gap-3.5">
                  <a 
                    href="https://www.instagram.com/mydukan.online/"
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-850/60 transition-all shadow-2xs group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-pink-550/10 text-[#E1306C] flex items-center justify-center shrink-0">
                      <Instagram className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-[11px] font-black text-[#0F2118] dark:text-white leading-none">Instagram</h5>
                      <span className="text-[9px] text-slate-400 mt-1 block truncate">@mydukan.online</span>
                    </div>
                  </a>

                  <a 
                    href="https://www.youtube.com/channel/UCL1BkfKBa89jjHgudjR8P7g"
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-850/60 transition-all shadow-2xs group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-red-550/10 text-[#FF0000] flex items-center justify-center shrink-0">
                      <Youtube className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-[11px] font-black text-[#0F2118] dark:text-white leading-none">YouTube</h5>
                      <span className="text-[9px] text-slate-400 mt-1 block leading-tight font-medium">Subscribe for tutorials and many more</span>
                    </div>
                  </a>
                </div>
              </div>

              {/* SUPPORT CARD */}
              <div className="space-y-2.5 text-left">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Support</h4>
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-850">
                  <a
                    href="mailto:dukanpersonal316@gmail.com?subject=Merchant Support"
                    className="flex items-center gap-3.5 px-4.5 py-4 hover:bg-slate-50 dark:hover:bg-slate-950/60 transition-colors text-left group"
                  >
                    <div className="w-8.5 h-8.5 rounded-xl bg-[#2F5D50]/8 text-[#2F5D50] flex items-center justify-center shrink-0">
                      <Mail className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="text-xs font-black text-[#0F2118] dark:text-white">Help Desk</h4>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Get assistance via email</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                  </a>
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB SHELF 3: PRODUCT MANAGER */}
          {activeTab === 'products' && (
            <motion.div
              key="products-tab"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white font-outfit">Core Catalog & Service Menu</h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    List your core products or services here. This serves as your stable menu to minimize constant stock updating friction.
                  </p>
                </div>
                
                {/* Search Bar section feature logic integrated from items.js */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                    <input 
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs pl-8 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-green-600"
                    />
                    <div className="absolute left-2.5 top-2.5 text-slate-400">
                      <Users className="w-3.5 h-3.5 rotate-90" />
                    </div>
                    {searchQuery.length > 0 && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={onRefresh}
                    disabled={refreshing}
                    className="p-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all"
                    title="Force Index Sync"
                  >
                    <RefreshCw className={`w-4 h-4 text-brand-green-600 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    onClick={handleOpenAddProduct}
                    className="bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 shadow-sm transition-all whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Product</span>
                  </button>
                </div>
              </div>

              {loadingProducts ? (
                <div className="text-center py-12 text-xs text-slate-400 font-bold uppercase tracking-wider">Refreshing local registry index...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-200/60 p-8 max-w-sm mx-auto">
                  <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {searchQuery ? 'No results found' : 'No active products found'}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {searchQuery ? `Nothing matches "${searchQuery}"` : 'Populate items to build out public catalogs.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredProducts.map((prod) => (
                    <div key={prod.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
                      <div className="aspect-square bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
                        <img 
                          src={prod.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop'} 
                          alt={prod.name} 
                          className="w-full h-full object-cover" 
                        />
                        <span className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white font-black text-[10px] px-2 py-0.5 rounded-md">
                          ₹{Number(prod.price).toLocaleString()}
                        </span>

                        {/* Embedded Out Of Stock Badge feature tracking logic directly from items.js layout streams */}
                        {prod.track_quantity && prod.quantity_status === 'out' && (
                          <div className="absolute inset-x-0 bottom-0 bg-red-600/90 backdrop-blur-xs py-1 text-center">
                            <span className="text-[9px] text-white font-black uppercase tracking-wider">Out of Stock</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-3 flex flex-col gap-2">
                        <div>
                          <span className="text-[9px] font-black text-brand-green-600 dark:text-brand-green-400 block tracking-wider uppercase mb-0.5">
                            {prod.category || 'GENERAL'}
                          </span>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">{prod.name}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">{prod.description || 'No description listed.'}</p>
                          
                          {/* Programmatic status text row mappings brought from items.js */}
                          {prod.track_quantity && (
                            <div className="mt-1.5">
                              {prod.quantity_status === 'out' && (
                                <span className="text-[9px] font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded border border-red-100/60 dark:border-red-900/30">
                                  Out of Stock
                                </span>
                              )}
                              {prod.quantity_status === 'low' && (
                                <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-100/60 dark:border-amber-900/30">
                                  Only {prod.quantity} left
                                </span>
                              )}
                              {prod.quantity_status === 'in' && (
                                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-100/60 dark:border-emerald-900/30">
                                  In Stock ({prod.quantity})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex border-t border-slate-100 dark:border-slate-800 pt-2 justify-between items-center gap-1.5 mt-1">
                          <button 
                            onClick={() => handleOpenEditProduct(prod)}
                            className="flex-grow py-1 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                          >
                            <Edit className="w-3 h-3" /> Edit
                          </button>
                          
                          <button 
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-1 rounded-lg border border-red-100 dark:border-red-950/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB SHELF 4: OFFERS AND PROMOTIONS (BANNERS) */}
          {activeTab === 'banners' && (
            <motion.div
              key="banners-tab"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="space-y-6"
            >
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h2 className="text-base font-black text-slate-900 dark:text-white font-outfit">Active Marketing Campaigns</h2>
                <p className="text-[11px] text-slate-400 font-medium">Banners push priority merchant rankings down user layout streams.</p>
              </div>

              {!isPro ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl text-center max-w-md mx-auto flex flex-col items-center shadow-sm">
                  <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white font-outfit uppercase tracking-wider">PRO Account Matrix Locked</h3>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                    Promotion modules require premium subscription levels. Complete 3 referrals to auto-unlock free tiers.
                  </p>
                  <button onClick={handlePlanUpgrade} className="mt-4 bg-brand-green-600 text-white font-bold text-[10px] px-4 py-2 rounded-xl tracking-wide uppercase">
                    Upgrade to Pro Plan
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  {/* Complete Banner Creation Form */}
                  <form onSubmit={handleBannerSubmit} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-3">
                    <h3 className="font-extrabold text-[11px] text-slate-400 uppercase tracking-wider border-b pb-2">New Banner Spec</h3>
                    
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Campaign Headline *</label>
                      <input
                        type="text"
                        required
                        value={bannerForm.title}
                        onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                        placeholder="e.g. Clearance Mega Deal"
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-green-600"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Subtext Line</label>
                      <input
                        type="text"
                        value={bannerForm.subtitle}
                        onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                        placeholder="e.g. Valid until Sunday midnight"
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-green-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Discount Rate</label>
                        <input
                          type="text"
                          value={bannerForm.discount}
                          onChange={(e) => setBannerForm({ ...bannerForm, discount: e.target.value })}
                          placeholder="e.g. 40% OFF"
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-green-600"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Color Palette</label>
                        <select
                          value={bannerForm.template}
                          onChange={(e) => setBannerForm({ ...bannerForm, template: e.target.value })}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-green-600"
                        >
                          <option value="green">Brand Emerald</option>
                          <option value="dark">Charcoal Slate</option>
                          <option value="amber">Warm Amber</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Cover Graphic Upload</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setBannerForm({
                              ...bannerForm,
                              imageFile: file,
                              imagePreview: URL.createObjectURL(file)
                            });
                          }
                        }}
                        className="w-full text-[10px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-slate-100 dark:file:bg-slate-800 dark:file:text-white cursor-pointer"
                      />
                      {bannerForm.imagePreview && (
                        <div className="mt-2 relative aspect-video rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800">
                          <img src={bannerForm.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={creatingBanner}
                      className="w-full mt-2 bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold text-xs py-2.5 rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                    >
                      {creatingBanner ? 'Publishing Context...' : 'Publish Advertisement Banner'}
                    </button>
                  </form>

                  {/* Active Banners Deployment Tracking View */}
                  <div className="lg:col-span-2 space-y-3">
                    <h3 className="font-extrabold text-[11px] text-slate-400 uppercase tracking-wider">Live Deployments ({bannersList.length}/3)</h3>
                    {bannersList.length === 0 ? (
                      <p className="text-[11px] text-slate-400 py-4 font-medium">No live advertisement banners active currently.</p>
                    ) : (
                      <div className="space-y-3">
                        {bannersList.map((banner) => (
                          <div key={banner.id} className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3.5 rounded-xl flex items-center justify-between gap-4">
                            <div className="overflow-hidden">
                              <span className="text-[10px] uppercase font-black text-brand-green-600 block tracking-wider">{banner.discount || 'PROMO'}</span>
                              <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-0.5 truncate">{banner.title}</h4>
                              <p className="text-[10px] text-slate-400 truncate">{banner.subtitle || 'No sub-elements configured.'}</p>
                            </div>
                            <button
                              onClick={() => handleDeleteBanner(banner.id)}
                              className="p-1.5 border border-red-100 dark:border-red-950 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg shrink-0 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB SHELF 5: GALLERY COVERS SYSTEM */}
          {activeTab === 'gallery' && (
            <motion.div
              key="gallery-tab"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white font-outfit">Cover Carousel Portfolio</h2>
                  <p className="text-[11px] text-slate-400 font-medium">Media photos render inside structural top sliders on public feeds.</p>
                </div>
                
                <label className="bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm cursor-pointer transition-colors text-center shrink-0">
                  <span>{uploadingGallery ? 'Uploading Link...' : 'Upload Media Image'}</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    disabled={uploadingGallery} 
                    onChange={handleGalleryUpload} 
                    className="hidden" 
                  />
                </label>
              </div>

              {gallery.length === 0 ? (
                <div className="text-center py-12 text-xs font-medium text-slate-400">No cover images uploaded yet. Public screens will display generic placeholders.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {gallery.map((img) => (
                    <div key={img.id} className="aspect-video rounded-xl overflow-hidden bg-slate-50 border dark:border-slate-800 relative group shadow-sm">
                      <img src={img.image} className="w-full h-full object-cover" alt="Gallery cover item" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => handleDeleteMedia(img.id)}
                          className="bg-white text-red-600 p-2 rounded-xl shadow-md hover:scale-105 transition-transform"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB SHELF 6: PLAN MATRIX & REFERRALS SYSTEM */}
          {activeTab === 'referrals' && (
            <motion.div
              key="referrals-tab"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start"
            >
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="font-black text-sm text-slate-900 dark:text-white font-outfit uppercase tracking-wider text-slate-400">Account Classification</h3>
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">Current Tier Mapping</span>
                    <span className="text-base font-black text-brand-green-600 mt-0.5 block font-outfit">{isPro ? 'PRO PREMIUM SLOTS' : 'STANDARD FREEMIUM'}</span>
                  </div>
                  {!isPro && (
                    <button 
                      onClick={() => setShowUpgradeModal(true)}
                      className="bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg tracking-wide uppercase shadow-sm"
                    >
                      Instant Upgrade
                    </button>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 space-y-2 font-medium leading-relaxed">
                  <p>• <strong>Standard Plan:</strong> 15 inventory uploads, classic search discovery index weight lines.</p>
                  <p>• <strong>Pro Plan:</strong> Uncapped product slots, custom marketing deployment channels, priority location filters weight.</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="font-black text-sm text-slate-900 dark:text-white font-outfit uppercase tracking-wider text-slate-400">Invite Program Tracking</h3>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">Share your unique partner code link layout token. Once 3 merchants cross validation steps, your space scales to PRO levels free.</p>
                
                <div className="flex items-center gap-2 mt-2">
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl font-mono text-xs font-bold text-slate-700 dark:text-slate-300 flex-grow select-all truncate">
                    {dashboardData?.referral_code || 'DUKAND_PARTNER_PROMO'}
                  </div>
                  <button
                    onClick={handleCopyReferral}
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl tracking-wide shrink-0 shadow-sm transition-colors"
                  >
                    Copy Token
                  </button>
                </div>

                <div className="bg-brand-green-50/50 dark:bg-brand-green-950/20 border border-brand-green-100/50 p-3 rounded-xl flex items-center justify-between text-[11px] font-bold text-brand-green-700 dark:text-brand-green-400">
                  <span>Referred Accounts Verified</span>
                  <span className="font-black text-sm font-outfit">{dashboardData?.referrals_count || 0} merchants</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-left relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div>
                <h3 className="text-sm font-black text-[#0F2118] dark:text-white font-outfit uppercase tracking-wider">
                  {editingProduct ? 'Edit Catalog Entry' : 'Create Post'}
                </h3>
                {!editingProduct && (
                  <p className="text-[11px] text-[#4A6B55] dark:text-slate-400 font-medium mt-0.5">Publish to your shop in seconds</p>
                )}
              </div>
              <button 
                onClick={() => setProductModalOpen(false)} 
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-slate-450 dark:text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step 1: Mode Switcher (only shown when creating, not editing) */}
            {!editingProduct && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#2F5D50] flex items-center justify-center text-white text-[10px] font-bold">1</div>
                  <h4 className="text-xs font-bold text-[#0F2118] dark:text-white">What do you want to post?</h4>
                </div>
                <div className="flex gap-2.5">
                  {[
                    { key: 'cover', label: 'Cover Photo', icon: ImageIcon, desc: 'Main banner image shown at top of your shop page', tip: 'Use a clear, high-quality photo. Horizontal (4:3) works best.' },
                    { key: 'item', label: 'Add Items', icon: ShoppingBag, desc: 'Add a product to your shop listing', tip: 'Add a good photo + price. Items with photos sell 3× more.' },
                    { key: 'offer', label: 'Add Offer', icon: Gift, desc: 'Promote a discount or sale to your customers', tip: 'Short, clear offer titles grab attention fast.' }
                  ].map((m) => {
                    const Icon = m.icon;
                    const isActive = uploadMode === m.key;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setUploadMode(m.key)}
                        className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all relative ${
                          isActive
                            ? 'border-[#1A6B3A] bg-[#2F5D50]/5 dark:bg-[#2F5D50]/15'
                            : 'border-slate-100 dark:border-slate-800 bg-[#F5F8F5] dark:bg-slate-950/60 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-1.5 transition-colors ${
                          isActive ? 'bg-[#2F5D50] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`text-[10px] font-bold text-center ${
                          isActive ? 'text-[#2F5D50] dark:text-emerald-400 font-extrabold' : 'text-slate-400 dark:text-slate-500'
                        }`}>
                          {m.label}
                        </span>
                        {isActive && (
                          <div className="absolute top-1.5 right-1.5 text-[#2F5D50] dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5 fill-current text-white dark:text-slate-900" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-[#4A6B55] dark:text-slate-400 leading-normal pl-1">
                  {uploadMode === 'cover' && 'Main banner image shown at top of your shop page'}
                  {uploadMode === 'item' && 'Add a product to your shop listing'}
                  {uploadMode === 'offer' && 'Promote a discount or sale to your customers'}
                </p>
              </div>
            )}

            {/* Unified Modal form submission container */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (uploadMode === 'cover') handleCoverSubmit(e);
                else if (uploadMode === 'item') handleProductSubmit(e);
                else if (uploadMode === 'offer') handleBannerSubmit(e);
              }}
              className="space-y-4"
            >
              {/* Product Limit Info Chip (Only for item mode and not editing) */}
              {uploadMode === 'item' && !editingProduct && (
                <div className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${
                  (!dashboardData?.shop?.plan === 'pro') && products.length >= 15
                    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-[#D97706]'
                    : 'bg-[#EDF4ED] dark:bg-emerald-950/10 border-[#D6E8D6] dark:border-emerald-900/30 text-[#2F5D50] dark:text-emerald-400'
                }`}>
                  <Zap className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[10px] font-bold">
                    {(!dashboardData?.shop?.plan === 'pro') && products.length >= 15
                      ? 'Item limit reached — Watch a short ad on the mobile app to get more free credits'
                      : `${products.length} / 15 free items used — unlimited uploads on PRO`}
                  </span>
                </div>
              )}

              {/* Step 2: Media upload (Optional/Required based on mode) */}
              {uploadMode !== 'offer' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#2F5D50] flex items-center justify-center text-white text-[10px] font-bold">
                      {editingProduct ? '1' : '2'}
                    </div>
                    <h4 className="text-xs font-bold text-[#0F2118] dark:text-white">
                      Add Photo
                      {uploadMode === 'item' && (
                        <span className="text-[10px] font-normal text-slate-400 italic"> (optional)</span>
                      )}
                    </h4>
                  </div>

                  <label className="group relative border-2 border-dashed border-[#D6E8D6] dark:border-slate-800 bg-[#F5F8F5] dark:bg-slate-950/40 hover:bg-[#EDF4ED]/50 dark:hover:bg-slate-900/40 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all overflow-hidden min-h-[140px] text-center">
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        if (uploadMode === 'cover') {
                          setCoverForm({
                            imageFile: file,
                            imagePreview: URL.createObjectURL(file)
                          });
                        } else {
                          setProductForm({
                            ...productForm,
                            imageFile: file,
                            imagePreview: URL.createObjectURL(file)
                          });
                        }
                      }}
                    />

                    {((uploadMode === 'cover' ? coverForm.imagePreview : productForm.imagePreview)) ? (
                      <div className="absolute inset-0 w-full h-full bg-white dark:bg-slate-900">
                        <img 
                          src={uploadMode === 'cover' ? coverForm.imagePreview : productForm.imagePreview} 
                          alt="Preview" 
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute bottom-2.5 right-2.5 flex gap-2">
                          <span className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-850 px-2.5 py-1 rounded-lg text-[9px] font-bold text-slate-700 dark:text-white group-hover:scale-105 transition-transform shadow-sm">
                            Change Photo
                          </span>
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.preventDefault();
                              ev.stopPropagation();
                              if (uploadMode === 'cover') {
                                setCoverForm({ imageFile: null, imagePreview: '' });
                              } else {
                                setProductForm({ ...productForm, imageFile: null, imagePreview: '' });
                              }
                            }}
                            className="bg-red-50 hover:bg-red-100 text-red-650 p-1.5 rounded-lg border border-red-100 transition-colors shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-xl bg-[#2F5D50]/8 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <ImageIcon className="w-5 h-5 text-[#2F5D50] dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-[12px] font-extrabold text-[#0F2118] dark:text-white">Add Photo</p>
                          <p className="text-[10px] text-[#4A6B55] dark:text-slate-400 mt-0.5">Click to choose image file</p>
                        </div>
                      </>
                    )}
                  </label>
                </div>
              )}

              {/* Step 3 (or 2 for Offer): Details */}
              {(uploadMode === 'item' || uploadMode === 'offer') && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#2F5D50] flex items-center justify-center text-white text-[10px] font-bold">
                      {uploadMode === 'item' ? (editingProduct ? '2' : '3') : '2'}
                    </div>
                    <h4 className="text-xs font-bold text-[#0F2118] dark:text-white">Enter Details</h4>
                  </div>

                  <div className="bg-[#F5F8F5] dark:bg-slate-950/60 p-4 rounded-2xl border border-[#D6E8D6] dark:border-slate-800/80 space-y-3">
                    {uploadMode === 'item' ? (
                      <>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-[#4A6B55] dark:text-slate-400 uppercase tracking-wider block">Item Name *</label>
                          <div className="relative flex items-center">
                            <ShoppingBag className="w-4 h-4 text-slate-400 absolute left-3" />
                            <input 
                              type="text" 
                              required 
                              value={productForm.name}
                              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                              placeholder="e.g. Handmade Leather Wallet"
                              className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[#0F2118] dark:text-white outline-none focus:border-[#1A6B3A] transition-colors"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3.5">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#4A6B55] dark:text-slate-400 uppercase tracking-wider block">Price *</label>
                            <div className="relative flex items-center">
                              <span className="text-xs font-extrabold text-slate-400 absolute left-3">₹</span>
                              <input 
                                type="number" 
                                required 
                                value={productForm.price}
                                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                                placeholder="0.00"
                                className="w-full text-xs pl-7 pr-3.5 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[#0F2118] dark:text-white outline-none focus:border-[#1A6B3A] transition-colors"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#4A6B55] dark:text-slate-400 uppercase tracking-wider block">Quantity Stock</label>
                            <div className="flex items-center border-2 border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden h-[41px] bg-white dark:bg-slate-900">
                              <button
                                type="button"
                                disabled={!productForm.track_quantity || !hasQuantityTrackingFeature}
                                onClick={() => setProductForm(p => ({ ...p, quantity: Math.max(0, parseInt(p.quantity, 10) - 1) }))}
                                className="px-3 h-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-550 disabled:opacity-40"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <input 
                                type="number" 
                                disabled={!productForm.track_quantity || !hasQuantityTrackingFeature}
                                value={productForm.quantity}
                                onChange={(e) => setProductForm({ ...productForm, quantity: parseInt(e.target.value, 10) || 0 })}
                                className="w-full h-full text-center text-xs bg-transparent text-[#0F2118] dark:text-white outline-none font-bold p-0 disabled:opacity-40"
                              />
                              <button
                                type="button"
                                disabled={!productForm.track_quantity || !hasQuantityTrackingFeature}
                                onClick={() => setProductForm(p => ({ ...p, quantity: (parseInt(p.quantity, 10) || 0) + 1 }))}
                                className="px-3 h-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-550 disabled:opacity-40"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Stock conditional options locked check */}
                        {hasQuantityTrackingFeature ? (
                          <div className="bg-white/80 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="text-[11px] font-extrabold text-[#0F2118] dark:text-white">Track Quantity</h5>
                                <p className="text-[9px] text-slate-450 dark:text-slate-400 font-medium">Show stock status to customers</p>
                              </div>
                              <input 
                                type="checkbox" 
                                checked={productForm.track_quantity}
                                onChange={(e) => setProductForm({ ...productForm, track_quantity: e.target.checked })}
                                className="rounded text-[#1A6B3A] accent-[#1A6B3A] w-3.5 h-3.5 cursor-pointer"
                              />
                            </div>
                            {productForm.track_quantity && (
                              <div className="pt-0.5">
                                {(() => {
                                  const q = parseInt(productForm.quantity, 10) || 0;
                                  if (q <= 0) return <div className="bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 text-[9px] font-bold px-2 py-0.5 rounded border border-red-100 dark:border-red-900/30 inline-block">Out of Stock</div>;
                                  if (q <= 5) return <div className="bg-amber-50 dark:bg-amber-950/20 text-amber-655 dark:text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded border border-amber-100 dark:border-amber-900/30 inline-block">Only {q} left</div>;
                                  return <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 dark:text-emerald-450 text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/30 inline-block">In Stock ({q})</div>;
                                })()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-2.5 rounded-xl flex items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2">
                              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <div>
                                <h5 className="text-[10px] font-bold text-amber-900 dark:text-amber-400">Inventory Tracking</h5>
                                <p className="text-[9px] text-amber-700/80 dark:text-amber-500 font-medium">Unlock stock control for ₹100</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleUnlockQuantityTracking}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[9px] uppercase px-2.5 py-1 rounded-lg shrink-0 transition-colors shadow-sm"
                            >
                              Unlock
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-[#4A6B55] dark:text-slate-400 uppercase tracking-wider block">Offer Title *</label>
                          <div className="relative flex items-center">
                            <Zap className="w-4 h-4 text-slate-400 absolute left-3" />
                            <input 
                              type="text" 
                              required 
                              value={bannerForm.title}
                              onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                              placeholder="e.g. Diwali Sale, Weekend Special"
                              className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[#0F2118] dark:text-white outline-none focus:border-[#1A6B3A] transition-colors"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3.5">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#4A6B55] dark:text-slate-400 uppercase tracking-wider block">Discount *</label>
                            <input 
                              type="text" 
                              required 
                              value={bannerForm.discount}
                              onChange={(e) => setBannerForm({ ...bannerForm, discount: e.target.value })}
                              placeholder="e.g. 20% OFF or ₹100 OFF"
                              className="w-full text-xs px-3 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[#0F2118] dark:text-white outline-none focus:border-[#1A6B3A] transition-colors"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#4A6B55] dark:text-slate-400 uppercase tracking-wider block">Palette</label>
                            <select
                              value={bannerForm.template}
                              onChange={(e) => setBannerForm({ ...bannerForm, template: e.target.value })}
                              className="w-full text-xs px-2 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[#0F2118] dark:text-white outline-none focus:border-[#1A6B3A] transition-colors"
                            >
                              <option value="green">Brand Emerald</option>
                              <option value="dark">Charcoal Slate</option>
                              <option value="amber">Warm Amber</option>
                              <option value="red">Flame Red</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-[#4A6B55] dark:text-slate-400 uppercase tracking-wider block">Short Description</label>
                          <input 
                            type="text" 
                            value={bannerForm.subtitle}
                            onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                            placeholder="e.g. Valid till Sunday only"
                            className="w-full text-xs px-3 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[#0F2118] dark:text-white outline-none focus:border-[#1A6B3A] transition-colors"
                          />
                        </div>

                        {/* Optional Banner Background Cover Media */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-[#4A6B55] dark:text-slate-400 uppercase tracking-wider block">Banner Background Image (Optional)</label>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setBannerForm({
                                  ...bannerForm,
                                  imageFile: file,
                                  imagePreview: URL.createObjectURL(file)
                                });
                              }
                            }}
                            className="w-full text-[10px] text-slate-500 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-white dark:file:bg-slate-800 dark:file:text-white cursor-pointer"
                          />
                          {bannerForm.imagePreview && (
                            <div className="mt-2 relative aspect-video w-32 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800">
                              <img src={bannerForm.imagePreview} alt="Banner Preview" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Tip card matching RN TipCard component */}
              <div className="flex gap-2.5 bg-[#FFFBEB] dark:bg-amber-950/10 border border-[#FDE68A] dark:border-amber-900/30 rounded-2xl p-3.5">
                <span className="text-amber-500 text-sm mt-0.5">💡</span>
                <p className="text-[11px] text-[#92400E] dark:text-amber-500 leading-normal font-medium">
                  {uploadMode === 'cover' && 'Use a clear, high-quality photo. Horizontal (4:3) works best.'}
                  {uploadMode === 'item' && 'Add a good photo + price. Items with photos sell 3× more.'}
                  {uploadMode === 'offer' && 'Short, clear offer titles grab attention fast.'}
                </p>
              </div>

              {/* Readiness Checklist Card */}
              <div className="bg-[#F5F8F5] dark:bg-slate-950/45 rounded-2xl p-4 border border-[#D6E8D6] dark:border-slate-800/80 space-y-2">
                <h5 className="text-[11px] font-black text-[#0F2118] dark:text-white uppercase tracking-wider">
                  Ready to publish?
                </h5>
                <div className="space-y-1.5 pt-1">
                  {/* cover mode checks */}
                  {uploadMode === 'cover' && (
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${coverForm.imagePreview ? 'bg-emerald-500 text-white' : 'border border-slate-350 text-transparent'}`}>
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span className={coverForm.imagePreview ? 'text-[#0F2118] dark:text-white' : 'text-slate-400 dark:text-slate-500'}>
                        Banner photo added
                      </span>
                    </div>
                  )}

                  {/* item mode checks */}
                  {uploadMode === 'item' && (
                    <>
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${productForm.name.trim() ? 'bg-emerald-500 text-white' : 'border border-slate-350 text-transparent'}`}>
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span className={productForm.name.trim() ? 'text-[#0F2118] dark:text-white' : 'text-slate-400 dark:text-slate-500'}>
                          Item name entered
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${productForm.price ? 'bg-emerald-500 text-white' : 'border border-slate-350 text-transparent'}`}>
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span className={productForm.price ? 'text-[#0F2118] dark:text-white' : 'text-slate-400 dark:text-slate-500'}>
                          Price entered (₹)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${productForm.imagePreview ? 'bg-emerald-500 text-white' : 'border border-slate-350 text-transparent'}`}>
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span className={productForm.imagePreview ? 'text-[#0F2118] dark:text-white' : 'text-slate-400 dark:text-slate-500'}>
                          Photo added (optional)
                        </span>
                      </div>
                    </>
                  )}

                  {/* offer mode checks */}
                  {uploadMode === 'offer' && (
                    <>
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${bannerForm.title.trim() ? 'bg-emerald-500 text-white' : 'border border-slate-350 text-transparent'}`}>
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span className={bannerForm.title.trim() ? 'text-[#0F2118] dark:text-white' : 'text-slate-400 dark:text-slate-500'}>
                          Offer title entered
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${bannerForm.discount.trim() ? 'bg-emerald-500 text-white' : 'border border-slate-350 text-transparent'}`}>
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span className={bannerForm.discount.trim() ? 'text-[#0F2118] dark:text-white' : 'text-slate-400 dark:text-slate-500'}>
                          Discount % or amount set
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action buttons (Publish Now / Fill required fields) */}
              <div className="pt-3 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={
                    loadingProducts || creatingBanner ||
                    (uploadMode === 'cover' && !coverForm.imageFile) ||
                    (uploadMode === 'item' && (!productForm.name.trim() || !productForm.price)) ||
                    (uploadMode === 'offer' && (!bannerForm.title.trim() || !bannerForm.discount.trim()))
                  }
                  className="w-full py-3 bg-[#2F5D50] hover:bg-[#1A6B3A] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#2F5D50]/15 flex items-center justify-center gap-2 disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  {(loadingProducts || creatingBanner) ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Uploading Content...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current text-emerald-400" />
                      <span>
                        {uploadMode === 'cover' && (coverForm.imageFile ? 'Publish Now' : 'Add Banner Photo')}
                        {uploadMode === 'item' && (productForm.name.trim() && productForm.price ? 'Publish Now' : 'Fill Required Fields')}
                        {uploadMode === 'offer' && (bannerForm.title.trim() && bannerForm.discount.trim() ? 'Publish Now' : 'Fill Required Fields')}
                      </span>
                    </>
                  )}
                </button>
                
                {/* Reset button to clear everything and start over */}
                {((uploadMode === 'cover' && coverForm.imagePreview) || 
                  (uploadMode === 'item' && (productForm.name || productForm.price || productForm.imagePreview)) ||
                  (uploadMode === 'offer' && (bannerForm.title || bannerForm.discount || bannerForm.imagePreview))) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (uploadMode === 'cover') {
                        setCoverForm({ imageFile: null, imagePreview: '' });
                      } else if (uploadMode === 'item') {
                        setProductForm({
                          id: null,
                          name: '',
                          description: '',
                          price: '',
                          quantity: 0,
                          track_quantity: false,
                          imageFile: null,
                          imagePreview: '',
                        });
                      } else if (uploadMode === 'offer') {
                        setBannerForm({
                          title: '',
                          subtitle: '',
                          discount: '',
                          template: 'green',
                          imageFile: null,
                          imagePreview: '',
                        });
                      }
                    }}
                    className="w-full py-2.5 text-center text-xs font-bold text-slate-400 hover:text-slate-655 dark:hover:text-slate-300 transition-colors"
                  >
                    Start Over
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      {/* UPGRADE MODAL MAPPED 1:1 FROM APP MERCHANT PROFILE */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 text-left relative animate-slide-up">
            <button 
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white font-outfit">Upgrade to PRO</h3>
              <p className="text-xs text-slate-400 font-medium mt-1">Take your shop to the next level</p>
            </div>

            <div className="space-y-3 my-2 text-slate-600 dark:text-slate-350 text-xs font-bold">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-brand-green-600 shrink-0 mt-0.5" />
                <span>Showcase up to 100 products in your shop</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-brand-green-600 shrink-0 mt-0.5" />
                <span>Get a premium verified badge on your shop</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-brand-green-600 shrink-0 mt-0.5" />
                <span>Appear before free shops when distance is the same</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-brand-green-600 shrink-0 mt-0.5" />
                <span>Boost visibility with a featured banner</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-brand-green-600 shrink-0 mt-0.5" />
                <span>Highlight your shop with 5 cover images</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-brand-green-600 shrink-0 mt-0.5" />
                <span>Engage customers with instant notifications</span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowUpgradeModal(false);
                handlePlanUpgrade();
              }}
              className="w-full bg-brand-green-600 hover:bg-brand-green-700 text-white font-black text-xs py-3.5 rounded-xl transition-all shadow-md text-center"
            >
              Pay ₹40 / month
            </button>

            <button 
              onClick={() => setShowUpgradeModal(false)}
              className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}

    </div>
  );
}