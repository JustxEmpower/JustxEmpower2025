'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCw, Lock, Unlock } from 'lucide-react';

interface ReAssessmentTriggerProps {
  daysUntilAvailable: number;
  isAvailable: boolean;
  onRequestReassessment: () => void;
}

/**
 * REASSESSMENT TRIGGER
 * Shows reassessment availability and triggers the flow
 * Displays countdown if not yet available
 */
const ReAssessmentTrigger: React.FC<ReAssessmentTriggerProps> = ({
  daysUntilAvailable,
  isAvailable,
  onRequestReassessment,
}) => {
  const [displayedDays, setDisplayedDays] = useState(daysUntilAvailable);

  useEffect(() => {
    setDisplayedDays(daysUntilAvailable);
  }, [daysUntilAvailable]);

  // Format remaining time
  const formatTimeRemaining = (days: number) => {
    if (days === 0) return 'Available now';
    if (days === 1) return '1 day remaining';
    if (days <= 7) return `${days} days remaining`;
    if (days <= 30) return `${Math.ceil(days / 7)} weeks remaining`;
    return `${Math.ceil(days / 30)} months remaining`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="rounded-2xl overflow-hidden shadow-lg border-2"
      style={{
        borderColor: isAvailable ? '#10b981' : '#f3f4f6',
        background: isAvailable
          ? 'linear-gradient(135deg, #ecfdf520 0%, #f0fdf420 100%)'
          : 'linear-gradient(135deg, #f9fafb20 0%, #f3f4f620 100%)',
      }}
    >
      <div className="px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* LEFT: Icon & Info */}
          <div className="flex items-center gap-6 flex-1">
            {/* ICON */}
            <motion.div
              animate={isAvailable ? { rotate: [0, 360] } : {}}
              transition={
                isAvailable
                  ? { duration: 4, repeat: Infinity, ease: 'linear' }
                  : { duration: 0 }
              }
              className="p-4 rounded-full flex-shrink-0"
              style={{
                background: isAvailable ? '#d1fae5' : '#f3f4f6',
              }}
            >
              {isAvailable ? (
                <Unlock className="w-8 h-8 text-emerald-600" />
              ) : (
                <Lock className="w-8 h-8 text-slate-400" />
              )}
            </motion.div>

            {/* CONTENT */}
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">
                {isAvailable ? 'Re-Assessment Available' : 'Re-Assessment Locked'}
              </h3>

              <div className="space-y-2">
                {isAvailable ? (
                  <>
                    <p className="text-slate-600">You've journeyed far. It's time to see how you've grown.</p>
                    <p className="text-sm text-emerald-700 font-semibold">
                      Take a new 90-day assessment to track your evolution through the phases.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-slate-600">
                      Reassessments unlock every 90 days to track your deepening integration.
                    </p>
                    <motion.p
                      className="text-sm font-semibold text-slate-700"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {formatTimeRemaining(displayedDays)}
                    </motion.p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: CTA Buttons */}
          <div className="flex flex-col gap-3 w-full md:w-auto">
            {isAvailable ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRequestReassessment}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-bold text-white transition-all duration-300 shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
                }}
              >
                <RotateCw className="w-5 h-5" />
                Begin Re-Assessment
              </motion.button>
            ) : (
              <>
                <button
                  disabled
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-bold text-slate-400 bg-slate-100 transition-all duration-300 cursor-not-allowed opacity-50"
                >
                  <RotateCw className="w-5 h-5" />
                  Begin Re-Assessment
                </button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onRequestReassessment}
                  className="px-6 py-3 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Request Early
                </motion.button>
              </>
            )}
          </div>
        </div>

        {/* DIVIDER */}
        <div className="border-t border-slate-200 my-6" />

        {/* BOTTOM INFO */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* WHAT TO EXPECT */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <span className="text-lg">◆</span> What to Expect
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              An abbreviated 4-domain assessment (~15 minutes) to see how your shadow/threshold/gift spectrum has shifted.
            </p>
          </div>

          {/* WHY REASSESS */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <span className="text-lg">✦</span> Why Reassess
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Track your movement through the 9 phases. Understand which wounds are integrating and where new growth is emerging.
            </p>
          </div>

          {/* YOUR INSIGHTS */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <span className="text-lg">☆</span> Updated Insights
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              A new Mirror Report reflecting your current archetypal expression and integration progress.
            </p>
          </div>
        </motion.div>

        {/* FOOTER NOTE */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 pt-6 border-t border-slate-200"
        >
          <p className="text-xs text-slate-500 italic">
            Reassessment is optional but recommended for tracking your evolution. Available every 90 days from your initial assessment, or upon request in cases of significant life change or readiness for deeper work.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ReAssessmentTrigger;
