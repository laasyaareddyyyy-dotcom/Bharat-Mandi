/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MandiProvider, useMandi } from './context/MandiContext';
import { FirebaseProvider } from './context/FirebaseContext';
import { Navbar } from './components/common/Navbar';
import { ParchiModal } from './components/common/ParchiModal';
import { EditParchiModal } from './components/common/EditParchiModal';
import { GeneratePdfModal } from './components/common/GeneratePdfModal';
import { QRModal } from './components/common/QRModal';
import { SettingsModal } from './components/merchant/SettingsModal';
import { DateSwitcherModal } from './components/common/DateSwitcherModal';
import { ParchiAuditTrailModal } from './components/merchant/ParchiAuditTrailModal';
import { OwnerSignUpModal } from './components/merchant/OwnerSignUpModal';
import { FarmerSignUpModal } from './components/farmer/FarmerSignUpModal';
import { DashboardView } from './components/merchant/DashboardView';
import { NewSaleView } from './components/merchant/NewSaleView';
import { FarmerKathaStatementView } from './components/merchant/FarmerKathaStatementView';
import { PaymentsView } from './components/merchant/PaymentsView';
import { SettlementView } from './components/merchant/SettlementView';
import { SupportView } from './components/merchant/SupportView';
import { FarmerPortalView } from './components/farmer/FarmerPortalView';
import { FlowchartView } from './components/flowchart/FlowchartView';
import { OnboardingAuthScreen } from './components/auth/OnboardingAuthScreen';
import { HelpDeskModal } from './components/helpdesk/HelpDeskModal';
import { SplashScreen } from './components/common/SplashScreen';
import { MobileBottomNav } from './components/navigation/MobileBottomNav';
import { MobileDrawer } from './components/navigation/MobileDrawer';
import { FloatingActionButton } from './components/navigation/FloatingActionButton';
import {
  TrendingUp,
  PlusCircle,
  Users,
  Coins,
  Headphones,
  Wifi,
  ShieldCheck,
} from 'lucide-react';
import { MerchantTab } from './types';

const MainLayout: React.FC = () => {
  const {
    portalMode,
    merchantTab,
    setMerchantTab,
    merchantProfile,
    isOwnerSignUpOpen,
    setIsOwnerSignUpOpen,
    isFarmerSignUpOpen,
    setIsFarmerSignUpOpen,
    isGeneratePdfOpen,
    setIsGeneratePdfOpen,
    activePdfLot,
    setActivePdfLot,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    language,
    t,
  } = useMandi();

  const [showSplash, setShowSplash] = React.useState<boolean>(true);

  const [hasCompletedOnboarding, setHasCompletedOnboarding] = React.useState<boolean>(() => {
    try {
      return (
        localStorage.getItem('bharatmandi_onboarding_completed') === 'true' ||
        localStorage.getItem('phoolmitra_onboarding_completed') === 'true'
      );
    } catch {
      return false;
    }
  });

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} holdDurationMs={500} />;
  }

  if (!hasCompletedOnboarding) {
    return (
      <OnboardingAuthScreen
        onComplete={() => setHasCompletedOnboarding(true)}
      />
    );
  }

  const merchantTabsList: { id: MerchantTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'dashboard',
      label: t('tabDashboard'),
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: 'new-sale',
      label: t('tabNewSale'),
      icon: <PlusCircle className="w-4 h-4" />,
    },
    {
      id: 'farmers',
      label: t('tabFarmers'),
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'payments',
      label: t('tabPayments'),
      icon: <Coins className="w-4 h-4" />,
    },
    {
      id: 'support',
      label: t('helpDesk'),
      icon: <Headphones className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] flex flex-col font-sans">
      {/* Top Fixed Header Navbar */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-4 md:p-6 space-y-4 sm:space-y-6 pb-24 sm:pb-28 md:pb-28">

        {/* View Switcher based on portal mode and tab */}
        <div
          key={portalMode === 'merchant' ? merchantTab : portalMode}
          className="content-area animate-in fade-in duration-200"
        >
          {portalMode === 'farmer' ? (
            <FarmerPortalView />
          ) : portalMode === 'flowchart' ? (
            <FlowchartView />
          ) : (
            <>
              {merchantTab === 'dashboard' && <DashboardView />}
              {merchantTab === 'new-sale' && <NewSaleView />}
              {merchantTab === 'farmers' && <FarmerKathaStatementView />}
              {merchantTab === 'payments' && <PaymentsView />}
              {merchantTab === 'settlement' && <SettlementView />}
              {merchantTab === 'support' && <SupportView />}
            </>
          )}
        </div>
      </main>

      {/* Floating Action Button (FAB) for fast actions */}
      <FloatingActionButton />

      {/* Sticky Mobile Bottom Navigation Bar (Mobile / Phone view) */}
      <MobileBottomNav />

      {/* Footer */}
      <footer className="no-print bg-white border-t border-[#e2e8f0] py-4 px-4 sm:px-6 text-xs text-[#64748b] mt-auto hidden md:block">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1e293b]">भारत MANDI</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-[#1a3a52] font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Wholesale Form C Adathiya Ledger</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 font-mono text-[11px] text-[#1a3a52] bg-[#eef3f7] px-2 py-0.5 rounded-full">
              <Wifi className="w-3 h-3" />
              <span>Offline-First (Browser Stored)</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ParchiModal />
      <EditParchiModal />
      <GeneratePdfModal
        isOpen={isGeneratePdfOpen}
        onClose={() => {
          setIsGeneratePdfOpen(false);
          setActivePdfLot(null);
        }}
        lot={activePdfLot}
      />
      <QRModal />
      <SettingsModal />
      <DateSwitcherModal />
      <ParchiAuditTrailModal />
      <OwnerSignUpModal
        isOpen={isOwnerSignUpOpen}
        onClose={() => setIsOwnerSignUpOpen(false)}
      />
      <FarmerSignUpModal
        isOpen={isFarmerSignUpOpen}
        onClose={() => setIsFarmerSignUpOpen(false)}
      />
      <HelpDeskModal />
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <FirebaseProvider>
      <MandiProvider>
        <MainLayout />
      </MandiProvider>
    </FirebaseProvider>
  );
}
