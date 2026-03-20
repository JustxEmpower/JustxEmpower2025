'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, MessageSquare, Users, Flame } from 'lucide-react';

interface ProgressMarkersProps {
  modulesCompleted: number;
  modulesTotal: number;
  journalEntries: number;
  guideSessions: number;
  currentStreak: number;
  longestStreak: number;
}

interface ProgressItem {
  id: string;
  label: string;
  value: number;
  maxValue?: number;
  unit?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

/**
 * PROGRESS MARKERS
 * Stats grid showing modules, journal entries, streaks, etc.
 * Animated counters with icons
 */
const ProgressMarkers: React.FC<ProgressMarkersProps> = ({
  modulesCompleted,
  modulesTotal,
  journalEntries,
  guideSessions,
  currentStreak,
  longestStreak,
}) => {
  const [displayedModules, setDisplayedModules] = useState(0);
  const [displayedJournal, setDisplayedJournal] = useState(0);
  const [displayedSessions, setDisplayedSessions] = useState(0);
  const [displayedStreak, setDisplayedStreak] = useState(0);
  const [displayedLongest, setDisplayedLongest] = useState(0);

  // Animate counters on mount
  useEffect(() => {
    const animateValue = (from: number, to: number, setter: (val: number) => void, delay: number = 0) => {
      const timeout = setTimeout(() => {
        let current = from;
        const increment = Math.ceil(to / 30);
        const interval = setInterval(() => {
          current += increment;
          if (current >= to) {
            setter(to);
            clearInterval(interval);
          } else {
            setter(current);
          }
        }, 30);
      }, delay);
      return timeout;
    };

    const t1 = animateValue(0, modulesCompleted, setDisplayedModules, 0);
    const t2 = animateValue(0, journalEntries, setDisplayedJournal, 100);
    const t3 = animateValue(0, guideSessions, setDisplayedSessions, 200);
    const t4 = animateValue(0, currentStreak, setDisplayedStreak, 300);
    const t5 = animateValue(0, longestStreak, setDisplayedLongest, 400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [modulesCompleted, journalEntries, guideSessions, currentStreak, longestStreak]);

  const items: ProgressItem[] = [
    {
      id: 'modules',
      label: 'Modules Completed',
      value: displayedModules,
      maxValue: modulesTotal,
      icon: <BookOpen className="w-6 h-6" />,
      color: '#3b82f6',
      bgColor: '#dbeafe',
    },
    {
      id: 'journal',
      label: 'Journal Entries',
      value: displayedJournal,
      icon: <MessageSquare className="w-6 h-6" />,
      color: '#8b5cf6',
      bgColor: '#ede9fe',
    },
    {
      id: 'sessions',
      label: 'Guide Sessions',
      value: displayedSessions,
      icon: <Users className="w-6 h-6" />,
      color: '#06b6d4',
      bgColor: '#cffafe',
    },
    {
      id: 'streak-current',
      label: 'Current Streak',
      value: displayedStreak,
      unit: 'days',
      icon: <Flame className="w-6 h-6" />,
      color: '#f59e0b',
      bgColor: '#fef3c7',
    },
    {
      id: 'streak-longest',
      label: 'Longest Streak',
      value: displayedLongest,
      unit: 'days',
      icon: <Flame className="w-6 h-6" />,
      color: '#ec4899',
      bgColor: '#fce7f3',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="rounded-2xl p-8 border-2 border-slate-200 bg-white shadow-lg"
    >
      <h3 className="text-lg font-bold text-slate-900 mb-8 uppercase tracking-wider">
        Progress Markers
      </h3>

      {/* GRID OF MARKERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {items.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1, duration: 0.4 }}
            className="rounded-xl p-6 transition-all duration-300 hover:shadow-md"
            style={{ backgroundColor: item.bgColor }}
          >
            {/* ICON */}
            <motion.div
              className="mb-4 p-3 rounded-lg w-fit"
              style={{ backgroundColor: item.color + '20' }}
            >
              <div style={{ color: item.color }}>{item.icon}</div>
            </motion.div>

            {/* VALUE */}
            <div className="mb-2">
              <div className="flex items-baseline gap-1">
                <motion.span
                  className="text-3xl md:text-4xl font-bold"
                  style={{ color: item.color }}
                  key={item.value}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.3 }}
                >
                  {item.value}
                </motion.span>
                {item.maxValue && (
                  <span className="text-lg text-slate-600">/ {item.maxValue}</span>
                )}
                {item.unit && (
                  <span className="text-sm font-semibold text-slate-600 ml-1">{item.unit}</span>
                )}
              </div>
            </div>

            {/* LABEL */}
            <p className="text-sm font-semibold text-slate-700">{item.label}</p>

            {/* PROGRESS BAR (for module completion) */}
            {item.maxValue && (
              <motion.div
                className="mt-4 w-full h-2 bg-slate-200 rounded-full overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${(item.value / item.maxValue) * 100}%`,
                    backgroundColor: item.color,
                  }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${(item.value / item.maxValue) * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* DIVIDER */}
      <div className="border-t border-slate-200 my-8" />

      {/* SUMMARY INSIGHTS */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* MODULE PROGRESS */}
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-xs font-semibold text-blue-900 uppercase mb-2">Module Progress</p>
          <p className="text-sm text-blue-800">
            {modulesCompleted === modulesTotal ? (
              <span className="font-bold">All modules completed! Begin re-assessment to deepen your journey.</span>
            ) : (
              <span>
                <span className="font-bold">{modulesTotal - modulesCompleted}</span> modules remaining
              </span>
            )}
          </p>
        </div>

        {/* ENGAGEMENT STREAK */}
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-xs font-semibold text-amber-900 uppercase mb-2">Engagement</p>
          <p className="text-sm text-amber-800">
            {currentStreak === 0 ? (
              <span>Start your daily practice today to build momentum.</span>
            ) : (
              <span>
                <span className="font-bold">{currentStreak}</span> day streak — keep the flame alive
              </span>
            )}
          </p>
        </div>
      </motion.div>

      {/* FOOTER NOTE */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-6 pt-4 border-t border-slate-100"
      >
        <p className="text-xs text-slate-500 italic">
          These markers reflect your commitment to the journey. Each completed module, journal entry, and day of practice builds your integration.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default ProgressMarkers;
