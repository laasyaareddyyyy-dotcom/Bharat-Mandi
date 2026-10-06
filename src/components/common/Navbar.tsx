import React, { useState, useRef } from 'react';
import {
  Search,
  X,
  Calendar,
  Wifi,
  Sprout,
  Loader2,
  Menu,
  Globe,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  PlusCircle,
  Users,
  Store,
  Settings,
  Headphones,
} from 'lucide-react';
import { useMandi } from '../../context/MandiContext';
import { useFirebase } from '../../context/FirebaseContext';
import { getTodayDateString, formatDisplayDate, COMMODITY_CONFIGS } from '../../data/initialData';
import { sounds } from '../../utils/audio';
import { Language, CommodityCategory } from '../../types';
import { LanguageSettingsModal } from './LanguageSettingsModal';
import { getLanguageInfo } from '../../data/indianLanguages';

/* =========================================================================
   NAVBAR COMPONENT: AGRICULTURAL MARKETPLACE SETTLEMENT TRACKER HEADER
   - Centered Logo at top
   - Centered Title & Subtitle
   - One-row Language Buttons directly under Subtitle
   - Operational Action Toolbar below
   ========================================================================= */

export const Navbar: React.FC = () => {
  const {
    merchantProfile,
    portalMode,
    setPortalMode,
    activeSessionDate,
    merchantTab,
    setMerchantTab,
    setDashboardTab,
    consignmentSearchQuery,
    setConsignmentSearchQuery,
    setIsDateSwitcherOpen,
    setIsMobileDrawerOpen,
    userCommodities,
    activeCommodityFilter,
    setActiveCommodityFilter,
    language,
    setLanguage,
    farmers,
    lots,
    shipments,
    payments,
    settlements,
    helpTickets,
    t,
  } = useMandi();

  const {
    user: firebaseUser,
    isSyncing,
    lastSyncedAt,
    signInWithGoogle,
    syncDataToCloud,
  } = useFirebase();

  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const commodityScrollRef = useRef<HTMLDivElement>(null);

  const currentLangInfo = getLanguageInfo(language);

  const scrollCommodityLeft = () => {
    sounds.playBidTick?.();
    if (commodityScrollRef.current) {
      commodityScrollRef.current.scrollBy({ left: -140, behavior: 'smooth' });
    }
  };

  const scrollCommodityRight = () => {
    sounds.playBidTick?.();
    if (commodityScrollRef.current) {
      commodityScrollRef.current.scrollBy({ left: 140, behavior: 'smooth' });
    }
  };

  const handleQuickCloudSync = async () => {
    if (!firebaseUser) {
      try {
        await signInWithGoogle();
      } catch (e) {
        // handled
      }
      return;
    }
    setSyncFeedback('Syncing...');
    const ok = await syncDataToCloud({
      profile: merchantProfile,
      farmers,
      lots,
      shipments,
      payments,
      settlements,
      helpTickets,
    });
    if (ok) {
      setSyncFeedback('✓ Synced!');
      setTimeout(() => setSyncFeedback(null), 2500);
    } else {
      setSyncFeedback('Sync error');
      setTimeout(() => setSyncFeedback(null), 2500);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setConsignmentSearchQuery(val);
    if (val.trim()) {
      setMerchantTab('dashboard');
      setDashboardTab('ledger');
    }
  };

  const handleClearSearch = () => {
    setConsignmentSearchQuery('');
  };

  const handleSwitchCommodity = (category: CommodityCategory) => {
    sounds.playBidTick?.();
    setActiveCommodityFilter(category);
  };

  const shopDisplayTitle = merchantProfile.shopName || merchantProfile.shopNumber
    ? `${merchantProfile.shopName || merchantProfile.shopNumber}${merchantProfile.apmcMarketName ? ` - ${merchantProfile.apmcMarketName}` : ''}`
    : 'Mandi Merchant Ledger';

  return (
    <header className="no-print">
      {/* 1. TOP HEADER SECTION: Centered Logo, Title, Subtitle, and Languages (scrolls with page) */}
      <div className="border-b border-[#132d42] bg-[#1a3a52] pt-2.5 pb-2 px-3 text-center flex flex-col items-center justify-center text-white">
        {/* At the very top, show the logo, centered */}
        <div
          className="cursor-pointer select-none mx-auto mb-1 inline-block"
          onClick={() => {
            setMerchantTab('dashboard');
            setDashboardTab('summary');
          }}
          title="Agricultural Marketplace"
        >
          <img
            src="/bharat_mandi_logo.png"
            alt="Agricultural Marketplace Logo"
            referrerPolicy="no-referrer"
            className="w-12 h-12 sm:w-14 sm:h-14 object-contain mx-auto shrink-0 drop-shadow-xs bg-transparent"
          />
        </div>

        {/* Below the logo, show the title Agricultural Marketplace Settlement Tracker */}
        <h1 className="font-black text-sm sm:text-base md:text-lg tracking-tight text-white leading-tight">
          {t('appHeaderTitle')}
        </h1>

        {/* Below the title, show the subtitle Multi-Commodity Settlement & Ledger for Farmers & Merchants */}
        <p className="text-[10px] sm:text-xs text-slate-200 font-medium mt-0.5 max-w-xl mx-auto leading-snug">
          {t('appHeaderSubtitle')}
        </p>

        {portalMode === 'admin' && (
          <div className="mt-1.5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black uppercase tracking-wider shadow-md">
            <span>APMC Central Admin Portal Active</span>
          </div>
        )}

        {/* Language Settings trigger button */}
        <div className="flex items-center justify-center gap-1.5 mt-2">
          <button
            type="button"
            id="navbar-language-settings-btn"
            onClick={() => {
              sounds.playBidTick?.();
              setIsLangModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 text-[#1a3a52] text-xs font-bold rounded-xl border border-white/40 shadow-2xs transition cursor-pointer select-none group"
            title="Click to open Indian Language Settings"
          >
            <Globe className="w-3.5 h-3.5 text-[#1a3a52] group-hover:rotate-12 transition-transform" />
            <span className="font-black text-slate-900">{currentLangInfo.nativeName}</span>
            {currentLangInfo.nativeName !== currentLangInfo.englishName && (
              <span className="text-[10px] text-slate-600 font-normal">
                ({currentLangInfo.englishName})
              </span>
            )}
            <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold border border-slate-300 ml-0.5">
              {t('changeLanguage')}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-500 group-hover:text-slate-800" />
          </button>
        </div>

        <LanguageSettingsModal
          isOpen={isLangModalOpen}
          onClose={() => setIsLangModalOpen(false)}
          currentLanguage={language}
          onSelectLanguage={(lang) => setLanguage(lang)}
        />
      </div>

      {/* 2. OPERATIONAL TOOLBAR SECTION: Commodity Switcher, Global Search, Session Date, Online Status, Menu (Sticky at Top) */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        {/* COMMODITY SWITCHER or TOTAL SHOP ADDRESS */}
        {userCommodities && userCommodities.length >= 2 ? (
          <div className="w-full sm:w-auto order-first flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shadow-2xs max-w-full relative shrink-0">
            {/* Left Scroll Arrow for 3+ commodities */}
            {userCommodities.length >= 3 && (
              <button
                type="button"
                onClick={scrollCommodityLeft}
                aria-label="Scroll left"
                className="w-6 h-6 rounded-lg bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center shrink-0 shadow-2xs cursor-pointer border border-slate-200 transition"
                title="Scroll commodities left"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-slate-700" />
              </button>
            )}

            <div
              id="navbar-commodity-switcher"
              ref={commodityScrollRef}
              className="flex items-center gap-1.5 overflow-x-auto scroll-smooth touch-pan-x max-w-full py-0.5 px-0.5 text-xs font-bold no-scrollbar min-w-0"
              role="tablist"
              aria-label="Switch Commodity Category"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {userCommodities.map((category) => {
                const config = COMMODITY_CONFIGS[category];
                if (!config) return null;
                const isActive = activeCommodityFilter === category;
                const label =
                  t(`commodity_${category}`) ||
                  (language === 'te'
                    ? config.nameTe.split(' ')[0]
                    : language === 'hi'
                    ? config.nameHi.split(' ')[0]
                    : config.name);

                return (
                  <button
                    key={category}
                    id={`commodity-switch-btn-${category}`}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={(e) => {
                      handleSwitchCommodity(category);
                      e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }}
                    className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer select-none ${
                      isActive
                        ? 'bg-[#1a3a52] text-white shadow-xs scale-[1.02]'
                        : 'bg-white/80 text-slate-700 hover:text-slate-900 hover:bg-white border border-slate-200/60'
                    }`}
                    title={`Switch to ${config.name}`}
                  >
                    <span className="text-sm leading-none shrink-0">{config.icon}</span>
                    <span className="shrink-0">{label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right Scroll Arrow for 3+ commodities */}
            {userCommodities.length >= 3 && (
              <button
                type="button"
                onClick={scrollCommodityRight}
                aria-label="Scroll right"
                className="w-6 h-6 rounded-lg bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center shrink-0 shadow-2xs cursor-pointer border border-slate-200 transition"
                title="Scroll commodities right"
              >
                <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
              </button>
            )}
          </div>
        ) : null}

        {/* TOTAL SHOP ADDRESS */}
        <div className="flex-1 flex items-center gap-2 text-[#1a3a52] text-xs sm:text-sm font-extrabold py-1">
          <span className="text-base shrink-0">{COMMODITY_CONFIGS[userCommodities[0] || 'flowers']?.icon || '🌸'}</span>
          <span className="font-extrabold text-[#1a3a52] text-xs sm:text-sm tracking-tight">
            {shopDisplayTitle}
          </span>
        </div>

        {/* RIGHT SIDE: [Desktop Nav Tabs & Sync Status] */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Desktop Navigation Bar */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 mr-2">
            <button
              type="button"
              id="desktop-nav-dashboard"
              onClick={() => setMerchantTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                merchantTab === 'dashboard'
                  ? 'bg-[#1a3a52] text-white shadow-2xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{t('tabDashboard')}</span>
            </button>

            <button
              type="button"
              id="desktop-nav-newsale"
              onClick={() => setMerchantTab('new-sale')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                merchantTab === 'new-sale'
                  ? 'bg-[#1a3a52] text-white shadow-2xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{t('tabNewSale')}</span>
            </button>

            <button
              type="button"
              id="desktop-nav-farmers"
              onClick={() => setMerchantTab('farmers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                merchantTab === 'farmers'
                  ? 'bg-[#1a3a52] text-white shadow-2xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{t('tabFarmers')}</span>
            </button>

            <button
              type="button"
              id="desktop-nav-support"
              onClick={() => setMerchantTab('support')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                merchantTab === 'support'
                  ? 'bg-[#1a3a52] text-white shadow-2xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>{t('helpDesk')}</span>
            </button>
          </nav>

          {/* Cloud / Offline Sync Status */}
          <button
            type="button"
            id="navbar-cloud-sync-status-btn"
            onClick={handleQuickCloudSync}
            disabled={isSyncing}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
              firebaseUser
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title={
              firebaseUser
                ? `Firebase Online Sync: Active (${lastSyncedAt || 'Live'}). Click to sync.`
                : 'Offline Storage Active. Click to connect Cloud Backup.'
            }
          >
            {isSyncing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1a3a52]" />
            ) : firebaseUser ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ) : (
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span className="text-[11px]">
              {syncFeedback ? syncFeedback : firebaseUser ? 'Online' : 'Offline'}
            </span>
          </button>
        </div>
      </div>
    </div>
  </header>
);
};
