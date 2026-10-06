import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BharatMandiLogo } from './BharatMandiLogo';
import { ArrowRight, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
  holdDurationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  holdDurationMs = 2600,
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / holdDurationMs) * 100));
      setProgress(pct);
      if (elapsed >= holdDurationMs) {
        clearInterval(interval);
        onFinish();
      }
    }, 40);

    return () => clearInterval(interval);
  }, [holdDurationMs, onFinish]);

  return (
    <AnimatePresence>
      <motion.div
        key="splash-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.04 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#FAF8F5] via-[#F4EFE6] to-[#E9DFCF] text-slate-800 p-6 select-none"
      >
        {/* Soft Background Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.15)_0%,rgba(27,77,62,0.06)_60%,transparent_100%)] pointer-events-none" />

        {/* Central Content Box */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative z-10 flex flex-col items-center max-w-sm w-full text-center"
        >
          {/* Logo */}
          <div className="relative mb-6 flex justify-center bg-transparent">
            <img
              src="/bharat_mandi_logo.png"
              alt="भारत मंडी Logo"
              referrerPolicy="no-referrer"
              className="w-56 h-56 sm:w-64 sm:h-64 object-contain drop-shadow-xl bg-transparent"
            />
          </div>

          {/* App Name & Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="space-y-1 mb-4"
          >
            <p className="text-xs sm:text-sm font-bold text-[#134631] tracking-wide">
              कृषि मंडी व्यापार एवं खाता प्रबंधन
            </p>
            <p className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">
              APMC Wholesale Commission &amp; Farmer Khata Ledger
            </p>
          </motion.div>

          {/* Progress Bar & Status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="w-full max-w-xs space-y-2 mt-4"
          >
            <div className="h-1.5 w-full bg-slate-200/80 rounded-full overflow-hidden p-[1px]">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-700 rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ ease: 'linear' }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium px-1">
              <span>Loading ledger & records...</span>
              <span className="font-mono font-bold text-emerald-800">{progress}%</span>
            </div>
          </motion.div>

          {/* Skip / Enter Button for Instant Access */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            onClick={onFinish}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-[#1B4D3E] text-white hover:bg-[#134631] active:scale-95 transition-all shadow-md min-h-[44px]"
          >
            <span>Enter Mandi Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </motion.div>

        {/* Subtle Footer Note */}
        <div className="absolute bottom-4 text-[10px] text-slate-600 font-medium tracking-wide">
          Designed for Mandi Commission Agents, Farmers & Traders
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
