'use client';

import { useState, useEffect } from 'react';
import Header from './Header';

export default function ClientHeader() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <header className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <span className="h-7 w-7 text-amber-700">☕</span>
              <span className="font-bold text-xl text-gray-800">CubicJ Cafe</span>
            </div>
            <div className="w-8 h-8 animate-pulse bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </header>
    );
  }

  return <Header />;
}