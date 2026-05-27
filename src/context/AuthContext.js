'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof window !== 'undefined') {
          const storedToken = localStorage.getItem('dukan_token');
          const storedUser = localStorage.getItem('dukan_user');

          if (storedToken && storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            
            // If they are a merchant, fetch their shop details immediately
            if (parsedUser.role === 'merchant') {
              await fetchShopDetails(parsedUser.user_id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to initialize authentication', err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const fetchShopDetails = async (userId) => {
    try {
      const res = await api.get(`/my-shop/${userId}/`);
      setShop(res.data);
      return res.data;
    } catch (err) {
      console.error('Failed to fetch shop details', err);
      setShop(null);
    }
  };

  const login = async (usernameOrEmail, password) => {
    try {
      const res = await api.post('/auth/login/', {
        username: usernameOrEmail,
        password,
      });

      const { token, user_id, username, role } = res.data;
      const userData = { user_id, username, role };

      localStorage.setItem('dukan_token', token);
      localStorage.setItem('dukan_user', JSON.stringify(userData));
      setUser(userData);

      if (role === 'merchant') {
        await fetchShopDetails(user_id);
      } else {
        setShop(null);
      }

      return userData;
    } catch (err) {
      throw err.error || err.message || 'Login failed';
    }
  };

  const signup = async (signupData) => {
    try {
      const res = await api.post('/auth/signup/', signupData);
      const { token, user_id, username, role } = res.data;
      const userData = { user_id, username, role };

      localStorage.setItem('dukan_token', token);
      localStorage.setItem('dukan_user', JSON.stringify(userData));
      setUser(userData);

      if (role === 'merchant') {
        await fetchShopDetails(user_id);
      } else {
        setShop(null);
      }

      return userData;
    } catch (err) {
      throw err.error || err.message || 'Signup failed';
    }
  };

  const logout = () => {
    localStorage.removeItem('dukan_token');
    localStorage.removeItem('dukan_user');
    setUser(null);
    setShop(null);
  };

  const updateShopState = (newShopData) => {
    setShop(newShopData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        shop,
        loading,
        isMerchant: user?.role === 'merchant',
        login,
        signup,
        logout,
        fetchShopDetails: () => user ? fetchShopDetails(user.user_id) : null,
        updateShopState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
