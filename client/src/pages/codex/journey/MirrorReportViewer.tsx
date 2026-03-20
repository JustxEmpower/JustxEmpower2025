'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Printer } from 'lucide-react';
import type { MirrorReport } from './MyJourney';

interface MirrorReportViewerProps {
  mirrorReport: MirrorReport;
  archetype: string;
  symbol: string;
  archetypeColor: { deep: string; accent: string };
  onClose: () => void;
}

/**
 * MIRROR REPORT VIEWER
 * Modal/overlay displaying the full mirror report
 * Beautiful, scrollable document with print/download options
 */
const MirrorReportViewer: React.FC<MirrorReportViewerProps> = ({
  mirrorReport,
  archetype,
  symbol,
  archetypeColor,
  onClose,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);
    window.print();
    setTimeout(() => setIsPrinting(false), 1000);
  };

  const handleDownload = () => {
    // Create a simple HTML version for download
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Mirror Report - ${archetype}</title>
        <style>
          body { font-family: Georgia, serif; line-height: 1.8; color: #333; margin: 40px; }
          h1 { text-align: center; font-size: 2.5em; margin-bottom: 10px; }
          .subtitle { text-align: center; font-style: italic; margin-bottom: 40px; color: #666; }
          .section { margin: 30px 0; page-break-inside: avoid; }
          .section-title { font-size: 1.3em; font-weight: bold; margin-bottom: 15px; }
          p { margin: 10px 0; }
          .timestamp { color: #999; font-size: 0.9em; margin-top: 40px; }
        </style>
      </head>
      <body>
        <h1>${archetype}</h1>
        <p class="subtitle">Generated on ${new Date(mirrorReport.timestamp).toLocaleDateString()}</p>

        <div class="section">
          <div class="section-title">Your Archetypal Portrait</div>
          <p>${mirrorReport.archetypePortrait}</p>
        </div>

        <div class="section">
          <div class="section-title">Shadow Expression</div>
          <p>${mirrorReport.shadowExpression}</p>
        </div>

        <div class="section">
          <div class="section-title">Gift Expression</div>
          <p>${mirrorReport.giftExpression}</p>
        </div>

        <div class="section">
          <div class="section-title">Integration Notes</div>
          <p>${mirrorReport.integrationNotes}</p>
        </div>

        <div class="section">
          <div class="section-title">Your Pathway</div>
          <p>${mirrorReport.pathwayDescription}</p>
        </div>

        <p class="timestamp">Generated: ${new Date(mirrorReport.timestamp).toLocaleString()}</p>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mirror-report-${archetype.replace(/\s+/g, '-').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        {/* MODAL */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* HEADER */}
          <motion.div
            className="relative px-8 py-6 border-b-2 flex items-center justify-between"
            style={{
              background: `linear-gradient(135deg, ${archetypeColor.deep}10 0%, ${archetypeColor.accent}05 100%)`,
              borderColor: `${archetypeColor.accent}40`,
            }}
          >
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="text-4xl"
                style={{ filter: `drop-shadow(0 0 15px ${archetypeColor.accent})` }}
              >
                {symbol}
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: archetypeColor.deep }}>
                  {archetype}
                </h2>
                <p className="text-sm text-slate-600">Complete Mirror Report</p>
              </div>
            </div>

            {/* CLOSE BUTTON */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </motion.button>
          </motion.div>

          {/* SCROLLABLE CONTENT */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-8 md:px-12 py-10 space-y-8 prose prose-sm md:prose-base max-w-none">
              {/* PORTRAIT */}
              <section className="space-y-4">
                <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <span style={{ color: archetypeColor.accent }}>▸</span>
                  Your Archetypal Portrait
                </h3>
                <p className="text-slate-700 leading-relaxed italic text-base">
                  {mirrorReport.archetypePortrait}
                </p>
              </section>

              {/* SHADOW EXPRESSION */}
              <section className="space-y-4 p-6 rounded-lg bg-red-50 border border-red-200">
                <h3 className="text-xl font-semibold text-red-900 flex items-center gap-2">
                  <span>◐</span>
                  Shadow Expression
                </h3>
                <p className="text-red-800 leading-relaxed">
                  {mirrorReport.shadowExpression}
                </p>
              </section>

              {/* GIFT EXPRESSION */}
              <section className="space-y-4 p-6 rounded-lg bg-emerald-50 border border-emerald-200">
                <h3 className="text-xl font-semibold text-emerald-900 flex items-center gap-2">
                  <span>✦</span>
                  Gift Expression
                </h3>
                <p className="text-emerald-800 leading-relaxed">
                  {mirrorReport.giftExpression}
                </p>
              </section>

              {/* WOUND CONSTELLATION */}
              <section className="space-y-4">
                <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <span style={{ color: archetypeColor.accent }}>⬟</span>
                  Wound Constellation
                </h3>
                <div className="space-y-3">
                  {mirrorReport.woundConstellation.map((wound, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 rounded-lg bg-slate-50 border border-slate-200"
                    >
                      <p className="font-semibold text-slate-900">{wound}</p>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* INTEGRATION NOTES */}
              <section className="space-y-4">
                <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <span style={{ color: archetypeColor.accent }}>◊</span>
                  Integration Notes
                </h3>
                <p className="text-slate-700 leading-relaxed">
                  {mirrorReport.integrationNotes}
                </p>
              </section>

              {/* PATHWAY */}
              <section className="space-y-4 p-6 rounded-lg" style={{ background: `${archetypeColor.accent}10` }}>
                <h3 className="text-xl font-semibold" style={{ color: archetypeColor.deep }}>
                  Your Pathway Forward
                </h3>
                <p className="text-slate-700 leading-relaxed">
                  {mirrorReport.pathwayDescription}
                </p>
              </section>

              {/* PHASE DESCRIPTION */}
              <section className="space-y-4">
                <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <span style={{ color: archetypeColor.accent }}>☆</span>
                  Your Current Phase
                </h3>
                <p className="text-slate-700 leading-relaxed">
                  {mirrorReport.phaseDescription}
                </p>
              </section>

              {/* FOOTER */}
              <div className="pt-8 border-t border-slate-200 text-center">
                <p className="text-xs text-slate-500">
                  Report generated: {new Date(mirrorReport.timestamp).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-xs text-slate-400 mt-1">Assessment ID: {mirrorReport.assessmentId}</p>
              </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div
            className="px-8 py-4 border-t border-slate-200 flex gap-3 justify-end bg-slate-50"
            style={{ borderTopColor: `${archetypeColor.accent}20` }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-white transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors"
              style={{ background: `linear-gradient(135deg, ${archetypeColor.deep} 0%, ${archetypeColor.accent} 100%)` }}
            >
              <Download className="w-4 h-4" />
              Download
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MirrorReportViewer;
