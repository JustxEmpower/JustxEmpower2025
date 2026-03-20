'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { Milestone } from './MyJourney';

interface GrowthTimelineProps {
  milestones: Milestone[];
  currentPhase: number;
  phaseNames: string[];
  assessmentDate: Date;
  nextReassessmentDate: Date;
}

/**
 * GROWTH TIMELINE
 * Horizontal scrollable timeline with milestone tracking
 * Shows progress from assessment to present and beyond
 */
const GrowthTimeline: React.FC<GrowthTimelineProps> = ({
  milestones,
  currentPhase,
  phaseNames,
  assessmentDate,
  nextReassessmentDate,
}) => {
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);

  // Generate month array from assessment date
  const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
  const startDate = new Date(assessmentDate);
  const today = new Date();

  // Create timeline months
  const timelineMonths = months.map((month, index) => {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + index);
    return { month, date, index };
  });

  // Calculate scroll position based on current date
  const monthsSinceStart = Math.floor(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  const scrollPosition = Math.max(0, monthsSinceStart * 120 - 200); // 120px per month, offset for centering

  // Filter and sort milestones
  const sortedMilestones = [...milestones].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Get milestone icon
  const getMilestoneIcon = (type: string) => {
    const icons: Record<string, string> = {
      assessment: '◆',
      journal: '✎',
      module: '▢',
      streak: '✦',
      reassessment: '☆',
    };
    return icons[type] || '●';
  };

  const getMilestoneColor = (type: string) => {
    const colors: Record<string, string> = {
      assessment: '#3b82f6',
      journal: '#8b5cf6',
      module: '#06b6d4',
      streak: '#f59e0b',
      reassessment: '#10b981',
    };
    return colors[type] || '#6b7280';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="rounded-2xl p-8 border-2 border-slate-200 bg-white shadow-lg"
    >
      <h3 className="text-lg font-bold text-slate-900 mb-8 uppercase tracking-wider">
        Growth Timeline
      </h3>

      {/* TIMELINE VISUAL */}
      <div className="mb-8 overflow-x-auto scrollbar-hide">
        <div className="flex gap-6 min-w-max pb-4" style={{ paddingLeft: '2rem' }}>
          {timelineMonths.map((tm, idx) => {
            const isCurrentMonth = idx === monthsSinceStart;
            const isPast = idx < monthsSinceStart;
            const isReassessmentMonth =
              Math.floor((nextReassessmentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)) === idx;

            return (
              <motion.div
                key={tm.month}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex flex-col items-center gap-4"
              >
                {/* MONTH LABEL */}
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider w-12 text-center">
                  {tm.month}
                </div>

                {/* TIMELINE DOT */}
                <motion.div
                  className="relative"
                  animate={isCurrentMonth ? { scale: [1, 1.2, 1] } : {}}
                  transition={isCurrentMonth ? { duration: 2, repeat: Infinity } : {}}
                >
                  {isReassessmentMonth && (
                    <div className="absolute inset-0 w-6 h-6 rounded-full bg-emerald-200 animate-pulse" />
                  )}
                  <div
                    className={`w-6 h-6 rounded-full border-3 flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isPast ? 'bg-slate-200' : 'bg-white'
                    }`}
                    style={{
                      borderColor: isCurrentMonth ? '#3b82f6' : isPast ? '#cbd5e1' : '#e2e8f0',
                      backgroundColor: isCurrentMonth ? '#3b82f6' : isPast ? '#cbd5e1' : '#ffffff',
                      color: isCurrentMonth ? '#ffffff' : '#64748b',
                    }}
                  >
                    {isCurrentMonth ? '●' : '○'}
                  </div>
                </motion.div>

                {/* PHASE OR MILESTONE LABEL */}
                {isReassessmentMonth && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-bold text-emerald-600 text-center w-12 leading-tight"
                  >
                    Re-assess
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* DIVIDER */}
      <div className="border-t border-slate-200 my-6" />

      {/* MILESTONES LIST */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">
          Your Milestones
        </p>

        {sortedMilestones.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-8 text-center text-slate-500"
          >
            <p className="text-sm">Milestones will appear as you progress through your journey.</p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {sortedMilestones.map((milestone, idx) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: idx * 0.05 }}
                className="border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-all duration-300"
              >
                <button
                  onClick={() => setExpandedMilestone(expandedMilestone === milestone.id ? null : milestone.id)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors duration-200"
                >
                  {/* ICON */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: getMilestoneColor(milestone.type) }}
                  >
                    {getMilestoneIcon(milestone.type)}
                  </div>

                  {/* CONTENT */}
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-slate-900">{milestone.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {milestone.date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  {/* CHEVRON */}
                  <motion.div
                    animate={{
                      rotate: expandedMilestone === milestone.id ? 180 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </motion.div>
                </button>

                {/* EXPANDED DETAILS */}
                <AnimatePresence>
                  {expandedMilestone === milestone.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-200 bg-slate-50 p-4"
                    >
                      <p className="text-sm text-slate-700 leading-relaxed">{milestone.description}</p>
                      {milestone.phase && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <p className="text-xs font-semibold text-slate-600 mb-1">Phase Context</p>
                          <p className="text-sm font-semibold text-slate-900">
                            {phaseNames[milestone.phase - 1] || `Phase ${milestone.phase}`}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* FOOTER NOTE */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 pt-4 border-t border-slate-100"
      >
        <p className="text-xs text-slate-500 italic">
          Track your journey from assessment through integration. Each milestone marks a moment of recognition and growth.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default GrowthTimeline;
