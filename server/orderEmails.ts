import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "./emailService";

const G = "#C9A96E";
const GL = "#D4B97A";
const DK = "#1C1917";
const CR = "#FAF7F2";
const WH = "#FFFDF9";
const TX = "#2D2926";
const TL = "#78716C";
const DV = "#E8E0D4";
const URL = "https://justxempower.com";

function wrap(body: string, preheader = ""): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:${CR};font-family:Georgia,'Times New Roman',serif;color:${TX};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CR};"><tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${WH};border:1px solid ${DV};">
<tr><td style="height:3px;background:${G};font-size:0;" bgcolor="${G}">&nbsp;</td></tr>
<tr><td style="padding:40px 50px 20px;text-align:center;">
  <a href="${URL}" style="text-decoration:none;"><img src="https://justxempower-assets.s3.us-east-1.amazonaws.com/media/brand/logo-r-final.png" alt="Just Empower®" width="180" style="width:180px;height:auto;display:inline-block;" /></a>
  <div style="margin-top:12px;text-align:center;">
    <span style="display:inline-block;width:60px;height:1px;background:${G};vertical-align:middle;"></span>
    <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${G};vertical-align:middle;margin:0 12px;"></span>
    <span style="display:inline-block;width:60px;height:1px;background:${G};vertical-align:middle;"></span>
  </div>
</td></tr>
${body}
<tr><td style="padding:0 50px;"><div style="height:1px;background:${DV};"></div></td></tr>
<tr><td style="padding:30px 50px 40px;text-align:center;">
  <p style="margin:0 0 12px;font-size:13px;color:${TL};font-style:italic;">Rooted in purpose. Designed for you.</p>
  <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:11px;color:${TL};letter-spacing:2px;text-transform:uppercase;">
    <a href="${URL}/shop" style="color:${TL};text-decoration:none;">Shop</a> &nbsp;&bull;&nbsp;
    <a href="${URL}/journal" style="color:${TL};text-decoration:none;">Journal</a> &nbsp;&bull;&nbsp;
    <a href="${URL}/about" style="color:${TL};text-decoration:none;">About</a>
  </p>
  <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#A8A29E;">&copy; 2026 Just Empower&reg; &mdash; All Rights Reserved</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

/**
 * Send order confirmation email to customer after successful payment.
 * Can be called from Stripe webhook or manually from admin dashboard.
 */
export async function sendOrderConfirmationEmail(orderId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).limit(1);
  if (!order || !order.email) return false;

  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId));

  const itemRows = items.map(item => `
    <tr>
      <td style="padding:16px 0;border-bottom:1px solid ${DV};vertical-align:top;width:64px;">
        ${item.imageUrl
          ? `<img src="${item.imageUrl}" alt="${item.name}" width="56" height="56" style="width:56px;height:56px;object-fit:cover;border-radius:4px;border:1px solid ${DV};">`
          : `<div style="width:56px;height:56px;background:${CR};border-radius:4px;border:1px solid ${DV};"></div>`}
      </td>
      <td style="padding:16px 12px;border-bottom:1px solid ${DV};vertical-align:top;">
        <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:14px;color:${DK};">${item.name}</p>
        <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:${TL};">Qty: ${item.quantity}</p>
      </td>
      <td style="padding:16px 0;border-bottom:1px solid ${DV};vertical-align:top;text-align:right;">
        <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:${DK};">$${(item.total / 100).toFixed(2)}</p>
      </td>
    </tr>`).join('');

  const name = order.shippingFirstName || 'Beautiful';

  const content = `
<tr><td style="padding:10px 50px 0;text-align:center;">
  <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${G};">Thank You for Your Order</p>
  <h1 style="margin:16px 0 0;font-family:Georgia,serif;font-size:26px;font-weight:normal;font-style:italic;color:${DK};">Order Confirmation</h1>
</td></tr>
<tr><td style="padding:30px 50px 0;">
  <p style="margin:0;font-size:15px;line-height:1.7;color:${TX};">Dear ${name},</p>
  <p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:${TX};">Something intentional just began &mdash; your order <strong style="color:${DK};">${order.orderNumber}</strong> has been received. What you chose carries meaning, and we are honored to be a part of your journey.</p>
</td></tr>
<tr><td style="padding:28px 50px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CR};border:1px solid ${DV};">
    <tr><td style="padding:24px;text-align:center;">
      <p style="margin:0;font-family:Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${TL};">Order Number</p>
      <p style="margin:10px 0 0;font-family:Georgia,serif;font-size:22px;color:${DK};letter-spacing:1px;">${order.orderNumber}</p>
    </td></tr>
  </table>
</td></tr>
${items.length > 0 ? `
<tr><td style="padding:28px 50px 0;">
  <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${TL};">Your Selections</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
</td></tr>` : ''}
<tr><td style="padding:24px 50px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="padding:8px 0;font-family:Arial,sans-serif;font-size:13px;color:${TL};">Subtotal</td><td style="padding:8px 0;text-align:right;font-size:13px;color:${TX};">$${(order.subtotal / 100).toFixed(2)}</td></tr>
    ${order.discountAmount ? `<tr><td style="padding:8px 0;font-family:Arial,sans-serif;font-size:13px;color:${G};">Discount</td><td style="padding:8px 0;text-align:right;font-size:13px;color:${G};">-$${(order.discountAmount / 100).toFixed(2)}</td></tr>` : ''}
    ${order.shippingAmount ? `<tr><td style="padding:8px 0;font-family:Arial,sans-serif;font-size:13px;color:${TL};">Shipping</td><td style="padding:8px 0;text-align:right;font-size:13px;color:${TX};">$${(order.shippingAmount / 100).toFixed(2)}</td></tr>` : ''}
    ${order.taxAmount ? `<tr><td style="padding:8px 0;font-family:Arial,sans-serif;font-size:13px;color:${TL};">Tax</td><td style="padding:8px 0;text-align:right;font-size:13px;color:${TX};">$${(order.taxAmount / 100).toFixed(2)}</td></tr>` : ''}
    <tr><td colspan="2" style="padding:0;"><div style="height:1px;background:${DK};margin:8px 0;"></div></td></tr>
    <tr><td style="padding:8px 0;font-family:Georgia,serif;font-size:16px;color:${DK};">Total</td><td style="padding:8px 0;text-align:right;font-family:Georgia,serif;font-size:18px;font-weight:bold;color:${DK};">$${(order.total / 100).toFixed(2)}</td></tr>
  </table>
</td></tr>
<tr><td style="padding:32px 50px;text-align:center;">
  <a href="${URL}/shop" style="display:inline-block;background:${DK};color:${WH};font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:14px 40px;">Continue Shopping</a>
</td></tr>
<tr><td style="padding:0 50px 30px;text-align:center;">
  <p style="margin:0;font-size:13px;color:${TL};font-style:italic;">Thank you for trusting Just Empower&reg; with your journey. Questions? <a href="mailto:admin@justxempower.com" style="color:${G};text-decoration:none;">Reach out to us</a> &mdash; we&rsquo;re here for you.</p>
</td></tr>`;

  const html = wrap(content, `Your order ${order.orderNumber} has been confirmed.`);

  try {
    await sendEmail([order.email], `Order Confirmed \u2014 ${order.orderNumber}`, html);
    console.log(`[OrderEmail] Confirmation sent to ${order.email} for ${order.orderNumber}`);
    return true;
  } catch (e: any) {
    console.warn(`[OrderEmail] Failed to send confirmation for ${order.orderNumber}:`, e.message);
    return false;
  }
}

/**
 * Send shipping notification email to customer with tracking info.
 * Called automatically when admin marks order as shipped.
 */
export async function sendShippingNotificationEmail(
  orderId: number,
  trackingNumber: string,
  trackingUrl?: string,
  carrier?: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).limit(1);
  if (!order || !order.email) return false;

  const name = order.shippingFirstName || 'Beautiful';
  const carrierLabel = carrier ? carrier.toUpperCase() : 'CARRIER';

  const content = `
<tr><td style="padding:10px 50px 0;text-align:center;">
  <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${G};">On Its Way to You</p>
  <h1 style="margin:16px 0 0;font-family:Georgia,serif;font-size:26px;font-weight:normal;font-style:italic;color:${DK};">Your Order Has Shipped</h1>
</td></tr>
<tr><td style="padding:30px 50px 0;">
  <p style="margin:0;font-size:15px;line-height:1.7;color:${TX};">Dear ${name},</p>
  <p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:${TX};">It&rsquo;s moving toward you &mdash; order <strong style="color:${DK};">${order.orderNumber}</strong> has been carefully prepared and is now on its way. We can&rsquo;t wait for it to land in your hands.</p>
</td></tr>
<tr><td style="padding:28px 50px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CR};border:1px solid ${DV};">
    <tr><td style="padding:28px;text-align:center;">
      <p style="margin:0;font-family:Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${TL};">${carrierLabel} Tracking</p>
      <p style="margin:12px 0 0;font-family:'Courier New',monospace;font-size:18px;color:${DK};letter-spacing:1px;">${trackingNumber}</p>
      ${trackingUrl ? `<div style="margin-top:20px;"><a href="${trackingUrl}" style="display:inline-block;background:${DK};color:${WH};font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:13px 36px;">Track Your Package</a></div>` : ''}
    </td></tr>
  </table>
</td></tr>
<tr><td style="padding:28px 50px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${DV};">
    <tr><td style="padding:20px 24px;">
      <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${TL};">Shipping To</p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:${TX};">
        ${order.shippingFirstName || ''} ${order.shippingLastName || ''}<br>
        ${order.shippingAddress1 || ''}${order.shippingAddress2 ? `<br>${order.shippingAddress2}` : ''}<br>
        ${order.shippingCity || ''}, ${order.shippingState || ''} ${order.shippingPostalCode || ''}<br>
        ${order.shippingCountry || ''}
      </p>
    </td></tr>
  </table>
</td></tr>
<tr><td style="padding:32px 50px 30px;text-align:center;">
  <p style="margin:0;font-size:13px;color:${TL};font-style:italic;">Thank you for trusting Just Empower&reg; with your journey. We can&rsquo;t wait for this to land in your hands. Questions? <a href="mailto:admin@justxempower.com" style="color:${G};text-decoration:none;">Reach out to us</a>.</p>
</td></tr>`;

  const html = wrap(content, `Your order ${order.orderNumber} is on its way!`);

  try {
    await sendEmail([order.email], `Your Order Has Shipped \u2014 ${order.orderNumber}`, html);
    console.log(`[OrderEmail] Shipping notification sent to ${order.email} for ${order.orderNumber}`);
    return true;
  } catch (e: any) {
    console.warn(`[OrderEmail] Failed to send shipping notification for ${order.orderNumber}:`, e.message);
    return false;
  }
}

/**
 * Send delivery confirmation email to customer.
 * Called automatically when admin marks order as delivered.
 */
export async function sendDeliveryConfirmationEmail(orderId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).limit(1);
  if (!order || !order.email) return false;

  const name = order.shippingFirstName || 'Beautiful';

  const content = `
<tr><td style="padding:10px 50px 0;text-align:center;">
  <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${G};">It&rsquo;s Here</p>
  <h1 style="margin:16px 0 0;font-family:Georgia,serif;font-size:26px;font-weight:normal;font-style:italic;color:${DK};">Your Order Has Arrived</h1>
</td></tr>
<tr><td style="padding:30px 50px 0;">
  <p style="margin:0;font-size:15px;line-height:1.7;color:${TX};">Dear ${name},</p>
  <p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:${TX};">What you&rsquo;ve been waiting for has arrived. Order <strong style="color:${DK};">${order.orderNumber}</strong> has been delivered. May what&rsquo;s inside meet you exactly where you are. You chose something with meaning, and it&rsquo;s now yours.</p>
</td></tr>
<tr><td style="padding:28px 50px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CR};border:1px solid ${DV};">
    <tr><td style="padding:32px;text-align:center;">
      <div style="width:56px;height:56px;margin:0 auto;border-radius:50%;background:${G};text-align:center;line-height:56px;">
        <span style="color:${WH};font-size:28px;">&#10003;</span>
      </div>
      <p style="margin:16px 0 0;font-family:Georgia,serif;font-size:18px;font-style:italic;color:${DK};">Sent with Intention</p>
      <p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:12px;color:${TL};">Order ${order.orderNumber}</p>
    </td></tr>
  </table>
</td></tr>
<tr><td style="padding:28px 50px 0;text-align:center;">
  <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:${TX};">We&rsquo;d love to hear how this finds you. Share your experience &mdash; your voice empowers others on their own journey.</p>
  <a href="${URL}/shop" style="display:inline-block;background:${DK};color:${WH};font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:14px 40px;">Shop New Arrivals</a>
</td></tr>
<tr><td style="padding:32px 50px 30px;text-align:center;">
  <p style="margin:0;font-size:13px;color:${TL};font-style:italic;">Thank you for trusting Just Empower&reg; with your journey. Something not right? <a href="mailto:admin@justxempower.com" style="color:${G};text-decoration:none;">Reach out to us</a> &mdash; we&rsquo;ll take care of everything.</p>
</td></tr>`;

  const html = wrap(content, `Your order ${order.orderNumber} has been delivered!`);

  try {
    await sendEmail([order.email], `Your Order Has Arrived \u2014 ${order.orderNumber}`, html);
    console.log(`[OrderEmail] Delivery confirmation sent to ${order.email} for ${order.orderNumber}`);
    return true;
  } catch (e: any) {
    console.warn(`[OrderEmail] Failed to send delivery confirmation for ${order.orderNumber}:`, e.message);
    return false;
  }
}
