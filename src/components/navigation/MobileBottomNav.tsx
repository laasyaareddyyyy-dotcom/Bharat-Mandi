import React from 'react';
import {
  TrendingUp,
  PlusCircle,
  Users,
  Headphones,
} from 'lucide-react';
import { useMandi } from '../../context/MandiContext';

export const MobileBottomNav: React.FC = () => {
  const {
    merchantTab,
    setMerchantTab,
    t,
  } = useMandi();

  return (
    <nav
      id="bottom-navigation-bar"
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg no-print safe-bottom-padding md:hidden"
    >
      <div className="grid grid-cols-4 w-full items-center justify-between h-16 px-0.5">
        {/* 1. Dashboard */}
        <button
          type="button"
          id="mobile-tab-dashboard"
          onClick={() => setMerchantTab('dashboard')}
          className={`flex flex-col items-center justify-center w-full h-full py-1 transition min-touch-target cursor-pointer ${
            merchantTab === 'dashboard'
              ? 'text-[#1a3a52] font-black'
              : 'text-slate-500 hover:text-[#1e293b]'
          }`}
        >
          <TrendingUp className={`w-5 h-5 ${merchantTab === 'dashboard' ? 'stroke-[2.5] text-[#1a3a52]' : ''}`} />
          <span className="text-[10px] mt-0.5 leading-none font-bold truncate">
            {t('tabDashboard')}
          </span>
        </button>

        {/* 2. New Sale */}
        <button
          type="button"
          id="mobile-tab-new-sale"
          onClick={() => setMerchantTab('new-sale')}
          className={`flex flex-col items-center justify-center w-full h-full py-1 transition min-touch-target cursor-pointer ${
            merchantTab === 'new-sale'
              ? 'text-[#1a3a52] font-black'
              : 'text-slate-500 hover:text-[#1e293b]'
          }`}
        >
          <PlusCircle className={`w-5 h-5 ${merchantTab === 'new-sale' ? 'stroke-[2.5] text-[#1a3a52]' : ''}`} />
          <span className="text-[10px] mt-0.5 leading-none font-bold truncate">
            {t('tabNewSale')}
          </span>
        </button>

        {/* 3. Farmers */}
        <button
          type="button"
          id="mobile-tab-farmers"
          onClick={() => setMerchantTab('farmers')}
          className={`flex flex-col items-center justify-center w-full h-full py-1 transition min-touch-target cursor-pointer ${
            merchantTab === 'farmers'
              ? 'text-[#1a3a52] font-black'
              : 'text-slate-500 hover:text-[#1e293b]'
          }`}
        >
          <Users className={`w-5 h-5 ${merchantTab === 'farmers' ? 'stroke-[2.5] text-[#1a3a52]' : ''}`} />
          <span className="text-[10px] mt-0.5 leading-none font-bold truncate">
            {t('tabFarmers')}
          </span>
        </button>

        {/* 4. Support / Help Desk */}
        <button
          type="button"
          id="mobile-tab-support"
          onClick={() => setMerchantTab('support')}
          className={`flex flex-col items-center justify-center w-full h-full py-1 transition min-touch-target cursor-pointer ${
            merchantTab === 'support'
              ? 'text-[#1a3a52] font-black'
              : 'text-slate-500 hover:text-[#1e293b]'
          }`}
        >
          <Headphones className={`w-5 h-5 ${merchantTab === 'support' ? 'stroke-[2.5] text-[#1a3a52]' : ''}`} />
          <span className="text-[10px] mt-0.5 leading-none font-bold truncate">
            Help Desk
          </span>
        </button>
      </div>
    </nav>
  );
};
