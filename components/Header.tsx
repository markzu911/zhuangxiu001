
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-stone-800 flex items-center justify-center rounded-sm">
            <span className="text-white font-serif-sc text-xl">禅</span>
          </div>
          <h1 className="text-xl font-serif-sc font-bold text-stone-900 tracking-tight">禅艺 AI 装修</h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
