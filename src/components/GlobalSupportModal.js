'use client';

import React, { useState, useEffect } from 'react';
import SupportModal from './SupportModal';

export default function GlobalSupportModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-support-modal', handleOpen);
    return () => {
      window.removeEventListener('open-support-modal', handleOpen);
    };
  }, []);

  return <SupportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}
