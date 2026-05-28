'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MerchantDashboard() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('overview'); // overview | profile | products | banners | gallery | referrals
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Search logic from items.js layout mapping
  const [searchQuery, setSearchQuery] = useState('');

  // Shop update fields
  const [shopForm, setShopForm] = useState({
    name: '',
    phone: '',
    whatsapp_number: '',
    address: '',
    latitude: '',
    longitude: '',
  });

  // Product CRUD states
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

  // Fetch all dashboard stats and content from backend API
  const fetchDashboardData = useCallback(async (silent = false) => {
    if (!user?.user_id) return;
    if (!silent) setLoadingProducts(true);
    try {
      const res = await api.get(`/merchant/dashboard/${user.user_id}/`);
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
        });
        
        // Load products for the shop
        try {
          const itemsRes = await api.get(`/items/${s.id}/`);
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
    setEditingProduct(true);
    setProductModalOpen(true);
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

  if (loadingDashboard) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 p-6">
        <Store className="w-10 h-10 text-brand-green-600 animate-spin mb-3" />
        <h2 className="text-xs font-bold text-slate-400 font-outfit uppercase tracking-wider">Loading workspace...</h2>
      </div>
    );
  }

  const s = dashboardData?.shop || {};
  const stats = dashboardData?.stats || {};
  const gallery = dashboardData?.media || [];
  const bannersList = dashboardData?.banners || [];
  const isPro = s.plan === 'pro';
  
  // Checking whether the store has paid for the lifecycle feature unlock (mapped from products array flags in items.js)
  const hasQuantityTrackingFeature = products[0]?.shop_has_quantity_feature || s.shop_has_quantity_feature || false;

  return (
    <div className="w-full min-h-screen bg-white dark:bg-slate-950 flex flex-col md:flex-row pb-16 md:pb-0">
      
      {/* MOBILE BAR TOP HEADER STATUS */}
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 md:hidden flex justify-between items-center px-4 py-3.5 z-40 sticky top-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-green-50 flex items-center justify-center font-black text-brand-green-600 text-xs">
            {s.name?.charAt(0)}
          </div>
          <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate max-w-[160px] font-outfit">{s.name}</span>
        </div>
        <button 
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-300"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* 1. SIDEBAR CONTAINER NAVIGATION */}
      <aside className={`fixed inset-y-0 left-0 transform ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:sticky md:top-16 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 p-6 flex flex-col justify-between shrink-0 transition-transform duration-300 ease-in-out h-[calc(100vh-64px)] overflow-y-auto`}>
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
              { id: 'overview', label: 'Home Dashboard', icon: TrendingUp },
              { id: 'products', label: 'Inventory Catalog', icon: ShoppingBag },
              { id: 'profile', label: 'Store Profile', icon: Store },
              { id: 'referrals', label: 'Invite & Upgrades', icon: Zap },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
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

      {/* 2. MAIN WORKSPACE ROW LAYOUT SHELF CONTAINER */}
      <main className="flex-grow p-4 sm:p-8 max-w-5xl mx-auto w-full text-left">
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
              {/* Header block mirroring app welcome */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Good morning</span>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white font-outfit">Dashboard</h2>
                </div>
                {/* PRO badge indicator */}
                <div className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 border shadow-sm self-start ${
                  isPro 
                    ? 'bg-brand-green-50 dark:bg-brand-green-950/40 border-brand-green-100 dark:border-brand-green-900/60 text-brand-green-700 dark:text-brand-green-400 font-extrabold'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 text-slate-500'
                }`}>
                  <BadgeCheck className="w-4 h-4 text-brand-green-600 dark:text-brand-green-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider font-outfit">{isPro ? 'Pro Account' : 'Standard Account'}</span>
                </div>
              </div>

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

          {/* TAB SHELF 2: PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile-tab"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm"
            >
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
                <h2 className="text-base font-black text-slate-900 dark:text-white font-outfit">Store Profile Parameters</h2>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Update search index coordinates and business visibility data.</p>
              </div>

              <form onSubmit={handleUpdateShop} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Shop Display Name</label>
                    <input
                      type="text"
                      required
                      value={shopForm.name}
                      onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-green-600 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Primary Phone Contact</label>
                    <input
                      type="text"
                      required
                      value={shopForm.phone}
                      onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-green-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">WhatsApp Chat Integration</label>
                    <input
                      type="text"
                      value={shopForm.whatsapp_number || ''}
                      onChange={(e) => setShopForm({ ...shopForm, whatsapp_number: e.target.value })}
                      placeholder="Include country token (+91XXXXXXXXXX)"
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-green-600 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Latitude Link</label>
                      <input
                        type="text"
                        value={shopForm.latitude}
                        onChange={(e) => setShopForm({ ...shopForm, latitude: e.target.value })}
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-green-600 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Longitude Link</label>
                      <input
                        type="text"
                        value={shopForm.longitude}
                        onChange={(e) => setShopForm({ ...shopForm, longitude: e.target.value })}
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-green-600 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Full Business Address Map Detail</label>
                  <textarea
                    rows="3"
                    value={shopForm.address}
                    onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-green-600 focus:border-transparent transition-all"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Commit Settings Save</span>
                  </button>
                </div>
              </form>
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
                  <h2 className="text-base font-black text-slate-900 dark:text-white font-outfit">Inventory Stock Registry</h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {products.length} product{products.length !== 1 ? 's' : ''} listed mapping active slots.
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

      {/* ─── INVENTORY MODAL PORTAL WINDOW ─── */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto text-left">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white font-outfit uppercase tracking-wider">
                {editingProduct ? 'Edit Catalog Entry' : 'Register New Item'}
              </h3>
              <button 
                onClick={() => setProductModalOpen(false)} 
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-3.5">
              {editingProduct && productForm.imagePreview && (
                <div className="flex items-center gap-3.5 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                  <img 
                    src={productForm.imagePreview} 
                    alt="Thumbnail" 
                    className="w-14 h-14 rounded-xl object-cover bg-white shrink-0" 
                  />
                  <div className="overflow-hidden">
                    <span className="text-[9px] uppercase font-black text-brand-green-600 tracking-wide block">GENERAL</span>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">{productForm.name || 'Unnamed Asset'}</h4>
                    <span className="text-[11px] font-bold text-slate-400 block mt-0.5">Current Price: ₹{productForm.price || '0'}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Product Title *</label>
                <input 
                  type="text" 
                  required 
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Organic Dairy Milk"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-green-600"
                />
              </div>



              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Retail Price (₹) *</label>
                  <input 
                    type="number" 
                    required 
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="e.g. 65"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-green-600"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Quantity Stock</label>
                  {/* Quantity controls stepper integrated from React Native codebase */}
                  <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden h-[38px]">
                    <button
                      type="button"
                      disabled={!productForm.track_quantity || !hasQuantityTrackingFeature}
                      onClick={() => setProductForm(p => ({ ...p, quantity: Math.max(0, parseInt(p.quantity, 10) - 1) }))}
                      className="px-2.5 h-full bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-100 disabled:opacity-40"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input 
                      type="number" 
                      disabled={!productForm.track_quantity || !hasQuantityTrackingFeature}
                      value={productForm.quantity}
                      onChange={(e) => setProductForm({ ...productForm, quantity: parseInt(e.target.value, 10) || 0 })}
                      className="w-full h-full text-center text-xs bg-transparent text-slate-900 dark:text-white outline-none font-bold p-0 disabled:opacity-40"
                    />
                    <button
                      type="button"
                      disabled={!productForm.track_quantity || !hasQuantityTrackingFeature}
                      onClick={() => setProductForm(p => ({ ...p, quantity: (parseInt(p.quantity, 10) || 0) + 1 }))}
                      className="px-2.5 h-full bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-100 disabled:opacity-40"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* ─── CONDITIONAL FEATURES MERGED FROM MOBILE APP CODE (items.js) ─── */}
              {hasQuantityTrackingFeature ? (
                <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-100 dark:border-slate-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">Track Quantity</h5>
                      <p className="text-[10px] text-slate-400 font-medium">Show stock status to customers</p>
                    </div>
                    <input 
                      type="checkbox" 
                      id="track_quantity_box"
                      checked={productForm.track_quantity}
                      onChange={(e) => setProductForm({ ...productForm, track_quantity: e.target.checked })}
                      className="rounded text-brand-green-600 accent-brand-green-600 w-4 h-4 cursor-pointer"
                    />
                  </div>

                  {/* Stock verification pill layout from React Native items.js conditional view */}
                  {productForm.track_quantity && (
                    <div className="pt-1">
                      {(() => {
                        const q = parseInt(productForm.quantity, 10) || 0;
                        if (q <= 0) {
                          return <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-[10px] font-bold px-2.5 py-1 rounded-md border border-red-100/60 dark:border-red-900/40 inline-block">Will show: Out of Stock</div>;
                        } else if (q <= 5) {
                          return <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-md border border-amber-100/60 dark:border-amber-900/40 inline-block">Will show: Only {q} left</div>;
                        } else {
                          return <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-md border border-emerald-100/60 dark:border-emerald-900/40 inline-block">Will show: In Stock ({q})</div>;
                        }
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                /* The yellow stylized mobile lock box layout block fully ported */
                <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 p-3.5 rounded-xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h5 className="text-xs font-black text-amber-900 dark:text-amber-400 font-outfit uppercase tracking-wide">Inventory Tracking</h5>
                    <p className="text-[10px] text-amber-700/80 dark:text-amber-500 font-medium leading-tight mt-0.5">
                      Unlock quantity management for ₹100 lifetime access.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleUnlockQuantityTracking}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] uppercase px-3 py-1.5 rounded-lg tracking-wider shrink-0 transition-all shadow-sm"
                  >
                    Unlock
                  </button>
                </div>
              )}

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Display Media File</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setProductForm({
                        ...productForm,
                        imageFile: file,
                        imagePreview: URL.createObjectURL(file)
                      });
                    }
                  }}
                  className="w-full text-[10px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-slate-100 dark:file:bg-slate-800 dark:file:text-white cursor-pointer"
                />
                {!editingProduct && productForm.imagePreview && (
                  <div className="mt-2 relative aspect-square w-20 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800">
                    <img src={productForm.imagePreview} alt="Product Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="w-1/2 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 text-xs font-bold bg-brand-green-600 hover:bg-brand-green-700 text-white rounded-xl transition-colors shadow-sm"
                >
                  Commit Entry
                </button>
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