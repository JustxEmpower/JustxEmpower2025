import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendDeliveryConfirmationEmail } from "./orderEmails";

const USPS_OAUTH_URL = "https://apis.usps.com/oauth2/v3/token";
const USPS_TRACKING_URL = "https://apis.usps.com/tracking/v3r2/tracking";

let cachedToken: { access_token: string; expires_at: number } | null = null;

/**
 * Get a valid USPS OAuth2 access token, refreshing if expired.
 */
async function getUspsToken(): Promise<string> {
  const clientId = process.env.USPS_CLIENT_ID;
  const clientSecret = process.env.USPS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("USPS_CLIENT_ID and USPS_CLIENT_SECRET env vars are required");
  }

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expires_at - 60_000) {
    return cachedToken.access_token;
  }

  const res = await fetch(USPS_OAUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`USPS OAuth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + (parseInt(data.expires_in) || 3600) * 1000,
  };

  console.log("[USPS] OAuth token obtained, expires in", data.expires_in, "seconds");
  return cachedToken.access_token;
}

export interface UspsTrackingEvent {
  eventType: string;
  eventTimestamp: string;
  eventCity: string | null;
  eventState: string | null;
  eventZIP: string | null;
  eventCountry: string | null;
  eventCode: string | null;
}

export interface UspsTrackingResult {
  trackingNumber: string;
  status: string;
  statusCategory: string;
  statusSummary: string;
  mailClass: string | null;
  destinationCity: string | null;
  destinationState: string | null;
  destinationZIP: string | null;
  trackingEvents: UspsTrackingEvent[];
  deliveredAt: string | null;
  estimatedDelivery: string | null;
}

/**
 * Fetch real-time tracking details from USPS v3r2 API for a given tracking number.
 * v3r2 uses POST with a JSON array body.
 */
export async function getUspsTracking(trackingNumber: string): Promise<UspsTrackingResult> {
  const token = await getUspsToken();

  const res = await fetch(USPS_TRACKING_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([{ trackingNumber }]),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`USPS Tracking API error (${res.status}): ${text}`);
  }

  const responseArray = await res.json();
  // v3r2 returns an array of TrackingDetail objects
  const data = Array.isArray(responseArray) ? responseArray[0] : responseArray;

  if (!data || data.statusCode === "404") {
    throw new Error(data?.error?.message || "Tracking number not found");
  }

  // Parse tracking events
  const events: UspsTrackingEvent[] = (data.trackingEvents || []).map((e: any) => ({
    eventType: e.eventType || "",
    eventTimestamp: e.GMTTimestamp || e.eventTimestamp || "",
    eventCity: e.eventCity || null,
    eventState: e.eventState || null,
    eventZIP: e.eventZIPCode || null,
    eventCountry: e.eventCountry || null,
    eventCode: e.eventCode || null,
  }));

  // Find delivery timestamp if delivered
  let deliveredAt: string | null = null;
  const deliveryEvent = events.find(
    (e) => e.eventCode === "01" || e.eventType?.toLowerCase().includes("delivered")
  );
  if (deliveryEvent) {
    deliveredAt = deliveryEvent.eventTimestamp;
  }

  // Extract estimated delivery from deliveryDateExpectation
  const dde = data.deliveryDateExpectation;
  const estimatedDelivery = dde?.expectedDeliveryDate || dde?.predictedDeliveryDate || dde?.guaranteedDeliveryDate || null;

  return {
    trackingNumber: data.trackingNumber || trackingNumber,
    status: data.status || "Unknown",
    statusCategory: data.statusCategory || "Unknown",
    statusSummary: data.statusSummary || "",
    mailClass: data.mailClass || null,
    destinationCity: data.destinationCity || null,
    destinationState: data.destinationState || null,
    destinationZIP: data.destinationZIPCode || null,
    trackingEvents: events,
    deliveredAt,
    estimatedDelivery,
  };
}

/**
 * Fetch tracking for an order and auto-update status to "delivered" if USPS confirms delivery.
 * Returns the tracking result.
 */
export async function syncOrderTracking(orderId: number): Promise<UspsTrackingResult | null> {
  const db = await getDb();
  if (!db) return null;

  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, orderId))
    .limit(1);

  if (!order || !order.trackingNumber) return null;

  // Only track USPS shipments
  const carrier = (order.carrier || "").toLowerCase();
  if (carrier && carrier !== "usps") return null;

  try {
    const tracking = await getUspsTracking(order.trackingNumber);

    // Auto-update to delivered if USPS says delivered and order isn't already
    if (
      tracking.statusCategory === "Delivered" &&
      order.status !== "delivered"
    ) {
      await db
        .update(schema.orders)
        .set({
          status: "delivered",
          deliveredAt: tracking.deliveredAt ? new Date(tracking.deliveredAt) : new Date(),
        })
        .where(eq(schema.orders.id, orderId));

      // Send delivery confirmation email
      sendDeliveryConfirmationEmail(orderId).catch((e) =>
        console.warn(`[USPS] Failed to send delivery email for order ${orderId}:`, e)
      );

      // Create admin notification
      await db
        .insert(schema.adminNotifications)
        .values({
          type: "delivery",
          title: `Order ${order.orderNumber} delivered (USPS confirmed)`,
          message: `${order.shippingFirstName} ${order.shippingLastName} — auto-confirmed by USPS tracking`,
          link: "/admin/orders",
          priority: "low",
          relatedId: orderId,
          relatedType: "order",
        })
        .catch(() => {});

      console.log(`[USPS] Order ${order.orderNumber} auto-marked as delivered`);
    }

    return tracking;
  } catch (e: any) {
    console.warn(`[USPS] Tracking failed for ${order.trackingNumber}:`, e.message);
    throw e;
  }
}
