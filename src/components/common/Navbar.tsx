import React, { useState } from 'react';
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

  const currentLangInfo = getLanguageInfo(language);

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

  const shopDisplayTitle = merchantProfile.shopNumber
    ? `${merchantProfile.shopNumber} - ${merchantProfile.apmcMarketName || 'Gudimalkapur Flower Market Yard'}`
    : 'Shop 1 - Gudimalkapur Flower Market Yard';

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
        {/* COMMODITY SWITCHER: Visible when 2 or more commodities are selected */}
        {userCommodities && userCommodities.length >= 2 ? (
          <div
            id="navbar-commodity-switcher"
            className="order-first flex items-center justify-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shadow-2xs gap-1 shrink-0"
            role="tablist"
            aria-label="Switch Commodity Category"
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
                  onClick={() => handleSwitchCommodity(category)}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                    isActive
                      ? 'bg-[#1a3a52] text-white shadow-xs scale-[1.02]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                  title={`Switch to ${config.name}`}
                >
                  <span className="text-sm leading-none">{config.icon}</span>
                  <span className="truncate max-w-[90px] sm:max-w-none">{label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-600 text-xs font-semibold py-1">
            <span className="text-sm">{COMMODITY_CONFIGS[userCommodities[0] || 'flowers']?.icon || '🌸'}</span>
            <span className="truncate max-w-[140px] sm:max-w-none text-slate-700 font-bold">{shopDisplayTitle}</span>
          </div>
        )}

        {/* CENTER: Compact Global Search Bar */}
        <div className="flex-1 min-w-[130px] max-w-xs sm:max-w-sm lg:max-w-md">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              id="global-consignment-search"
              value={consignmentSearchQuery}
              onChange={handleSearchChange}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#1a3a52] focus:outline-none focus:ring-1 focus:ring-[#1a3a52]/20 transition text-[#1e293b] placeholder-slate-400"
            />
            {consignmentSearchQuery && (
              <button
                type="button"
                id="clear-global-search-btn"
                onClick={handleClearSearch}
                className="absolute right-2 p-0.5 rounded-full hover:bg-slate-200 text-slate-500 transition cursor-pointer"
                title="Clear Search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: [Session Date] [Online/Sync] [User Menu ⋮] */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* 1. Session Date Indicator */}
          <button
            id="navbar-date-badge-btn"
            type="button"
            onClick={() => setIsDateSwitcherOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#1a3a52] transition cursor-pointer shadow-2xs group shrink-0 max-w-[140px]"
            title="Active Trading Date. Click to change session date"
          >
            <Calendar className="w-3.5 h-3.5 text-[#1a3a52] shrink-0" />
            <div className="text-left hidden sm:block truncate">
              <span className="block text-[8px] uppercase font-bold text-slate-500 leading-none">
                {activeSessionDate === getTodayDateString() ? 'Live Session' : 'Archive'}
              </span>
              <span className="text-[11px] font-bold font-mono leading-tight block truncate whitespace-nowrap">
                {formatDisplayDate(activeSessionDate)}
              </span>
            </div>
            <span className="sm:hidden text-xs font-bold font-mono whitespace-nowrap truncate">
              {activeSessionDate}
            </span>
          </button>

          {/* 2. Cloud / Offline Sync Status */}
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

          {/* 3. Navigation Menu Drawer Button */}
          <button
            type="button"
            id="navbar-mobile-drawer-btn"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#1a3a52] transition cursor-pointer shadow-2xs shrink-0"
            title="Open Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </header>
);
};
