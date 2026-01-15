import { TRPCError } from "@trpc/server";

// ============================================================================
// Types & Configuration
// ============================================================================

export type NotificationPayload = {
  title: string;
  content: string;
  type?: "info" | "warning" | "error" | "success";
  priority?: "low" | "normal" | "high" | "urgent";
};

export type EmailPayload = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
};

export type WebhookPayload = {
  url: string;
  data: Record<string, unknown>;
  headers?: Record<string, string>;
};

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

// Notification queue for batching
const notificationQueue: NotificationPayload[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

// ============================================================================
// Validation Helpers
// ============================================================================

const trimValue = (value: string): string => value.trim();
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required.",
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required.",
    });
  }

  const title = trimValue(input.title);
  const content = trimValue(input.content);

  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`,
    });
  }

  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`,
    });
  }

  return { 
    title, 
    content,
    type: input.type || "info",
    priority: input.priority || "normal",
  };
};

// ============================================================================
// Email Notification (AWS SES)
// ============================================================================

/**
 * Send an email notification via AWS SES
 * Requires AWS credentials to be configured
 * 
 * @param payload - Email details (to, subject, html/text)
 * @returns true if email was sent successfully
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const { to, subject, html, text, replyTo } = payload;
  
  // Check for required AWS config
  const region = process.env.AWS_REGION || "us-east-1";
  const fromEmail = process.env.SES_FROM_EMAIL || process.env.ADMIN_EMAIL;
  
  if (!fromEmail) {
    console.warn("[Email] SES_FROM_EMAIL not configured - email not sent");
    console.log(`[Email] Would send to: ${Array.isArray(to) ? to.join(", ") : to}`);
    console.log(`[Email] Subject: ${subject}`);
    return false;
  }

  try {
    // Dynamic import to avoid loading AWS SDK if not needed
    const { SESClient, SendEmailCommand } = await import("@aws-sdk/client-ses");
    
    const client = new SESClient({ region });
    
    const command = new SendEmailCommand({
      Source: fromEmail,
      Destination: {
        ToAddresses: Array.isArray(to) ? to : [to],
      },
      ReplyToAddresses: replyTo ? [replyTo] : undefined,
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          ...(html && { Html: { Data: html, Charset: "UTF-8" } }),
          ...(text && { Text: { Data: text, Charset: "UTF-8" } }),
        },
      },
    });

    await client.send(command);
    console.log(`[Email] Sent to ${Array.isArray(to) ? to.join(", ") : to}: ${subject}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    return false;
  }
}

// ============================================================================
// Webhook Notification
// ============================================================================

/**
 * Send a webhook notification (Slack, Discord, custom endpoints)
 * 
 * @param payload - Webhook URL and data
 * @returns true if webhook was sent successfully
 */
export async function sendWebhook(payload: WebhookPayload): Promise<boolean> {
  const { url, data, headers = {} } = payload;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error(`[Webhook] Failed: ${response.status} ${response.statusText}`);
      return false;
    }

    console.log(`[Webhook] Sent to ${new URL(url).hostname}`);
    return true;
  } catch (error) {
    console.error("[Webhook] Error:", error);
    return false;
  }
}

/**
 * Send a Slack notification
 * 
 * @param message - Message text
 * @param webhookUrl - Slack webhook URL (or uses SLACK_WEBHOOK_URL env var)
 * @returns true if sent successfully
 */
export async function sendSlackNotification(
  message: string,
  webhookUrl?: string
): Promise<boolean> {
  const url = webhookUrl || process.env.SLACK_WEBHOOK_URL;
  
  if (!url) {
    console.warn("[Slack] SLACK_WEBHOOK_URL not configured");
    return false;
  }

  return sendWebhook({
    url,
    data: {
      text: message,
      username: "JustxEmpower Bot",
      icon_emoji: ":sparkles:",
    },
  });
}

/**
 * Send a Discord notification
 * 
 * @param message - Message content
 * @param webhookUrl - Discord webhook URL (or uses DISCORD_WEBHOOK_URL env var)
 * @returns true if sent successfully
 */
export async function sendDiscordNotification(
  message: string,
  webhookUrl?: string
): Promise<boolean> {
  const url = webhookUrl || process.env.DISCORD_WEBHOOK_URL;
  
  if (!url) {
    console.warn("[Discord] DISCORD_WEBHOOK_URL not configured");
    return false;
  }

  return sendWebhook({
    url,
    data: {
      content: message,
      username: "JustxEmpower",
    },
  });
}

// ============================================================================
// Owner Notification (Multi-channel)
// ============================================================================

/**
 * Sends a notification to the site owner via multiple channels
 * Attempts: Email → Slack → Discord → Console (fallback)
 * 
 * @param payload - Notification title and content
 * @returns true if notification was delivered via at least one channel
 */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  const { title, content, type, priority } = validatePayload(payload);
  
  const priorityEmoji = {
    low: "📝",
    normal: "📬",
    high: "⚠️",
    urgent: "🚨",
  }[priority || "normal"];

  const typeColor = {
    info: "#3498db",
    warning: "#f39c12",
    error: "#e74c3c",
    success: "#27ae60",
  }[type || "info"];

  let delivered = false;

  // Try email first
  const ownerEmail = process.env.ADMIN_EMAIL || process.env.OWNER_EMAIL;
  if (ownerEmail) {
    const emailSent = await sendEmail({
      to: ownerEmail,
      subject: `${priorityEmoji} [JustxEmpower] ${title}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${typeColor}; padding: 20px; color: white;">
            <h1 style="margin: 0; font-size: 24px;">${title}</h1>
          </div>
          <div style="padding: 20px; background: #f8f8f7; border: 1px solid #e0e0e0;">
            <p style="white-space: pre-wrap; line-height: 1.6;">${content}</p>
          </div>
          <div style="padding: 15px; background: #1a1a19; color: #858481; font-size: 12px; text-align: center;">
            Just Empower™ Notification System
          </div>
        </div>
      `,
      text: `${title}\n\n${content}`,
    });
    if (emailSent) delivered = true;
  }

  // Try Slack
  if (process.env.SLACK_WEBHOOK_URL) {
    const slackSent = await sendSlackNotification(
      `${priorityEmoji} *${title}*\n${content.substring(0, 500)}${content.length > 500 ? "..." : ""}`
    );
    if (slackSent) delivered = true;
  }

  // Try Discord
  if (process.env.DISCORD_WEBHOOK_URL) {
    const discordSent = await sendDiscordNotification(
      `${priorityEmoji} **${title}**\n${content.substring(0, 500)}${content.length > 500 ? "..." : ""}`
    );
    if (discordSent) delivered = true;
  }

  // Always log to console as fallback
  console.log(`[Notification] ${priorityEmoji} ${title}`);
  console.log(`  Type: ${type}, Priority: ${priority}`);
  console.log(`  Content: ${content.substring(0, 200)}${content.length > 200 ? "..." : ""}`);
  
  return delivered || true; // Console counts as delivered
}

// ============================================================================
// Batch Notifications
// ============================================================================

/**
 * Queue a notification for batched delivery
 * Useful for high-frequency events to avoid spamming
 * 
 * @param payload - Notification payload
 */
export function queueNotification(payload: NotificationPayload): void {
  notificationQueue.push(validatePayload(payload));
  
  // Auto-flush after 5 minutes or 10 notifications
  if (notificationQueue.length >= 10) {
    flushNotificationQueue();
  } else if (!flushTimeout) {
    flushTimeout = setTimeout(flushNotificationQueue, 5 * 60 * 1000);
  }
}

/**
 * Flush all queued notifications as a digest
 */
export async function flushNotificationQueue(): Promise<void> {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  if (notificationQueue.length === 0) return;

  const notifications = [...notificationQueue];
  notificationQueue.length = 0;

  const digest = notifications
    .map((n) => `• ${n.title}: ${n.content.substring(0, 100)}...`)
    .join("\n");

  await notifyOwner({
    title: `Notification Digest (${notifications.length} items)`,
    content: digest,
    type: "info",
    priority: "low",
  });
}
