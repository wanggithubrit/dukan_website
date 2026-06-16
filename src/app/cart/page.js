'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import api from '@/utils/api';
import BottomNav from '@/components/BottomNav';
import { 
  ShoppingBag, 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Minus, 
  MapPin, 
  Loader2, 
  AlertCircle, 
  Store,
  ChevronRight,
  ClipboardList,
  ChevronDown,
  Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [globalCart, setGlobalCart] = useState([]);
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
    lat: '',
    lon: '',
    paymentMethod: 'COD',
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [profileInfo, setProfileInfo] = useState(null);
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (user === null) {
      showToast('Please login to view your cart', 'error');
      router.replace('/customer/login');
    } else {
      setIsLoaded(true);
    }
  }, [user, router, showToast]);

  // Fetch profile information
  useEffect(() => {
    if (!user?.user_id) return;
    const loadProfile = async () => {
      try {
        const res = await api.get(`/user/${user.user_id}/`);
        setProfileInfo(res.data);
      } catch (e) {
        console.error('Error fetching profile on cart:', e);
      }
    };
    loadProfile();
  }, [user]);

  // Load cart on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadCart = () => {
      try {
        const stored = localStorage.getItem('dukan_cart');
        const parsed = stored ? JSON.parse(stored) : [];
        setGlobalCart(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        console.error('Failed to load cart', e);
      }
    };

    loadCart();
    window.addEventListener('dukan_cart_changed', loadCart);
    return () => window.removeEventListener('dukan_cart_changed', loadCart);
  }, []);

  // Prepopulate form fields
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedName = profileInfo?.name || localStorage.getItem('cust_name') || '';
    const savedPhone = profileInfo?.phone || localStorage.getItem('cust_phone') || '';
    const savedAddress = profileInfo?.address || '';

    setCheckoutForm(prev => ({
      ...prev,
      name: prev.name || savedName,
      phone: prev.phone || savedPhone,
      address: prev.address || savedAddress,
    }));
  }, [profileInfo]);

  const saveCart = (newCart) => {
    setGlobalCart(newCart);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dukan_cart', JSON.stringify(newCart));
      window.dispatchEvent(new Event('dukan_cart_changed'));
    }
  };

  const handleUpdateQty = (shopId, itemId, change) => {
    const nextCart = globalCart.map(entry => {
      if (entry.shop.id === shopId) {
        const updatedItems = entry.items.map(itemEntry => {
          if (itemEntry.item.id === itemId) {
            const nextQty = itemEntry.quantity + change;
            if (nextQty <= 0) return null;
            return { ...itemEntry, quantity: nextQty };
          }
          return itemEntry;
        }).filter(Boolean);

        if (updatedItems.length === 0) return null;
        return { ...entry, items: updatedItems };
      }
      return entry;
    }).filter(Boolean);

    saveCart(nextCart);
  };

  const handleRemoveItem = (shopId, itemId) => {
    const nextCart = globalCart.map(entry => {
      if (entry.shop.id === shopId) {
        const updatedItems = entry.items.filter(itemEntry => itemEntry.item.id !== itemId);
        if (updatedItems.length === 0) return null;
        return { ...entry, items: updatedItems };
      }
      return entry;
    }).filter(Boolean);

    saveCart(nextCart);
    showToast('Item removed from cart', 'info');
  };

  const handleInputChange = (field, value) => {
    setCheckoutForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleInputChange('lat', position.coords.latitude.toString());
          handleInputChange('lon', position.coords.longitude.toString());
          showToast('GPS coordinates captured! 📍', 'success');
        },
        () => {
          showToast('Could not fetch location coordinates.', 'warning');
        }
      );
    } else {
      showToast('Geolocation is not supported by your browser.', 'warning');
    }
  };

  const handlePlaceAllOrders = async () => {
    if (!checkoutForm.name?.trim()) return showToast('Name is required', 'warning');
    if (!checkoutForm.phone?.trim()) return showToast('Phone number is required', 'warning');

    const needsAddress = globalCart.some(entry => entry.shop.delivery_available);
    if (needsAddress && !checkoutForm.address?.trim()) {
      return showToast('Delivery address is required since some shops in your cart require delivery', 'warning');
    }

    try {
      setIsSubmittingAll(true);
      let successCount = 0;
      let totalItemsCount = 0;

      const promises = [];
      globalCart.forEach(entry => {
        const shopId = entry.shop.id;
        entry.items.forEach(itemEntry => {
          totalItemsCount++;
          const body = {
            shop_id: shopId,
            item_id: itemEntry.item.id,
            quantity: itemEntry.quantity,
            customer_name: checkoutForm.name.trim(),
            customer_phone: checkoutForm.phone.trim(),
            delivery_address: checkoutForm.address?.trim() || '',
            notes: checkoutForm.notes?.trim() || '',
            customer_latitude: checkoutForm.lat?.trim() ? parseFloat(checkoutForm.lat) : null,
            customer_longitude: checkoutForm.lon?.trim() ? parseFloat(checkoutForm.lon) : null,
            payment_method: 'COD',
          };
          promises.push(
            api.post('/orders/', body)
              .then(() => { successCount++; })
              .catch(err => { console.error(`Error ordering item ${itemEntry.item.id} from shop ${shopId}:`, err); })
          );
        });
      });

      await Promise.all(promises);

      if (typeof window !== 'undefined') {
        localStorage.setItem('cust_name', checkoutForm.name.trim());
        localStorage.setItem('cust_phone', checkoutForm.phone.trim());
      }

      if (successCount === totalItemsCount) {
        showToast('All orders placed successfully! 🎉', 'success');
        saveCart([]);
        router.push('/profile/orders');
      } else if (successCount > 0) {
        showToast(`Placed ${successCount} of ${totalItemsCount} orders successfully.`, 'warning');
        saveCart([]);
        router.push('/profile/orders');
      } else {
        showToast('Error placing orders. Please check your network.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error placing orders.', 'error');
    } finally {
      setIsSubmittingAll(false);
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-3xl border border-[#E0EAE6] shadow-premium max-w-sm w-full flex flex-col items-center">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Loading My Cart...</h3>
        </div>
      </div>
    );
  }

  // Calculate pricing subtotals
  const totalItemsCount = globalCart.reduce((sum, entry) => {
    return sum + entry.items.reduce((itemSum, itemEntry) => itemSum + itemEntry.quantity, 0);
  }, 0);

  const itemsSubtotal = globalCart.reduce((sum, entry) => {
    return sum + entry.items.reduce((itemSum, itemEntry) => itemSum + (itemEntry.item.price || 0) * itemEntry.quantity, 0);
  }, 0);

  const totalDeliveryCharges = globalCart.reduce((sum, entry) => {
    if (entry.shop.delivery_available && entry.shop.delivery_charge) {
      const parsed = parseFloat(entry.shop.delivery_charge);
      return sum + (isNaN(parsed) ? 0 : parsed);
    }
    return sum;
  }, 0);

  const hasTextDeliveryCharges = globalCart.some(entry => {
    if (!entry.shop.delivery_available) return false;
    const parsed = parseFloat(entry.shop.delivery_charge);
    return isNaN(parsed) && entry.shop.delivery_charge;
  });

  const grandTotal = itemsSubtotal + totalDeliveryCharges;



  const formatDeliveryCharge = (charge) => {
    if (!charge) return 'Free';
    const parsed = parseFloat(charge);
    if (isNaN(parsed)) return charge;
    return `₹${charge}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-left" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
      
      {/* Header */}
      <div className="sticky top-16 z-30 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center gap-3">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-5 h-5 text-slate-800" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2 font-outfit tracking-tight">
              <ShoppingBag className="w-6 h-6 text-emerald-600" />
              My Shopping Cart
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {totalItemsCount > 0 
                ? `${totalItemsCount} item${totalItemsCount !== 1 ? 's' : ''} from ${globalCart.length} shop${globalCart.length !== 1 ? 's' : ''}`
                : 'Cart is empty'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 grow w-full">
        {globalCart.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 p-8 max-w-md mx-auto flex flex-col items-center shadow-md">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="font-extrabold text-slate-900 mb-1">Your cart is empty</h3>
            <p className="text-xs text-slate-500 mb-6 max-w-xs">
              Looks like you haven&apos;t added anything to your cart yet. Explore nearby local shops!
            </p>
            <Link 
              href="/"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-sm transition"
            >
              Discover Shops
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Cart items list */}
            <div className="lg:col-span-8 space-y-6">
              <AnimatePresence>
                {globalCart.map((entry) => {
                  const shopId = entry.shop.id;
                  const shopSubtotal = entry.items.reduce(
                    (sum, itemEntry) => sum + (itemEntry.item.price || 0) * itemEntry.quantity, 
                    0
                  );
                  const isProPlus = entry.shop.plan && String(entry.shop.plan).toLowerCase() === 'pro_plus';

                  return (
                    <motion.div 
                      key={shopId}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
                    >
                      {/* Shop Header */}
                      <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex justify-between items-center flex-wrap gap-2">
                        <Link 
                          href={`/shop/${shopId}`}
                          className="flex items-center gap-1.5 hover:opacity-80 transition cursor-pointer"
                        >
                          <Store className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-extrabold text-slate-900 font-outfit">
                            {isProPlus ? '✅ ' : ''}{entry.shop.name}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </Link>
                        {isProPlus && (
                          <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                            Ordering Active
                          </span>
                        )}
                      </div>

                      {/* Items */}
                      <div className="divide-y divide-slate-100 px-6">
                        {entry.items.map((itemEntry) => {
                          const item = itemEntry.item;
                          const price = item.price || 0;
                          const displayImage = item.image || 'https://placehold.co/100x100/f3f4f6/9ca3af?text=Item';

                          return (
                            <div key={item.id} className="py-6 flex gap-6 items-start">
                              {/* Product Image */}
                              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-50 overflow-hidden flex-shrink-0 relative border border-slate-150 shadow-2xs">
                                <img 
                                  src={displayImage} 
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = 'https://placehold.co/100x100/f3f4f6/9ca3af?text=Item';
                                  }}
                                />
                              </div>

                              {/* Details */}
                              <div className="flex-grow min-w-0 flex flex-col">
                                <h4 className="text-sm font-bold text-slate-900 leading-snug">{item.name}</h4>
                                
                                <div className="mt-1 text-xs">
                                  {item.quantity_status === 'out' ? (
                                    <span className="text-rose-600 font-semibold">Out of Stock</span>
                                  ) : item.quantity_status === 'low' ? (
                                    <span className="text-amber-600 font-semibold text-[10px]">Only {item.quantity} left</span>
                                  ) : (
                                    <span className="text-emerald-600 font-semibold text-[10px]">In Stock</span>
                                  )}
                                </div>

                                <div className="mt-2 flex items-baseline gap-2">
                                  <span className="text-xs font-semibold text-slate-400">Price:</span>
                                  <span className="text-sm font-black text-slate-900">₹{price}</span>
                                  {itemEntry.quantity > 1 && (
                                    <span className="text-[10px] text-slate-400 font-semibold">
                                      (₹{price * itemEntry.quantity} total)
                                    </span>
                                  )}
                                </div>

                                {/* Controls */}
                                <div className="flex items-center gap-4 mt-4 flex-wrap">
                                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-2xs">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQty(shopId, item.id, -1)}
                                      className="p-1.5 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="px-2.5 text-xs font-bold text-slate-800">
                                      {itemEntry.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQty(shopId, item.id, 1)}
                                      className="p-1.5 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>

                                  <div className="h-4 w-[1px] bg-slate-200" />

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(shopId, item.id)}
                                    className="text-xs font-bold text-rose-500 hover:text-rose-700 transition cursor-pointer flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Shop subtotal and delivery details info */}
                      <div className="bg-slate-50/50 px-6 py-4.5 border-t border-slate-100 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500 uppercase">Subtotal</span>
                          <span className="text-sm font-black text-slate-900">₹{shopSubtotal}</span>
                        </div>
                        {entry.shop.delivery_available && (
                          <div className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 flex items-center justify-between">
                            <span>🚚 Delivery Charge: {formatDeliveryCharge(entry.shop.delivery_charge)} | Areas: {entry.shop.delivery_area || 'All'}</span>
                            {entry.shop.estimated_delivery_time && (
                              <span className="bg-emerald-100 px-2 py-0.5 rounded-md font-bold">Est: {entry.shop.estimated_delivery_time}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Right Column: Unified Checkout Summary */}
            <div className="lg:col-span-4 lg:sticky lg:top-36 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-sm space-y-6">
                <h4 className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <ClipboardList className="w-5 h-5 text-emerald-600" />
                  Checkout Details
                </h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Your Name *</label>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      value={checkoutForm.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      placeholder="Enter 10-digit mobile number"
                      value={checkoutForm.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Delivery Address *</label>
                    <textarea
                      placeholder="Enter full delivery address"
                      value={checkoutForm.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Notes (Optional)</label>
                    <input
                      type="text"
                      placeholder="Special instructions for merchants"
                      value={checkoutForm.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">📍 GPS Coordinates (Optional)</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center transition-colors cursor-pointer"
                      >
                        Get GPS
                      </button>
                      <input
                        type="text"
                        placeholder="Lat"
                        value={checkoutForm.lat}
                        onChange={(e) => handleInputChange('lat', e.target.value)}
                        className="w-1/2 px-2 py-1.5 rounded-xl border border-slate-200 text-[10px] focus:outline-none focus:border-emerald-600 bg-slate-50 text-center"
                      />
                      <input
                        type="text"
                        placeholder="Lon"
                        value={checkoutForm.lon}
                        onChange={(e) => handleInputChange('lon', e.target.value)}
                        className="w-1/2 px-2 py-1.5 rounded-xl border border-slate-200 text-[10px] focus:outline-none focus:border-emerald-600 bg-slate-50 text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Payment Method</label>
                    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-[11px] text-emerald-800 font-bold">
                      <Coins className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        {globalCart[0]?.shop?.payment_policy === 'cod' 
                          ? 'Cash on Delivery (COD)' 
                          : globalCart[0]?.shop?.payment_policy === 'contact' 
                          ? 'Merchant may contact you for payment.' 
                          : 'Cash on Delivery (COD) or merchant may contact you for payment.'}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Price Breakdown Summary */}
                <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Items Subtotal:</span>
                    <span className="font-semibold text-slate-900">₹{itemsSubtotal}</span>
                  </div>
                  {(totalDeliveryCharges > 0 || hasTextDeliveryCharges) && (
                    <div className="flex justify-between">
                      <span>Delivery Charges:</span>
                      <span className="font-semibold text-slate-900">
                        {totalDeliveryCharges > 0 ? `₹${totalDeliveryCharges}` : ''}
                        {hasTextDeliveryCharges ? (totalDeliveryCharges > 0 ? ' + Extra' : 'Extra/Variable') : ''}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
                    <span>Grand Total:</span>
                    <span>₹{grandTotal}{hasTextDeliveryCharges ? ' + Extra' : ''}</span>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  onClick={handlePlaceAllOrders}
                  disabled={isSubmittingAll || globalCart.length === 0}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-100 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingAll ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Placing Orders...</span>
                    </>
                  ) : (
                    <span>Place Order (₹{grandTotal})</span>
                  )}
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
