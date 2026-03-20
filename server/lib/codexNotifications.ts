/**
 * Notification Engine — Powered by SUSTAIN + RECLAIM
 * Complete system for generating, scheduling, and managing notifications
 * with poetic, brand-aligned messaging in the Just Empower voice
 */

// ============ TYPES & ENUMS ============

export enum NotificationType {
  WEEKLY_PROMPT = 'weekly_prompt',
  MILESTONE = 'milestone',
  EVENT_REMINDER = 'event_reminder',
  PHASE_UPDATE = 'phase_update',
  GUIDE_RECOMMENDATION = 'guide_recommendation',
  COMMUNITY = 'community',
  REASSESSMENT_AVAILABLE = 'reassessment_available',
  STREAK_AT_RISK = 'streak_at_risk',
  NEW_MODULE_UNLOCKED = 'new_module_unlocked',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
  scheduledAt: Date;
  sentAt?: Date;
  read: boolean;
}

export interface NotificationPreferences {
  weekly_prompt: boolean;
  milestone: boolean;
  event_reminder: boolean;
  phase_update: boolean;
  guide_recommendation: boolean;
  community: boolean;
  reassessment_available: boolean;
  streak_at_risk: boolean;
  new_module_unlocked: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  archetype: string;
  pathway: string;
  phase: string;
  currentStreak: number;
  totalActivity: number;
  lastActivityAt: Date;
  preferences: NotificationPreferences;
}

export interface EventData {
  id: string;
  title: string;
  date: string;
  time: string;
  facilitator: string;
}

export interface MilestoneData {
  id: string;
  title: string;
  description: string;
  type: string;
  achieved: Date;
}

export interface GuideData {
  id: string;
  title: string;
  topic: string;
  summary: string;
  recommendationReason: string;
}

export interface EventRegistration {
  eventId: string;
  event: EventData;
  registeredAt: Date;
}

export interface RouteAnalysis {
  currentPhase: string;
  recommendedGuides: GuideData[];
  contextualInsights: string;
}

// ============ NOTIFICATION BODY EXAMPLES ============

const notificationBodies = {
  [NotificationType.WEEKLY_PROMPT]: [
    "This week we return to the roots. What soil are you tending to? Reflect on the foundations you're building.",
    "Your flame has been steady for 12 days now. That's not discipline — that's devotion. Keep tending.",
    "Monday means renewal. Before the week sweeps in, pause. What do you need to remember about yourself?",
  ],
  [NotificationType.MILESTONE]: [
    "You've crossed a threshold. This moment marks the difference between who you were and who you're becoming.",
    "Celebration is not vanity—it's acknowledgment. You've earned this milestone. Feel it.",
    "This achievement is proof. Proof that you show up for yourself, even when it's difficult.",
  ],
  [NotificationType.EVENT_REMINDER]: [
    "In just a few hours, you're gathering with your people. Get ready to hold space and be held.",
    "Your circle is waiting. This gathering will remind you why community matters.",
    "The moment is near. Breathe. Center yourself. Your presence is medicine.",
  ],
  [NotificationType.PHASE_UPDATE]: [
    "You've moved. The ground beneath you has shifted into a new season of your journey. Welcome home.",
    "Your reassessment shows growth. You're not the same woman who started. Honor that transformation.",
    "A new phase opens. What you learned before is the foundation. What you build now is the bridge.",
  ],
  [NotificationType.GUIDE_RECOMMENDATION]: [
    "This guide was made for you, in this moment. It arrives exactly when your journey needs it.",
    "We see where you are. This resource meets you there—not where you think you should be.",
    "A teacher appears when the student is ready. Read. Learn. Integrate.",
  ],
  [NotificationType.COMMUNITY]: [
    "Someone in your network is thinking of you. Connection is reaching across the distance.",
    "Your community grows. New faces, same heart. Join the gathering.",
    "You are known. You are seen. Your place in this network is solid and true.",
  ],
  [NotificationType.REASSESSMENT_AVAILABLE]: [
    "You've moved through a cycle. It's time to measure yourself again—not against others, but against your own becoming.",
    "The reassessment door is open. You know more now. You've done more. Step through.",
    "Growth hides itself until you measure it. Come see how far you've come.",
  ],
  [NotificationType.STREAK_AT_RISK]: [
    "It's been quiet. Your streak is sleeping. Wake it gently—even one small act of presence counts.",
    "Life gets loud. But your practice is waiting for you. Come home to yourself.",
    "Just one more moment of attention. That's all it takes to keep the thread alive.",
  ],
  [NotificationType.NEW_MODULE_UNLOCKED]: [
    "You've arrived at a new frontier. This module opens because you've proven you're ready.",
    "Fresh territory awaits. Your preparation has made you capable. Step in with confidence.",
    "A door swings open. What's behind it is yours to explore, now that you've climbed this far.",
  ],
};

// ============ CORE NOTIFICATION GENERATORS ============

/**
 * Generate weekly reflection prompt notification
 * Delivered every Monday morning
 */
export function generateWeeklyPromptNotification(
  profile: UserProfile,
  routing: RouteAnalysis
): Notification {
  const bodies = notificationBodies[NotificationType.WEEKLY_PROMPT];
  const selectedBody = bodies[Math.floor(Math.random() * bodies.length)];

  return {
    id: `weekly-prompt-${Date.now()}`,
    userId: profile.id,
    type: NotificationType.WEEKLY_PROMPT,
    title: `This Week's Reflection Prompt`,
    body: selectedBody,
    actionUrl: `/journal/${routing.currentPhase}/weekly-prompt`,
    priority: 'medium',
    scheduledAt: getNextMonday9AM(),
    read: false,
  };
}

/**
 * Generate milestone earned notification
 * Triggered immediately when milestone is achieved
 */
export function generateMilestoneNotification(milestone: MilestoneData): Notification {
  const bodies = notificationBodies[NotificationType.MILESTONE];
  const selectedBody = bodies[Math.floor(Math.random() * bodies.length)];

  return {
    id: `milestone-${milestone.id}-${Date.now()}`,
    userId: '', // Set by caller
    type: NotificationType.MILESTONE,
    title: `🎖️ ${milestone.title}`,
    body: selectedBody,
    actionUrl: `/achievements/${milestone.id}`,
    priority: 'high',
    scheduledAt: new Date(),
    read: false,
  };
}

/**
 * Generate event reminder notifications
 * Sent 24 hours and 1 hour before registered event
 */
export function generateEventReminder(
  event: EventData,
  registration: EventRegistration,
  minutesBefore: 60 | 1440
): Notification {
  const bodies = notificationBodies[NotificationType.EVENT_REMINDER];
  const selectedBody = bodies[Math.floor(Math.random() * bodies.length)];

  const timeLabel = minutesBefore === 1440 ? '24 hours' : '1 hour';

  return {
    id: `event-reminder-${event.id}-${minutesBefore}min-${Date.now()}`,
    userId: '', // Set by caller
    type: NotificationType.EVENT_REMINDER,
    title: `${timeLabel} until "${event.title}"`,
    body: selectedBody,
    actionUrl: `/events/${event.id}`,
    priority: minutesBefore === 60 ? 'high' : 'medium',
    scheduledAt: calculateEventReminderTime(event, minutesBefore),
    read: false,
  };
}

/**
 * Generate phase update notification
 * Triggered when reassessment shifts user to new phase
 */
export function generatePhaseUpdateNotification(
  profile: UserProfile,
  oldPhase: string,
  newPhase: string
): Notification {
  const bodies = notificationBodies[NotificationType.PHASE_UPDATE];
  const selectedBody = bodies[Math.floor(Math.random() * bodies.length)];

  return {
    id: `phase-update-${newPhase}-${Date.now()}`,
    userId: profile.id,
    type: NotificationType.PHASE_UPDATE,
    title: `Welcome to ${newPhase}`,
    body: selectedBody,
    actionUrl: `/phase/${newPhase}`,
    priority: 'high',
    scheduledAt: new Date(),
    read: false,
  };
}

/**
 * Generate guide recommendation notification
 * Suggested based on recent activity and routing analysis
 */
export function generateGuideRecommendation(
  profile: UserProfile,
  routing: RouteAnalysis
): Notification {
  const guide = routing.recommendedGuides[0];
  if (!guide) {
    throw new Error('No recommended guides available');
  }

  const bodies = notificationBodies[NotificationType.GUIDE_RECOMMENDATION];
  const selectedBody = bodies[Math.floor(Math.random() * bodies.length)];

  return {
    id: `guide-recommendation-${guide.id}-${Date.now()}`,
    userId: profile.id,
    type: NotificationType.GUIDE_RECOMMENDATION,
    title: `Recommended: ${guide.title}`,
    body: selectedBody,
    actionUrl: `/guides/${guide.id}`,
    priority: 'low',
    scheduledAt: new Date(),
    read: false,
  };
}

/**
 * Generate community notification
 * Triggered by community interactions: invites, connections, mentions
 */
export function generateCommunityNotification(
  userId: string,
  actionType: 'invite' | 'connection' | 'mention',
  actorName: string
): Notification {
  const bodies = notificationBodies[NotificationType.COMMUNITY];
  const selectedBody = bodies[Math.floor(Math.random() * bodies.length)];

  const titleMap = {
    invite: `${actorName} invited you to join a circle`,
    connection: `New connection: ${actorName}`,
    mention: `${actorName} mentioned you`,
  };

  return {
    id: `community-${actionType}-${Date.now()}`,
    userId,
    type: NotificationType.COMMUNITY,
    title: titleMap[actionType],
    body: selectedBody,
    actionUrl: `/community/activity`,
    priority: 'medium',
    scheduledAt: new Date(),
    read: false,
  };
}

/**
 * Generate reassessment available notification
 * Sent when enough time has passed for next reassessment cycle
 */
export function generateReassessmentNotification(profile: UserProfile): Notification {
  const bodies = notificationBodies[NotificationType.REASSESSMENT_AVAILABLE];
  const selectedBody = bodies[Math.floor(Math.random() * bodies.length)];

  return {
    id: `reassessment-${profile.id}-${Date.now()}`,
    userId: profile.id,
    type: NotificationType.REASSESSMENT_AVAILABLE,
    title: 'Your Reassessment Awaits',
    body: selectedBody,
    actionUrl: `/reassess`,
    priority: 'medium',
    scheduledAt: new Date(),
    read: false,
  };
}

/**
 * Generate streak at risk alert
 * Triggered when user has not been active for 20+ hours
 */
export function generateStreakAlert(profile: UserProfile, currentStreak: number): Notification {
  const bodies = notificationBodies[NotificationType.STREAK_AT_RISK];
  const selectedBody = bodies[Math.floor(Math.random() * bodies.length)];

  return {
    id: `streak-alert-${profile.id}-${Date.now()}`,
    userId: profile.id,
    type: NotificationType.STREAK_AT_RISK,
    title: `Your ${currentStreak}-day streak is at risk`,
    body: selectedBody,
    actionUrl: `/dashboard`,
    priority: 'high',
    scheduledAt: new Date(),
    read: false,
  };
}

/**
 * Generate module unlock notification
 * Triggered when adaptive learning system unlocks new module
 */
export function generateModuleUnlockNotification(
  profile: UserProfile,
  module: { id: string; title: string; description: string }
): Notification {
  const bodies = notificationBodies[NotificationType.NEW_MODULE_UNLOCKED];
  const selectedBody = bodies[Math.floor(Math.random() * bodies.length)];

  return {
    id: `module-unlock-${module.id}-${Date.now()}`,
    userId: profile.id,
    type: NotificationType.NEW_MODULE_UNLOCKED,
    title: `New Module: ${module.title}`,
    body: selectedBody,
    actionUrl: `/learn/${module.id}`,
    priority: 'medium',
    scheduledAt: new Date(),
    read: false,
  };
}

// ============ SCHEDULER ============

/**
 * Master scheduler — orchestrates all recurring and event-triggered notifications
 * Call this function to set up the complete notification system for a user
 */
export async function scheduleNotifications(
  userId: string,
  profile: UserProfile,
  routing: RouteAnalysis,
  events: EventData[]
): Promise<Notification[]> {
  const scheduledNotifications: Notification[] = [];

  // Check preferences
  const prefs = profile.preferences;

  // 1. Weekly prompt (every Monday 9 AM)
  if (prefs.weekly_prompt) {
    const weeklyPrompt = generateWeeklyPromptNotification(profile, routing);
    weeklyPrompt.userId = userId;
    scheduledNotifications.push(weeklyPrompt);
  }

  // 2. Event reminders (24h and 1h before registered events)
  if (prefs.event_reminder && events.length > 0) {
    for (const event of events) {
      const reminder24h = generateEventReminder(event, { eventId: event.id, event, registeredAt: new Date() }, 1440);
      reminder24h.userId = userId;
      scheduledNotifications.push(reminder24h);

      const reminder1h = generateEventReminder(event, { eventId: event.id, event, registeredAt: new Date() }, 60);
      reminder1h.userId = userId;
      scheduledNotifications.push(reminder1h);
    }
  }

  // 3. Guide recommendation (intelligently timed based on activity)
  if (prefs.guide_recommendation && routing.recommendedGuides.length > 0) {
    const guideRec = generateGuideRecommendation(profile, routing);
    guideRec.userId = userId;
    scheduledNotifications.push(guideRec);
  }

  // 4. Streak alert (24 hours after last activity if no new activity)
  if (prefs.streak_at_risk) {
    const streakAlert = generateStreakAlert(profile, profile.currentStreak);
    streakAlert.userId = userId;
    const alertTime = new Date(profile.lastActivityAt);
    alertTime.setHours(alertTime.getHours() + 24);
    streakAlert.scheduledAt = alertTime;
    scheduledNotifications.push(streakAlert);
  }

  return scheduledNotifications;
}

// ============ HELPER FUNCTIONS ============

function getNextMonday9AM(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilMonday = dayOfWeek === 1 ? 7 : (8 - dayOfWeek) % 7 || 7;

  const nextMonday = new Date(now);
  nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
  nextMonday.setHours(9, 0, 0, 0);

  return nextMonday;
}

function calculateEventReminderTime(event: EventData, minutesBefore: number): Date {
  // Parse event date and time — assumes ISO format or similar
  const eventDateTime = new Date(`${event.date}T${event.time}`);
  const reminderTime = new Date(eventDateTime.getTime() - minutesBefore * 60000);
  return reminderTime;
}

// ============ NOTIFICATION PERSISTENCE (OPTIONAL) ============

/**
 * Save notification to database or persistent storage
 * Implementation depends on your backend setup
 */
export async function persistNotification(notification: Notification): Promise<void> {
  // TODO: Implement database persistence
  // Example:
  // await db.notifications.create(notification);
  console.log('Persisting notification:', notification);
}

/**
 * Fetch user's notification history
 * Supports filtering and pagination
 */
export async function getNotificationHistory(
  userId: string,
  filters?: {
    type?: NotificationType;
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }
): Promise<Notification[]> {
  // TODO: Implement database query
  // Example:
  // const query = db.notifications.where({ userId });
  // if (filters?.type) query = query.where({ type: filters.type });
  // if (filters?.unreadOnly) query = query.where({ read: false });
  // return query.limit(filters?.limit || 20).offset(filters?.offset || 0).toArray();
  return [];
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  // TODO: Implement database update
  // Example:
  // await db.notifications.update(notificationId, { read: true, readAt: new Date() });
  console.log('Marked notification as read:', notificationId);
}

/**
 * Update user notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<void> {
  // TODO: Implement database update
  // Example:
  // await db.users.update(userId, { preferences: { ...existingPrefs, ...preferences } });
  console.log('Updated preferences for user:', userId, preferences);
}

// ============ EXPORTS ============

export {
  NotificationType,
  Notification,
  NotificationPreferences,
  UserProfile,
  EventData,
  MilestoneData,
  GuideData,
  EventRegistration,
  RouteAnalysis,
};
