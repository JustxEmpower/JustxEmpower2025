'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface ArchetypeCardProps {
  archetype: string;
  symbol: string;
  archetypeColor: { deep: string; accent: string };
  portrait: string; // 3-4 paragraphs
  shadowExpression: string;
  giftExpression: string;
  wounds: string[];
  woundDescriptions: string[];
  onViewFullReport: () => void;
}

/**
 * ARCHETYPE CARD
 * The crown jewel of the journey section
 * A beautiful, sacred presentation of the archetype
 */
const ArchetypeCard: React.FC<ArchetypeCardProps> = ({
  archetype,
  symbol,
  archetypeColor,
  portrait,
  shadowExpression,
  giftExpression,
  wounds,
  woundDescriptions,
  onViewFullReport,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl shadow-2xl"
      style={{
        background: `linear-gradient(135deg, ${archetypeColor.deep}00 0%, ${archetypeColor.deep}15 100%)`,
        border: `2px solid ${archetypeColor.accent}40`,
      }}
    >
      {/* BACKGROUND GLOW ELEMENTS */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          background: `radial-gradient(circle at 30% 50%, ${archetypeColor.accent} 0%, transparent 50%)`,
        }}
      />

      {/* CARD CONTENT */}
      <div className="relative z-10 p-8 md:p-12 lg:p-16 space-y-8">
        {/* ARCHETYPE SYMBOL & NAME */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center"
        >
          {/* SYMBOL WITH GLOW */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="text-7xl md:text-8xl mb-6"
            style={{
              filter: `drop-shadow(0 0 30px ${archetypeColor.accent})`,
              textShadow: `0 0 30px ${archetypeColor.accent}80`,
            }}
          >
            {symbol}
          </motion.div>

          <h2 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: archetypeColor.deep }}>
            {archetype}
          </h2>

          {/* ARCHETYPE SUBTITLE/TITLE */}
          <p className="text-lg md:text-xl text-slate-600 italic font-light">
            She Who Remembers Her True Nature
          </p>
        </motion.div>

        {/* PORTRAIT - Rich narrative text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="prose prose-sm md:prose-base max-w-none text-slate-700 leading-relaxed"
        >
          <p className="text-base md:text-lg leading-8 text-slate-700 first-letter:text-2xl first-letter:font-semibold first-letter:mr-1">
            {portrait}
          </p>
        </motion.div>

        {/* SHADOW & GIFT EXPRESSIONS */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-y border-slate-200"
        >
          {/* SHADOW */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Shadow Expression</p>
            <p className="text-lg font-semibold" style={{ color: archetypeColor.deep }}>
              {shadowExpression}
            </p>
          </div>

          {/* GIFT */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Gift Expression</p>
            <p className="text-lg font-semibold" style={{ color: archetypeColor.accent }}>
              {giftExpression}
            </p>
          </div>
        </motion.div>

        {/* WOUND CONSTELLATION */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="space-y-4"
        >
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Wound Constellation</h3>

          <div className="space-y-3">
            {wounds.map((wound, index) => (
              <motion.div
                key={wound}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{ background: `${archetypeColor.accent}10` }}
              >
                <span className="text-lg font-semibold" style={{ color: archetypeColor.accent }}>
                  ●
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{wound}</p>
                  {woundDescriptions[index] && (
                    <p className="text-sm text-slate-600 mt-1">{woundDescriptions[index]}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA BUTTON */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="pt-4"
        >
          <button
            onClick={onViewFullReport}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold text-white transition-all duration-300 hover:shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${archetypeColor.deep} 0%, ${archetypeColor.accent}80 100%)`,
              boxShadow: `0 0 20px ${archetypeColor.accent}30`,
            }}
          >
            View Full Mirror Report
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ArchetypeCard;
