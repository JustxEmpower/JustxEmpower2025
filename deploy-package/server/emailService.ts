import { getDb } from "./db";
import { emailSettings, analyticsPageViews, aiChatConversations, aiFeedback } from "../drizzle/schema";
import { eq, gte, count, sql } from "drizzle-orm";

/**
 * Email Service for sending weekly analytics reports
 * Supports multiple providers: SendGrid, Mailgun, AWS SES, SMTP
 */

interface WeeklyAnalytics {
  totalPageViews: number;
  uniqueVisitors: number;
  topPages: Array<{ page: string; views: number }>;
  aiConversations: number;
  aiMessages: number;
  aiSatisfactionRate: number;
  positiveFeedback: number;
  negativeFeedback: number;
  topTopics: Array<{ topic: string; count: number }>;
}

/**
 * Get email settings from database
 */
export async function getEmailSettings() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const settings = await db.select().from(emailSettings).limit(1);
  return settings[0] || null;
}

/**
 * Aggregate analytics data for the past week
 */
export async function getWeeklyAnalytics(): Promise<WeeklyAnalytics> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Total page views
  const pageViewsResult = await db
    .select({ count: count() })
    .from(analyticsPageViews)
    .where(gte(analyticsPageViews.timestamp, oneWeekAgo));
  const totalPageViews = pageViewsResult[0]?.count || 0;

  // Unique visitors
  const uniqueVisitorsResult = await db
    .selectDistinct({ visitorId: analyticsPageViews.visitorId })
    .from(analyticsPageViews)
    .where(gte(analyticsPageViews.timestamp, oneWeekAgo));
  const uniqueVisitors = uniqueVisitorsResult.length;

  // Top pages
  const topPagesResult = await db
    .select({
      page: analyticsPageViews.page,
      views: count(),
    })
    .from(analyticsPageViews)
    .where(gte(analyticsPageViews.timestamp, oneWeekAgo))
    .groupBy(analyticsPageViews.page)
    .orderBy(sql`count(*) DESC`)
    .limit(5);
  const topPages = topPagesResult.map((p: any) => ({ page: p.page, views: Number(p.views) }));

  // AI conversations
  const conversationsResult = await db
    .selectDistinct({ sessionId: aiChatConversations.sessionId })
    .from(aiChatConversations)
    .where(gte(aiChatConversations.createdAt, oneWeekAgo));
  const aiConversations = conversationsResult.length;

  // AI messages
  const messagesResult = await db
    .select({ count: count() })
    .from(aiChatConversations)
    .where(gte(aiChatConversations.createdAt, oneWeekAgo));
  const aiMessages = messagesResult[0]?.count || 0;

  // AI feedback
  const positiveFeedbackResult = await db
    .select({ count: count() })
    .from(aiFeedback)
    .where(sql`${aiFeedback.rating} = 'positive' AND ${aiFeedback.createdAt} >= ${oneWeekAgo}`);
  const positiveFeedback = positiveFeedbackResult[0]?.count || 0;

  const negativeFeedbackResult = await db
    .select({ count: count() })
    .from(aiFeedback)
    .where(sql`${aiFeedback.rating} = 'negative' AND ${aiFeedback.createdAt} >= ${oneWeekAgo}`);
  const negativeFeedback = negativeFeedbackResult[0]?.count || 0;

  const totalFeedback = positiveFeedback + negativeFeedback;
  const aiSatisfactionRate = totalFeedback > 0 ? Math.round((positiveFeedback / totalFeedback) * 100) : 0;

  // Top topics
  const topTopicsResult = await db
    .select({
      topic: aiChatConversations.topic,
      count: count(),
    })
    .from(aiChatConversations)
    .where(sql`${aiChatConversations.topic} IS NOT NULL AND ${aiChatConversations.createdAt} >= ${oneWeekAgo}`)
    .groupBy(aiChatConversations.topic)
    .orderBy(sql`count(*) DESC`)
    .limit(5);
  const topTopics = topTopicsResult.map((t: any) => ({ topic: t.topic || "General", count: Number(t.count) }));

  return {
    totalPageViews,
    uniqueVisitors,
    topPages,
    aiConversations,
    aiMessages,
    aiSatisfactionRate,
    positiveFeedback,
    negativeFeedback,
    topTopics,
  };
}

/**
 * Generate HTML email template for weekly report
 */
export function generateWeeklyReportEmail(analytics: WeeklyAnalytics): string {
  const { totalPageViews, uniqueVisitors, topPages, aiConversations, aiMessages, aiSatisfactionRate, positiveFeedback, negativeFeedback, topTopics } = analytics;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Analytics Report</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 400;
      color: #000;
      margin-bottom: 10px;
    }
    .subtitle {
      color: #666;
      font-size: 14px;
      margin-bottom: 30px;
    }
    .metric-card {
      background-color: #f9f9f9;
      border-radius: 6px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .metric-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
      margin-bottom: 8px;
    }
    .metric-value {
      font-size: 32px;
      font-weight: 300;
      color: #000;
      margin-bottom: 5px;
    }
    .metric-label {
      font-size: 13px;
      color: #999;
    }
    .section-title {
      font-size: 18px;
      font-weight: 500;
      color: #000;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    .list-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #eee;
    }
    .list-item:last-child {
      border-bottom: none;
    }
    .list-label {
      color: #333;
      font-size: 14px;
    }
    .list-value {
      color: #000;
      font-weight: 500;
      font-size: 14px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      text-align: center;
      color: #999;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Weekly Analytics Report</h1>
    <p class="subtitle">Your Just Empower™ website performance summary for the past 7 days</p>
    
    <div class="metric-card">
      <div class="metric-title">Total Page Views</div>
      <div class="metric-value">${totalPageViews.toLocaleString()}</div>
      <div class="metric-label">${uniqueVisitors.toLocaleString()} unique visitors</div>
    </div>
    
    <div class="metric-card">
      <div class="metric-title">AI Chat Engagement</div>
      <div class="metric-value">${aiConversations.toLocaleString()}</div>
      <div class="metric-label">${aiMessages.toLocaleString()} total messages · ${aiSatisfactionRate}% satisfaction</div>
    </div>
    
    <h2 class="section-title">Top Pages</h2>
    ${topPages.map((page) => `
      <div class="list-item">
        <span class="list-label">${page.page}</span>
        <span class="list-value">${page.views.toLocaleString()} views</span>
      </div>
    `).join('')}
    
    <h2 class="section-title">Top Conversation Topics</h2>
    ${topTopics.map((topic) => `
      <div class="list-item">
        <span class="list-label">${topic.topic.replace(/-/g, ' ')}</span>
        <span class="list-value">${topic.count} conversations</span>
      </div>
    `).join('')}
    
    <h2 class="section-title">AI Feedback</h2>
    <div class="list-item">
      <span class="list-label">Positive Feedback</span>
      <span class="list-value">${positiveFeedback}</span>
    </div>
    <div class="list-item">
      <span class="list-label">Negative Feedback</span>
      <span class="list-value">${negativeFeedback}</span>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} Just Empower™. All Rights Reserved.</p>
      <p>This is an automated weekly report from your website analytics dashboard.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send email via configured provider
 * This is a placeholder that can be extended with actual email provider integrations
 */
export async function sendEmail(to: string[], subject: string, htmlContent: string): Promise<boolean> {
  const settings = await getEmailSettings();
  
  if (!settings || !settings.emailProvider) {
    console.error("Email settings not configured");
    return false;
  }

  // TODO: Implement actual email sending based on provider
  // For now, just log the email details
  console.log("=== EMAIL WOULD BE SENT ===");
  console.log("Provider:", settings.emailProvider);
  console.log("From:", settings.fromEmail);
  console.log("To:", to.join(", "));
  console.log("Subject:", subject);
  console.log("HTML length:", htmlContent.length);
  console.log("===========================");

  // In production, implement provider-specific logic:
  // - SendGrid: use @sendgrid/mail
  // - Mailgun: use mailgun.js
  // - AWS SES: use @aws-sdk/client-ses
  // - SMTP: use nodemailer

  return true;
}

/**
 * Send weekly analytics report
 */
export async function sendWeeklyReport(): Promise<boolean> {
  const settings = await getEmailSettings();
  
  if (!settings || !settings.weeklyReportEnabled) {
    console.log("Weekly reports are not enabled");
    return false;
  }

  const recipients = settings.reportRecipients ? JSON.parse(settings.reportRecipients) : [];
  if (recipients.length === 0) {
    console.error("No recipients configured for weekly report");
    return false;
  }

  const analytics = await getWeeklyAnalytics();
  const htmlContent = generateWeeklyReportEmail(analytics);
  const subject = `Weekly Analytics Report - ${new Date().toLocaleDateString()}`;

  return await sendEmail(recipients, subject, htmlContent);
}
