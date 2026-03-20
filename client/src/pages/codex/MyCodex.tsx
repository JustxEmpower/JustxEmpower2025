"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Types
interface UserProfile {
  id: string;
  name: string;
  phase: string;
  pathway: string;
  archetype?: string;
}

interface ModuleData {
  id: number;
  title: string;
  description: string;
  content: ContentBlock[];
  reflectionPrompt?: string;
  resourceLinks?: string[];
  audioUrl?: string;
  videoUrl?: string;
}

interface ContentBlock {
  type: "text" | "audio" | "video" | "image";
  content: string;
  caption?: string;
}

interface ModuleProgress {
  moduleId: number;
  completed: boolean;
  percentComplete: number;
  bookmarked?: boolean;
  notes?: string;
}

interface Practice {
  id: string;
  title: string;
  type: "audio" | "written" | "video";
  duration: string;
  description: string;
  contentUrl?: string;
  relatedPhase?: string;
  relatedArchetype?: string;
}

interface Purchase {
  id: string;
  title: string;
  type: string;
  purchaseDate: string;
  downloadUrl?: string;
}

interface RoutingOutput {
  currentModuleId: number;
  unlockedModules: number[];
  lockedModules: number[];
  pathway: number[];
}

interface MyCodexProps {
  profile: UserProfile;
  routing: RoutingOutput;
  modules: ModuleData[];
  progress: ModuleProgress[];
  practices: Practice[];
  purchases: Purchase[];
  onModuleSelect: (moduleId: number) => void;
  onBookmark: (contentId: string) => void;
  onComplete: (moduleId: number) => void;
  onNavigate: (view: string, params?: any) => void;
}

// Module titles for reference
const MODULE_TITLES = [
  "Voice & Visibility",
  "Relational Patterns",
  "Wound Imprints",
  "Mirror Patterns",
  "Survival Archetypes",
  "Soul Disconnection",
  "Somatic Embodiment",
  "Lineage Imprint",
  "Money Survival",
  "Longing Reclamation",
  "Thresholds",
  "Open-Ended Integration",
  "Masculine Mirror",
  "Abuse Bond Imprint",
  "Escape Power Loops",
  "Womb Mapping",
];

const SENSITIVE_MODULES = [13, 14, 15]; // Masculine Mirror, Abuse Bond, Escape Power

// ============================================================================
// CURRENT MODULE VIEWER
// ============================================================================

interface CurrentModuleViewerProps {
  module: ModuleData;
  progress: ModuleProgress;
  profile: UserProfile;
  onBookmark: (contentId: string) => void;
  onComplete: (moduleId: number) => void;
}

const CurrentModuleViewer: React.FC<CurrentModuleViewerProps> = ({
  module,
  progress,
  profile,
  onBookmark,
  onComplete,
}) => {
  const [showAudio, setShowAudio] = useState(!!module.audioUrl);
  const [notes, setNotes] = useState(progress.notes || "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-codex-parchment/30 border border-codex-gold/20 rounded-lg p-8 md:p-12 space-y-8"
    >
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-xs uppercase tracking-widest text-codex-gold/60">
              Section {module.id}
            </p>
            <h1 className="font-cormorant text-4xl md:text-5xl text-codex-cream">
              {module.title}
            </h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onBookmark(`module-${module.id}`)}
            className={`p-2.5 rounded-lg transition-all ${
              progress.bookmarked
                ? "bg-codex-gold/20 text-codex-gold"
                : "bg-codex-muted/20 text-codex-cream/40 hover:text-codex-gold"
            }`}
          >
            <span className="text-lg">◆</span>
          </motion.button>
        </div>

        <p className="text-codex-cream/70 leading-relaxed max-w-2xl">
          {module.description}
        </p>

        {/* Progress Bar */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-codex-cream/50">Progress</span>
            <span className="text-sm text-codex-gold">{progress.percentComplete}%</span>
          </div>
          <div className="w-full h-1.5 bg-codex-muted/40 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentComplete}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-codex-gold/60 to-codex-gold"
            />
          </div>
        </div>
      </div>

      {/* Content Blocks */}
      <div className="space-y-8 border-t border-codex-gold/10 pt-8">
        {module.content?.map((block, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="space-y-3"
          >
            {block.type === "text" && (
              <div className="prose prose-invert max-w-none">
                <p className="text-codex-cream/80 leading-relaxed font-light">
                  {block.content}
                </p>
                {block.caption && (
                  <p className="text-xs text-codex-cream/40 italic mt-2">
                    {block.caption}
                  </p>
                )}
              </div>
            )}

            {block.type === "audio" && (
              <div className="bg-codex-deep/60 rounded-lg p-4 border border-codex-gold/10">
                <p className="text-xs text-codex-gold/60 mb-3">Audio Reflection</p>
                <audio
                  controls
                  className="w-full h-8"
                  src={block.content}
                  style={{
                    colorScheme: "dark",
                  }}
                />
              </div>
            )}

            {block.type === "video" && (
              <div className="aspect-video bg-codex-deep rounded-lg overflow-hidden border border-codex-gold/10">
                <iframe
                  src={block.content}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            )}

            {block.type === "image" && (
              <figure className="space-y-2">
                <img
                  src={block.content}
                  alt={block.caption || "Module image"}
                  className="w-full rounded-lg border border-codex-gold/10"
                />
                {block.caption && (
                  <figcaption className="text-xs text-codex-cream/40 italic">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            )}
          </motion.div>
        ))}
      </div>

      {/* Reflection Prompt */}
      {module.reflectionPrompt && (
        <div className="border-l-2 border-codex-gold/30 pl-6 py-4 space-y-4">
          <p className="text-xs uppercase tracking-widest text-codex-gold/60">
            Reflection Prompt
          </p>
          <p className="font-cormorant text-lg text-codex-cream/90">
            "{module.reflectionPrompt}"
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Your reflection..."
            className="w-full bg-codex-deep/40 border border-codex-gold/20 rounded-lg p-4 text-codex-cream/70 text-sm placeholder-codex-cream/30 focus:outline-none focus:border-codex-gold/40 resize-none h-24 font-light"
          />
        </div>
      )}

      {/* Resource Links */}
      {module.resourceLinks && module.resourceLinks.length > 0 && (
        <div className="space-y-3 bg-codex-deep/40 rounded-lg p-6 border border-codex-gold/10">
          <p className="text-xs uppercase tracking-widest text-codex-gold/60">
            Resources
          </p>
          <ul className="space-y-2">
            {module.resourceLinks.map((link, idx) => (
              <li key={idx}>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-codex-gold/70 hover:text-codex-gold text-sm underline transition-colors"
                >
                  {link.split("/").pop() || link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-8 border-t border-codex-gold/10">
        <button
          onClick={() => onComplete(module.id)}
          disabled={progress.completed}
          className={`px-6 py-2 rounded-lg text-sm font-light transition-all ${
            progress.completed
              ? "bg-codex-gold/10 text-codex-gold/50 cursor-default"
              : "bg-codex-gold/20 text-codex-gold hover:bg-codex-gold/30"
          }`}
        >
          {progress.completed ? "✓ Completed" : "Mark Complete"}
        </button>

        <div className="flex items-center gap-3">
          <button className="text-codex-cream/40 hover:text-codex-cream/70 text-sm transition-colors">
            Share
          </button>
          <button className="text-codex-cream/40 hover:text-codex-cream/70 text-sm transition-colors">
            Download
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// PATHWAY MAP
// ============================================================================

interface PathwayMapProps {
  pathway: number[];
  currentModuleId: number;
  unlockedModules: number[];
  onModuleSelect: (moduleId: number) => void;
}

const PathwayMap: React.FC<PathwayMapProps> = ({
  pathway,
  currentModuleId,
  unlockedModules,
  onModuleSelect,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-codex-parchment/30 border border-codex-gold/20 rounded-lg p-6 overflow-x-auto"
    >
      <p className="text-xs uppercase tracking-widest text-codex-gold/60 mb-6">
        Your Pathway
      </p>

      <div className="flex items-center gap-2 min-w-max">
        {pathway.map((moduleId, idx) => {
          const isCompleted = moduleId < currentModuleId;
          const isCurrent = moduleId === currentModuleId;
          const isLocked = !unlockedModules.includes(moduleId);

          return (
            <React.Fragment key={moduleId}>
              <motion.button
                whileHover={!isLocked ? { scale: 1.1 } : undefined}
                whileTap={!isLocked ? { scale: 0.95 } : undefined}
                onClick={() => !isLocked && onModuleSelect(moduleId)}
                disabled={isLocked}
                className={`relative flex items-center justify-center w-10 h-10 rounded-full font-cormorant text-sm font-bold transition-all ${
                  isCompleted
                    ? "bg-codex-gold/40 text-codex-gold border border-codex-gold/60"
                    : isCurrent
                    ? "bg-codex-wine/60 text-codex-gold border border-codex-gold/80 shadow-lg shadow-codex-gold/20"
                    : isLocked
                    ? "bg-codex-muted/20 text-codex-cream/30 border border-codex-muted/40 cursor-not-allowed"
                    : "bg-codex-parchment/40 text-codex-cream border border-codex-gold/20 hover:bg-codex-parchment/60"
                }`}
              >
                {isCompleted && <span className="text-xs">✓</span>}
                {isCurrent && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full border border-codex-gold/40"
                  />
                )}
                {isLocked && <span className="text-xs">🔒</span>}
                {!isCompleted && !isCurrent && !isLocked && (
                  <span>{moduleId + 1}</span>
                )}
              </motion.button>

              {idx < pathway.length - 1 && (
                <div
                  className={`w-8 h-0.5 ${
                    isCompleted
                      ? "bg-codex-gold/40"
                      : "bg-codex-gold/10"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex gap-6 mt-4 text-xs text-codex-cream/40">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-codex-gold/40" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-codex-wine/60 border border-codex-gold/60" />
          <span>Current</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs">🔒</span>
          <span>Locked</span>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// MODULE GRID
// ============================================================================

interface ModuleGridProps {
  modules: ModuleData[];
  progress: ModuleProgress[];
  unlockedModules: number[];
  currentModuleId: number;
  onModuleSelect: (moduleId: number) => void;
}

const ModuleGrid: React.FC<ModuleGridProps> = ({
  modules,
  progress,
  unlockedModules,
  currentModuleId,
  onModuleSelect,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="bg-codex-parchment/30 border border-codex-gold/20 rounded-lg p-6"
    >
      <p className="text-xs uppercase tracking-widest text-codex-gold/60 mb-6">
        All Modules
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {modules.map((module, idx) => {
          const isLocked = !unlockedModules.includes(idx + 1);
          const isCurrent = idx + 1 === currentModuleId;
          const moduleProgress = progress.find((p) => p.moduleId === idx + 1);
          const isCompleted = moduleProgress?.completed;
          const isSensitive = SENSITIVE_MODULES.includes(idx + 1);

          return (
            <motion.button
              key={idx}
              whileHover={!isLocked ? { scale: 1.02 } : undefined}
              whileTap={!isLocked ? { scale: 0.98 } : undefined}
              onClick={() => !isLocked && onModuleSelect(idx + 1)}
              disabled={isLocked}
              className={`relative p-4 rounded-lg transition-all group ${
                isCurrent
                  ? "bg-codex-wine/40 border-2 border-codex-gold/80 shadow-lg shadow-codex-gold/20"
                  : isCompleted
                  ? "bg-codex-parchment/40 border-2 border-codex-gold/40"
                  : isLocked
                  ? "bg-codex-muted/10 border border-codex-muted/20 cursor-not-allowed"
                  : "bg-codex-deep/40 border border-codex-gold/20 hover:border-codex-gold/40 hover:bg-codex-parchment/30"
              }`}
            >
              {isLocked && (
                <div className="absolute inset-0 bg-codex-black/60 rounded-lg backdrop-blur-sm flex items-center justify-center">
                  <span className="text-2xl">🔒</span>
                </div>
              )}

              <div className="text-left space-y-2">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-bold text-codex-gold/60">
                    S{idx + 1}
                  </span>
                  {isCompleted && (
                    <span className="text-lg text-codex-gold">✓</span>
                  )}
                  {isCurrent && (
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-xs text-codex-gold"
                    >
                      ◆
                    </motion.span>
                  )}
                </div>

                <p className="font-cormorant text-sm text-codex-cream/80 line-clamp-2">
                  {module.title}
                </p>

                {isSensitive && isLocked && (
                  <p className="text-xs text-codex-ember/60 italic">
                    Requires facilitator
                  </p>
                )}

                {moduleProgress && (
                  <div className="w-full h-1 bg-codex-muted/40 rounded-full overflow-hidden mt-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${moduleProgress.percentComplete}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full bg-codex-gold/60"
                    />
                  </div>
                )}
              </div>

              {isCurrent && (
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-lg border-2 border-codex-gold/40"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

// ============================================================================
// PRACTICES LIBRARY
// ============================================================================

interface PracticesLibraryProps {
  practices: Practice[];
  profile: UserProfile;
}

const PracticesLibrary: React.FC<PracticesLibraryProps> = ({
  practices,
  profile,
}) => {
  const [activeTab, setActiveTab] = useState<"audio" | "written" | "video">(
    "audio"
  );

  const filteredPractices = practices.filter((p) => p.type === activeTab);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="bg-codex-parchment/30 border border-codex-gold/20 rounded-lg p-6"
    >
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-codex-gold/60 mb-4">
            Practices Library
          </p>
          <p className="text-sm text-codex-cream/60">
            Curated for your phase: <span className="text-codex-gold">{profile.phase}</span>
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-codex-gold/10">
          {(["audio", "written", "video"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-light transition-all border-b-2 ${
                activeTab === tab
                  ? "text-codex-gold border-codex-gold/60"
                  : "text-codex-cream/40 border-transparent hover:text-codex-cream/60"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Practice Cards */}
        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {filteredPractices.map((practice, idx) => (
              <motion.div
                key={practice.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-codex-deep/40 border border-codex-gold/10 rounded-lg p-4 hover:border-codex-gold/30 transition-all group cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-cormorant text-sm text-codex-cream/90">
                      {practice.title}
                    </p>
                    <p className="text-xs text-codex-cream/50 mt-1">
                      {practice.duration}
                    </p>
                  </div>
                  <span className="text-xl">
                    {practice.type === "audio" && "♪"}
                    {practice.type === "written" && "✎"}
                    {practice.type === "video" && "▶"}
                  </span>
                </div>
                <p className="text-xs text-codex-cream/40 mt-2 line-clamp-2">
                  {practice.description}
                </p>
                <button className="text-xs text-codex-gold/60 hover:text-codex-gold mt-3 transition-colors">
                  View →
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredPractices.length === 0 && (
            <p className="text-sm text-codex-cream/40 text-center py-6">
              No practices available in this category yet.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// PURCHASES SECTION
// ============================================================================

interface PurchasesSectionProps {
  purchases: Purchase[];
}

const PurchasesSection: React.FC<PurchasesSectionProps> = ({ purchases }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="bg-codex-parchment/30 border border-codex-gold/20 rounded-lg p-6"
    >
      <p className="text-xs uppercase tracking-widest text-codex-gold/60 mb-6">
        Purchases & Downloads
      </p>

      {purchases.length > 0 ? (
        <div className="space-y-3">
          {purchases.map((purchase) => (
            <div
              key={purchase.id}
              className="flex items-center justify-between bg-codex-deep/40 border border-codex-gold/10 rounded-lg p-4 hover:border-codex-gold/30 transition-all"
            >
              <div>
                <p className="text-sm text-codex-cream/90">{purchase.title}</p>
                <p className="text-xs text-codex-cream/40 mt-1">
                  {new Date(purchase.purchaseDate).toLocaleDateString()}
                </p>
              </div>
              {purchase.downloadUrl && (
                <button className="text-codex-gold/60 hover:text-codex-gold transition-colors">
                  ↓ Download
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-codex-cream/40 text-center py-6">
          No purchases yet. Explore the shop for additional resources.
        </p>
      )}
    </motion.div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MyCodex(props: MyCodexProps) {
  const [activeView, setActiveView] = useState<"module" | "all" | "practices">(
    "module"
  );
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const currentModule = props.modules.find(
    (m) => m.id === props.routing.currentModuleId
  );
  const currentProgress = props.progress.find(
    (p) => p.moduleId === props.routing.currentModuleId
  );

  const handleModuleSelect = (moduleId: number) => {
    props.onModuleSelect(moduleId);
  };

  const handleComplete = (moduleId: number) => {
    props.onComplete(moduleId);
    setNotificationMessage("Module marked as complete! ✓");
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleBookmark = (contentId: string) => {
    props.onBookmark(contentId);
    setNotificationMessage("Bookmarked for later ◆");
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  if (!currentModule || !currentProgress) {
    return (
      <div className="min-h-screen bg-codex-deep flex items-center justify-center">
        <p className="text-codex-cream/40">Loading your codex...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-codex-deep pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-3"
        >
          <h1 className="font-cormorant text-5xl md:text-6xl text-codex-cream">
            My Codex
          </h1>
          <p className="text-codex-cream/60">
            Phase: <span className="text-codex-gold">{props.profile.phase}</span> •
            Pathway: <span className="text-codex-gold">{props.profile.pathway}</span>
          </p>
        </motion.div>

        {/* Notification */}
        <AnimatePresence>
          {showNotification && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-codex-gold/10 border border-codex-gold/40 rounded-lg px-4 py-3 text-codex-gold text-sm"
            >
              {notificationMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Selector */}
        <div className="flex gap-2 border-b border-codex-gold/10 pb-4">
          {(
            [
              { id: "module", label: "Current Module" },
              { id: "all", label: "All Modules" },
              { id: "practices", label: "Practices" },
            ] as const
          ).map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`px-4 py-2 text-sm font-light transition-all border-b-2 ${
                activeView === view.id
                  ? "text-codex-gold border-codex-gold/60"
                  : "text-codex-cream/40 border-transparent hover:text-codex-cream/60"
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeView === "module" && (
            <div key="module" className="space-y-8">
              <CurrentModuleViewer
                module={currentModule}
                progress={currentProgress}
                profile={props.profile}
                onBookmark={handleBookmark}
                onComplete={handleComplete}
              />

              <PathwayMap
                pathway={props.routing.pathway}
                currentModuleId={props.routing.currentModuleId}
                unlockedModules={props.routing.unlockedModules}
                onModuleSelect={handleModuleSelect}
              />

              <PracticesLibrary
                practices={props.practices}
                profile={props.profile}
              />

              <PurchasesSection purchases={props.purchases} />
            </div>
          )}

          {activeView === "all" && (
            <div key="all" className="space-y-8">
              <ModuleGrid
                modules={props.modules}
                progress={props.progress}
                unlockedModules={props.routing.unlockedModules}
                currentModuleId={props.routing.currentModuleId}
                onModuleSelect={handleModuleSelect}
              />
            </div>
          )}

          {activeView === "practices" && (
            <div key="practices" className="space-y-8">
              <PracticesLibrary
                practices={props.practices}
                profile={props.profile}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
