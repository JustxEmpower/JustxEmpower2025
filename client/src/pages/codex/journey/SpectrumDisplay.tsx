'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface SpectrumDisplayProps {
  shadowPercent: number;
  thresholdPercent: number;
  giftPercent: number;
  siProportion: number;
  scoredPhase: number;
  selfPlacedPhase?: number;
  phaseName: string;
}

/**
 * SPECTRUM DISPLAY
 * Visual breakdown of shadow/threshold/gift distribution
 * Shows SI proportion and phase comparison
 */
const SpectrumDisplay: React.FC<SpectrumDisplayProps> = ({
  shadowPercent,
  thresholdPercent,
  giftPercent,
  siProportion,
  scoredPhase,
  selfPlacedPhase,
  phaseName,
}) => {
  const [animatedShadow, setAnimatedShadow] = useState(0);
  const [animatedThreshold, setAnimatedThreshold] = useState(0);
  const [animatedGift, setAnimatedGift] = useState(0);

  // Animate bars on mount
  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedShadow(shadowPercent);
      setAnimatedThreshold(thresholdPercent);
      setAnimatedGift(giftPercent);
    }, 100);

    return () => clearTimeout(timeout);
  }, [shadowPercent, thresholdPercent, giftPercent]);

  const showPhaseComparison = selfPlacedPhase && selfPlacedPhase !== scoredPhase;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="rounded-2xl p-8 border-2 border-slate-200 bg-white shadow-lg"
    >
      <h3 className="text-lg font-bold text-slate-900 mb-6 uppercase tracking-wider">
        Spectrum Display
      </h3>

      {/* SPECTRUM BARS */}
      <div className="space-y-6 mb-8">
        {/* SHADOW BAR */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold text-slate-700">Shadow</label>
            <span className="text-sm font-bold text-red-600">{Math.round(animatedShadow)}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${animatedShadow}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </div>
        </motion.div>

        {/* THRESHOLD BAR */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold text-slate-700">Threshold</label>
            <span className="text-sm font-bold text-amber-600">{Math.round(animatedThreshold)}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${animatedThreshold}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </div>
        </motion.div>

        {/* GIFT BAR */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold text-slate-700">Gift</label>
            <span className="text-sm font-bold text-emerald-600">{Math.round(animatedGift)}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${animatedGift}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      </div>

      {/* DIVIDER */}
      <div className="border-t border-slate-200 my-6" />

      {/* SI PROPORTION INDICATOR */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-3 mb-8"
      >
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-slate-700">Soul Integration</label>
          <span className="text-sm font-bold text-indigo-600">{siProportion.toFixed(2)}</span>
        </div>
        <p className="text-xs text-slate-500">
          Proportion of gift-integrated responses indicating embodied wholeness
        </p>
      </motion.div>

      {/* DIVIDER */}
      <div className="border-t border-slate-200 my-6" />

      {/* PHASE COMPARISON */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="space-y-4"
      >
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">Current Phase</p>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {scoredPhase}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">{phaseName}</p>
              <p className="text-xs text-slate-600">Scored Phase</p>
            </div>
          </div>
        </div>

        {showPhaseComparison && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-3 rounded-lg bg-amber-50 border border-amber-200"
          >
            <p className="text-xs font-semibold text-amber-900 uppercase mb-2">Mirror Flag</p>
            <p className="text-sm text-amber-800">
              Your self-placed phase (
              <span className="font-bold">{selfPlacedPhase}</span>) differs from scored (
              <span className="font-bold">{scoredPhase}</span>). Explore this divergence in your journaling.
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* FOOTER NOTE */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-6 pt-4 border-t border-slate-100"
      >
        <p className="text-xs text-slate-500 italic">
          This spectrum reflects your current integration of shadow, threshold, and gift expressions across all assessment domains.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default SpectrumDisplay;
