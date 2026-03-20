import { useState, useCallback, useEffect } from 'react';

interface CodexState {
  activeView: 'module' | 'all' | 'practices';
  currentModuleId: number;
  bookmarkedItems: Set<string>;
  completedModules: Set<number>;
  notes: Map<number, string>;
  notifications: Array<{
    id: string;
    message: string;
    type: 'success' | 'info' | 'warning';
  }>;
}

/**
 * useCodexState
 *
 * Manages local state for the MyCodex component:
 * - Active view mode
 * - Bookmarks
 * - Completion tracking (before server sync)
 * - Reflection notes
 * - Notifications
 *
 * Example:
 * ```typescript
 * const {
 *   activeView,
 *   setActiveView,
 *   toggleBookmark,
 *   isBookmarked,
 *   markComplete,
 *   isCompleted,
 *   addNotification,
 *   updateNotes
 * } = useCodexState();
 * ```
 */
export function useCodexState(initialModuleId: number = 1) {
  const [state, setState] = useState<CodexState>({
    activeView: 'module',
    currentModuleId: initialModuleId,
    bookmarkedItems: new Set(),
    completedModules: new Set(),
    notes: new Map(),
    notifications: [],
  });

  // View Management
  const setActiveView = useCallback((view: 'module' | 'all' | 'practices') => {
    setState((prev) => ({
      ...prev,
      activeView: view,
    }));
  }, []);

  // Module Navigation
  const setCurrentModule = useCallback((moduleId: number) => {
    setState((prev) => ({
      ...prev,
      currentModuleId: moduleId,
      activeView: 'module',
    }));
  }, []);

  // Bookmark Management
  const toggleBookmark = useCallback((contentId: string) => {
    setState((prev) => {
      const newBookmarks = new Set(prev.bookmarkedItems);
      if (newBookmarks.has(contentId)) {
        newBookmarks.delete(contentId);
      } else {
        newBookmarks.add(contentId);
      }
      return {
        ...prev,
        bookmarkedItems: newBookmarks,
      };
    });
  }, []);

  const isBookmarked = useCallback((contentId: string) => {
    return state.bookmarkedItems.has(contentId);
  }, [state.bookmarkedItems]);

  // Completion Tracking
  const markComplete = useCallback((moduleId: number) => {
    setState((prev) => {
      const newCompleted = new Set(prev.completedModules);
      newCompleted.add(moduleId);
      return {
        ...prev,
        completedModules: newCompleted,
      };
    });
  }, []);

  const isCompleted = useCallback((moduleId: number) => {
    return state.completedModules.has(moduleId);
  }, [state.completedModules]);

  // Notes Management
  const updateNotes = useCallback((moduleId: number, notes: string) => {
    setState((prev) => {
      const newNotes = new Map(prev.notes);
      if (notes.trim()) {
        newNotes.set(moduleId, notes);
      } else {
        newNotes.delete(moduleId);
      }
      return {
        ...prev,
        notes: newNotes,
      };
    });
  }, []);

  const getNotes = useCallback((moduleId: number) => {
    return state.notes.get(moduleId) || '';
  }, [state.notes]);

  // Notifications
  const addNotification = useCallback(
    (message: string, type: 'success' | 'info' | 'warning' = 'info', duration = 3000) => {
      const id = `notification-${Date.now()}`;
      const notification = { id, message, type };

      setState((prev) => ({
        ...prev,
        notifications: [...prev.notifications, notification],
      }));

      if (duration > 0) {
        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            notifications: prev.notifications.filter((n) => n.id !== id),
          }));
        }, duration);
      }

      return id;
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== id),
    }));
  }, []);

  return {
    // State
    activeView: state.activeView,
    currentModuleId: state.currentModuleId,
    bookmarkedItems: state.bookmarkedItems,
    completedModules: state.completedModules,
    notes: state.notes,
    notifications: state.notifications,

    // View Management
    setActiveView,
    setCurrentModule,

    // Bookmark Management
    toggleBookmark,
    isBookmarked,

    // Completion Tracking
    markComplete,
    isCompleted,

    // Notes Management
    updateNotes,
    getNotes,

    // Notifications
    addNotification,
    removeNotification,
  };
}

/**
 * usePracticeFilter
 *
 * Filters practices based on user profile and type
 */
interface Practice {
  id: string;
  type: 'audio' | 'written' | 'video';
  relatedPhase?: string;
  relatedArchetype?: string;
  [key: string]: any;
}

interface UserProfile {
  phase?: string;
  archetype?: string;
}

export function usePracticeFilter(
  practices: Practice[],
  profile: UserProfile,
  activeType: 'audio' | 'written' | 'video'
) {
  return practices.filter((practice) => {
    // Filter by type
    if (practice.type !== activeType) return false;

    // Filter by phase if specified
    if (profile.phase && practice.relatedPhase) {
      if (practice.relatedPhase !== profile.phase) return false;
    }

    // Filter by archetype if specified
    if (profile.archetype && practice.relatedArchetype) {
      if (practice.relatedArchetype !== profile.archetype) return false;
    }

    return true;
  });
}

/**
 * useModuleProgress
 *
 * Calculates overall progress across modules
 */
interface ModuleProgressData {
  moduleId: number;
  percentComplete: number;
  completed: boolean;
}

export function useModuleProgress(progress: ModuleProgressData[]) {
  const totalModules = 16;
  const completedCount = progress.filter((p) => p.completed).length;
  const averageProgress =
    progress.length > 0
      ? Math.round(progress.reduce((sum, p) => sum + p.percentComplete, 0) / progress.length)
      : 0;

  return {
    totalModules,
    completedCount,
    remainingCount: totalModules - completedCount,
    completionPercentage: Math.round((completedCount / totalModules) * 100),
    averageProgress,
  };
}

/**
 * useUnlockAnimation
 *
 * Detects when modules become unlocked and triggers animations
 */
export function useUnlockAnimation(
  unlockedModules: number[],
  previousUnlocked: number[]
) {
  const newlyUnlocked = unlockedModules.filter(
    (moduleId) => !previousUnlocked.includes(moduleId)
  );

  return {
    hasNewUnlocks: newlyUnlocked.length > 0,
    newlyUnlockedModules: newlyUnlocked,
  };
}
