'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Eye, Calendar, TrendingUp, Zap, BookOpen } from 'lucide-react';
import ArchetypeCard from './ArchetypeCard';
import SpectrumDisplay from './SpectrumDisplay';
import GrowthTimeline from './GrowthTimeline';
import ProgressMarkers from './ProgressMarkers';
import MirrorReportViewer from './MirrorReportViewer';
import ReAssessmentTrigger from './ReAssessmentTrigger';

/**
 * MIRROR REPORT DATA TYPES
 */
export interface MirrorReport {
  assessmentId: string;
  timestamp: string;
  archetypePortrait: string; // 3-4 paragraphs of rich text
  shadowExpression: string;
  giftExpression: string;
  woundConstellation: string[];
  mirrorPatterns: string[];
  nervousSystemProfile: Record<string, number>;
  integrationNotes: string;
  pathwayDescription: string;
  phaseDescription: string;
}

export interface Milestone {
  id: string;
  date: Date;
  title: string;
  description: string;
  type: 'assessment' | 'journal' | 'module' | 'streak' | 'reassessment';
  phase?: number;
}

export interface ProgressData {
  modulesCompleted: number;
  modulesTotal: number;
  journalEntries: number;
  guideSessions: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
}

export interface UserProfile {
  id: string;
  name: string;
  primaryArchetype: string;
  shadowArchetype: string;
  archetypeCluster: string[];
  woundPrioritySet: string[];
  spectrumProfile: {
    shadowPercent: number;
    thresholdPercent: number;
    giftPercent: number;
  };
  siProportion: number;
  scoredPhase: number;
  selfPlacedPhase?: number;
  phaseDescription: string;
}

export interface MyJourneyProps {
  profile: UserProfile;
  mirrorReport: MirrorReport;
  milestones: Milestone[];
  progress: ProgressData;
  streaks: StreakData;
  onViewMirrorReport?: () => void;
  onRequestReassessment?: () => void;
  onNavigate?: (view: string, params?: any) => void;
}

/**
 * ARCHETYPE COLOR PALETTE MAPPING
 * Each archetype has a color pair: deep + accent
 */
const ARCHETYPE_COLORS: Record<string, { deep: string; accent: string }> = {
  'Silent Flame': { deep: '#1a1a2e', accent: '#ff6b35' },
  'Forsaken Child': { deep: '#0f172a', accent: '#e0e7ff' },
  'Pleaser Flame': { deep: '#fce7f3', accent: '#f5f5f5' },
  'Burdened Flame': { deep: '#5c4a2c', accent: '#d4a574' },
  'Drifting One': { deep: '#7f8fa3', accent: '#d1dce6' },
  'Guarded Mystic': { deep: '#312e81', accent: '#c4b5fd' },
  'Spirit-Dimmed': { deep: '#4b5563', accent: '#f3e8ff' },
  'Fault-Bearer': { deep: '#334155', accent: '#b87333' },
  'Shielded One': { deep: '#1e3a5f', accent: '#f0f9ff' },
  'Rational Pilgrim': { deep: '#14532d', accent: '#f5f3ff' },
  'Living Flame': { deep: '#be123c', accent: '#fef3c7' },
  'Rooted Flame': { deep: '#78350f', accent: '#10b981' },
};

/**
 * ARCHETYPE SYMBOLS (Unicode + glyph alternatives)
 */
const ARCHETYPE_SYMBOLS: Record<string, string> = {
  'Silent Flame': '◐',
  'Forsaken Child': '☽',
  'Pleaser Flame': '❦',
  'Burdened Flame': '⚖',
  'Drifting One': '✦',
  'Guarded Mystic': '✧',
  'Spirit-Dimmed': '※',
  'Fault-Bearer': '⬟',
  'Shielded One': '◊',
  'Rational Pilgrim': '◈',
  'Living Flame': '❖',
  'Rooted Flame': '⊕',
};

/**
 * PHASE TIMELINE PHASES (1-9)
 */
const PHASE_NAMES = [
  'The Threshold',
  'The Descent',
  'The Naming',
  'The Mirror',
  'The Void',
  'The Ember',
  'The Integration',
  'The Embodiment',
  'The Offering',
];

const PHASE_MONTHS = [
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
];

/**
 * MAIN COMPONENT: My Journey
 * The sacred mirror where the user sees her archetypal identity and growth
 */
const MyJourney: React.FC<MyJourneyProps> = ({
  profile,
  mirrorReport,
  milestones,
  progress,
  streaks,
  onViewMirrorReport,
  onRequestReassessment,
  onNavigate,
}) => {
  const [showMirrorReport, setShowMirrorReport] = useState(false);
  const [activePhase, setActivePhase] = useState<number>(profile.scoredPhase);

  // Color palette for this archetype
  const archetypeColor = ARCHETYPE_COLORS[profile.primaryArchetype] || ARCHETYPE_COLORS['Living Flame'];
  const archetypeSymbol = ARCHETYPE_SYMBOLS[profile.primaryArchetype] || '◈';

  // Calculate reassessment eligibility (90 days from assessment)
  const assessmentDate = new Date(mirrorReport.timestamp);
  const reassessmentDate = new Date(assessmentDate);
  reassessmentDate.setDate(reassessmentDate.getDate() + 90);
  const daysUntilReassessment = Math.max(0, Math.ceil((reassessmentDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const isReassessmentAvailable = daysUntilReassessment === 0;

  const handleViewMirrorReport = () => {
    setShowMirrorReport(true);
    onViewMirrorReport?.();
  };

  const handleRequestReassessment = () => {
    onRequestReassessment?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen w-full px-4 py-12 md:px-8"
      style={{
        background: `linear-gradient(135deg, ${archetypeColor.deep}05 0%, transparent 100%)`,
      }}
    >
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="mb-16"
      >
        <div className="flex items-center gap-4 mb-6">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="text-5xl"
            style={{ filter: `drop-shadow(0 0 20px ${archetypeColor.accent})` }}
          >
            {archetypeSymbol}
          </motion.div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent">
              My Journey
            </h1>
            <p className="text-slate-600 mt-2">Your archetypal portrait of becoming</p>
          </div>
        </div>
      </motion.div>

      {/* MAIN CONTENT GRID */}
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ARCHETYPE CARD - The Crown Jewel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <ArchetypeCard
            archetype={profile.primaryArchetype}
            symbol={archetypeSymbol}
            archetypeColor={archetypeColor}
            portrait={mirrorReport.archetypePortrait}
            shadowExpression={mirrorReport.shadowExpression}
            giftExpression={mirrorReport.giftExpression}
            wounds={profile.woundPrioritySet}
            woundDescriptions={mirrorReport.woundConstellation}
            onViewFullReport={handleViewMirrorReport}
          />
        </motion.div>

        {/* TWO-COLUMN LAYOUT: Spectrum + Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Spectrum Display (takes 1 column on mobile, 1 on desktop) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="lg:col-span-1"
          >
            <SpectrumDisplay
              shadowPercent={profile.spectrumProfile.shadowPercent}
              thresholdPercent={profile.spectrumProfile.thresholdPercent}
              giftPercent={profile.spectrumProfile.giftPercent}
              siProportion={profile.siProportion}
              scoredPhase={profile.scoredPhase}
              selfPlacedPhase={profile.selfPlacedPhase}
              phaseName={PHASE_NAMES[profile.scoredPhase - 1] || 'The Mirror'}
            />
          </motion.div>

          {/* RIGHT: Growth Timeline (takes 2 columns on desktop) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="lg:col-span-2"
          >
            <GrowthTimeline
              milestones={milestones}
              currentPhase={profile.scoredPhase}
              phaseNames={PHASE_NAMES}
              assessmentDate={assessmentDate}
              nextReassessmentDate={reassessmentDate}
            />
          </motion.div>
        </div>

        {/* PROGRESS MARKERS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <ProgressMarkers
            modulesCompleted={progress.modulesCompleted}
            modulesTotal={progress.modulesTotal}
            journalEntries={progress.journalEntries}
            guideSessions={progress.guideSessions}
            currentStreak={streaks.currentStreak}
            longestStreak={streaks.longestStreak}
          />
        </motion.div>

        {/* REASSESSMENT TRIGGER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <ReAssessmentTrigger
            daysUntilAvailable={daysUntilReassessment}
            isAvailable={isReassessmentAvailable}
            onRequestReassessment={handleRequestReassessment}
          />
        </motion.div>

        {/* BOTTOM CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mt-12 pt-8 border-t border-slate-200"
        >
          <button
            onClick={handleViewMirrorReport}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-slate-900 to-slate-700 text-white hover:shadow-lg hover:shadow-slate-400/30 transition-all duration-300"
          >
            <Eye className="w-5 h-5" />
            View Full Mirror Report
          </button>
          <button
            onClick={() => onNavigate?.('modules')}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg border-2 border-slate-300 text-slate-700 hover:bg-slate-50 transition-all duration-300"
          >
            <BookOpen className="w-5 h-5" />
            Continue Modules
          </button>
        </motion.div>
      </div>

      {/* MIRROR REPORT MODAL */}
      {showMirrorReport && (
        <MirrorReportViewer
          mirrorReport={mirrorReport}
          archetype={profile.primaryArchetype}
          symbol={archetypeSymbol}
          archetypeColor={archetypeColor}
          onClose={() => setShowMirrorReport(false)}
        />
      )}
    </motion.div>
  );
};

export default MyJourney;
