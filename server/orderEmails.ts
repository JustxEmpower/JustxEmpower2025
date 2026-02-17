import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "./emailService";

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
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">
        ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">$${(item.total / 100).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Georgia, serif; background: #faf8f5; padding: 40px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; }
    .header { text-align: center; margin-bottom: 32px; }
    .logo { font-size: 24px; font-style: italic; color: #1a1a19; }
    .order-number { background: #faf8f5; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #faf8f5; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
    .totals { margin-top: 24px; text-align: right; }
    .total-row { padding: 8px 0; }
    .grand-total { font-size: 20px; font-weight: bold; border-top: 2px solid #1a1a19; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Just Empower&reg;</div>
      <h2 style="font-weight: normal; font-style: italic;">Order Confirmation</h2>
    </div>
    
    <p>Thank you for your order, ${order.shippingFirstName || 'Valued Customer'}!</p>
    
    <div class="order-number">
      <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666;">Order Number</p>
      <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: bold;">${order.orderNumber}</p>
    </div>
    
    ${items.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th></th>
          <th>Item</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>
    ` : ''}
    
    <div class="totals">
      <div class="total-row">Subtotal: $${(order.subtotal / 100).toFixed(2)}</div>
      ${order.discountAmount ? `<div class="total-row">Discount: -$${(order.discountAmount / 100).toFixed(2)}</div>` : ''}
      ${order.shippingAmount ? `<div class="total-row">Shipping: $${(order.shippingAmount / 100).toFixed(2)}</div>` : ''}
      ${order.taxAmount ? `<div class="total-row">Tax: $${(order.taxAmount / 100).toFixed(2)}</div>` : ''}
      <div class="total-row grand-total">Total: $${(order.total / 100).toFixed(2)}</div>
    </div>
    
    <p style="margin-top: 32px; text-align: center; color: #666; font-size: 14px;">
      Questions? Reply to this email or contact us at support@justxempower.com
    </p>
  </div>
</body>
</html>`;

  try {
    await sendEmail([order.email], `Order Confirmed - ${order.orderNumber}`, html);
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

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Georgia, serif; background: #faf8f5; padding: 40px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; }
    .header { text-align: center; margin-bottom: 32px; }
    .logo { font-size: 24px; font-style: italic; color: #1a1a19; }
    .tracking-box { background: #faf8f5; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
    .tracking-number { font-size: 20px; font-weight: bold; font-family: monospace; margin: 12px 0; }
    .track-button { display: inline-block; background: #1a1a19; color: white; padding: 12px 32px; border-radius: 9999px; text-decoration: none; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Just Empower&reg;</div>
      <h2 style="font-weight: normal; font-style: italic;">Your Order Has Shipped!</h2>
    </div>
    
    <p>Great news, ${order.shippingFirstName || 'Valued Customer'}! Your order <strong>${order.orderNumber}</strong> is on its way.</p>
    
    <div class="tracking-box">
      <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666;">
        ${carrier || 'Tracking Number'}
      </p>
      <p class="tracking-number">${trackingNumber}</p>
      ${trackingUrl ? `<a href="${trackingUrl}" class="track-button">Track Your Package</a>` : ''}
    </div>
    
    <p style="color: #666; font-size: 14px;">
      <strong>Shipping To:</strong><br>
      ${order.shippingFirstName || ''} ${order.shippingLastName || ''}<br>
      ${order.shippingAddress1 || ''}<br>
      ${order.shippingAddress2 ? `${order.shippingAddress2}<br>` : ''}
      ${order.shippingCity || ''}, ${order.shippingState || ''} ${order.shippingPostalCode || ''}<br>
      ${order.shippingCountry || ''}
    </p>
    
    <p style="margin-top: 32px; text-align: center; color: #666; font-size: 14px;">
      Questions about your shipment? Reply to this email.
    </p>
  </div>
</body>
</html>`;

  try {
    await sendEmail([order.email], `Your Order Has Shipped - ${order.orderNumber}`, html);
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

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Georgia, serif; background: #faf8f5; padding: 40px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; }
    .header { text-align: center; margin-bottom: 32px; }
    .logo { font-size: 24px; font-style: italic; color: #1a1a19; }
    .delivered-box { background: #ecfdf5; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; border: 1px solid #a7f3d0; }
    .review-button { display: inline-block; background: #1a1a19; color: white; padding: 12px 32px; border-radius: 9999px; text-decoration: none; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Just Empower&reg;</div>
      <h2 style="font-weight: normal; font-style: italic;">Your Order Has Been Delivered!</h2>
    </div>
    
    <p>Hello ${order.shippingFirstName || 'Valued Customer'},</p>
    <p>Your order <strong>${order.orderNumber}</strong> has been delivered. We hope you love your purchase!</p>
    
    <div class="delivered-box">
      <p style="margin: 0; font-size: 32px;">&#10003;</p>
      <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: bold; color: #065f46;">Delivered Successfully</p>
    </div>
    
    <p style="text-align: center;">
      <a href="https://justxempower.com/shop" class="review-button">Shop Again</a>
    </p>
    
    <p style="margin-top: 32px; text-align: center; color: #666; font-size: 14px;">
      Have an issue with your order? Reply to this email and we'll take care of it.
    </p>
  </div>
</body>
</html>`;

  try {
    await sendEmail([order.email], `Your Order Has Been Delivered - ${order.orderNumber}`, html);
    console.log(`[OrderEmail] Delivery confirmation sent to ${order.email} for ${order.orderNumber}`);
    return true;
  } catch (e: any) {
    console.warn(`[OrderEmail] Failed to send delivery confirmation for ${order.orderNumber}:`, e.message);
    return false;
  }
}
