/**
 * Mailchimp Email Templates — Just Empower®
 *
 * Two branded templates that match the transactional email aesthetic:
 *   1. Welcome email   — auto-sent to new subscribers
 *   2. Campaign wrapper — reusable base for all Mailchimp sends
 *
 * Uses Mailchimp merge tags (*|FNAME|*, *|UNSUB|*, etc.) and
 * mc:edit regions for drag-and-drop content editing in campaigns.
 */

// @ts-ignore
import mailchimp from '@mailchimp/mailchimp_marketing';
import { getDb } from './db.js';
import { adminUsers } from '../drizzle/schema.js';
import { sendEmail } from './emailService.js';

// ─── Brand constants (shared with orderEmails.ts) ───────────────────────────
const G  = "#C9A96E";   // gold accent
const GL = "#D4B97A";   // gold lighter
const DK = "#1C1917";   // near-black text
const CR = "#FAF7F2";   // cream background
const WH = "#FFFDF9";   // warm white card
const TX = "#2D2926";   // body text
const TL = "#78716C";   // muted text
const DV = "#E8E0D4";   // divider
const SITE = "https://justxempower.com";
const LOGO = "https://justxempower-assets.s3.us-east-1.amazonaws.com/media/brand/logo-r-final.png";

// ─── Shared header / footer partials ────────────────────────────────────────
function emailHeader(): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>*|MC:SUBJECT|*</title>
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
</head>
<body style="margin:0;padding:0;background:${CR};font-family:Georgia,'Times New Roman',serif;color:${TX};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;">*|MC:SUBJECT|*</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CR};">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${WH};border:1px solid ${DV};">

<!-- Gold accent bar -->
<tr><td style="height:3px;background:${G};font-size:0;" bgcolor="${G}">&nbsp;</td></tr>

<!-- Logo -->
<tr><td style="padding:40px 50px 20px;text-align:center;">
  <a href="${SITE}" style="text-decoration:none;">
    <img src="${LOGO}" alt="Just Empower®" width="180" style="width:180px;height:auto;display:inline-block;" />
  </a>
  <div style="margin-top:12px;text-align:center;">
    <span style="display:inline-block;width:60px;height:1px;background:${G};vertical-align:middle;"></span>
    <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${G};vertical-align:middle;margin:0 12px;"></span>
    <span style="display:inline-block;width:60px;height:1px;background:${G};vertical-align:middle;"></span>
  </div>
</td></tr>`;
}

function emailFooter(): string {
  return `
<!-- Divider -->
<tr><td style="padding:0 50px;"><div style="height:1px;background:${DV};"></div></td></tr>

<!-- Footer -->
<tr><td style="padding:30px 50px 20px;text-align:center;">
  <p style="margin:0 0 12px;font-size:13px;color:${TL};font-style:italic;">Where the soul remembers its original design.</p>
  <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:11px;color:${TL};letter-spacing:2px;text-transform:uppercase;">
    <a href="${SITE}/offerings" style="color:${TL};text-decoration:none;">Offerings</a> &nbsp;&bull;&nbsp;
    <a href="${SITE}/journal" style="color:${TL};text-decoration:none;">She Writes</a> &nbsp;&bull;&nbsp;
    <a href="${SITE}/founder" style="color:${TL};text-decoration:none;">About</a>
  </p>
  <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:11px;color:#A8A29E;">&copy; 2026 Just Empower&reg; &mdash; All Rights Reserved</p>
</td></tr>

<!-- Social + Unsubscribe -->
<tr><td style="padding:0 50px 30px;text-align:center;">
  <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:11px;color:#A8A29E;">
    <a href="https://www.instagram.com/justxempower" style="color:${G};text-decoration:none;">Instagram</a> &nbsp;&bull;&nbsp;
    <a href="https://www.facebook.com/justxempower" style="color:${G};text-decoration:none;">Facebook</a>
  </p>
  <p style="margin:0;font-family:Arial,sans-serif;font-size:10px;color:#C4C0B8;line-height:1.5;">
    You&rsquo;re receiving this because you subscribed at justxempower.com<br>
    *|LIST:ADDRESS|*<br>
    <a href="*|UNSUB|*" style="color:${TL};text-decoration:underline;">Unsubscribe</a> &nbsp;|&nbsp;
    <a href="*|UPDATE_PROFILE|*" style="color:${TL};text-decoration:underline;">Update Preferences</a>
  </p>
</td></tr>

</table>
</td></tr></table>
</body></html>`;
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. WELCOME EMAIL — sent automatically to new subscribers
// ═════════════════════════════════════════════════════════════════════════════
export function getWelcomeTemplate(): string {
  const body = `
<!-- Pre-header label -->
<tr><td style="padding:10px 50px 0;text-align:center;">
  <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${G};">You Were Called Here</p>
  <h1 style="margin:16px 0 0;font-family:Georgia,serif;font-size:26px;font-weight:normal;font-style:italic;color:${DK};">And That Is Not a Small Thing</h1>
</td></tr>

<!-- Body copy -->
<tr><td style="padding:30px 50px 0;">
  <p style="margin:0;font-size:15px;line-height:1.7;color:${TX};">Dear *|FNAME:Beloved|*,</p>
  <p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:${TX};">There are no accidents in becoming. Something inside you stirred &mdash; a quiet knowing, a readiness, a question that needed a different kind of space &mdash; and it led you here. We honor that.</p>
  <p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:${TX};">Just Empower&reg; exists at the intersection of ancient wisdom and lived experience. We are a community rooted in trauma-informed transformation, archetypal self-discovery, and the belief that every soul carries an original design worth returning to. Whether you arrived searching or certain, you belong in this circle.</p>
  <p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:${TX};">This is not a space where empowerment is handed to you. It is a space where it is <em>remembered.</em></p>
</td></tr>

<!-- What to expect box -->
<tr><td style="padding:28px 50px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CR};border:1px solid ${DV};">
    <tr><td style="padding:28px;text-align:center;">
      <p style="margin:0;font-family:Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${TL};">Stay Connected &mdash; More Is Coming</p>
      <div style="margin-top:16px;text-align:left;padding:0 12px;">
        <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:${TX};">&#10047;&ensp; <strong style="color:${DK};">Empowerment</strong> &mdash; not given, but remembered &mdash; a return to the wisdom already living within you</p>
        <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:${TX};">&#10047;&ensp; <strong style="color:${DK};">Rooted Unity&trade;</strong> &mdash; a community of souls in conscious restoration, gathering with intention &mdash; <em>Coming Fall 2026</em></p>
        <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:${TX};">&#10047;&ensp; <strong style="color:${DK};">Sacred Gatherings</strong> &mdash; upcoming events and workshops where real conversations happen and real change follows</p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:${TX};">&#10047;&ensp; <strong style="color:${DK};">She Writes &mdash; the Living Journal</strong> &mdash; reflections on Universal Laws, feminine wisdom, and the science of the soul</p>
      </div>
    </td></tr>
  </table>
</td></tr>

<!-- CTA -->
<tr><td style="padding:32px 50px;text-align:center;">
  <a href="${SITE}/offerings" style="display:inline-block;background:${DK};color:${WH};font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:14px 40px;">Begin Your Journey</a>
</td></tr>

<!-- Closing -->
<tr><td style="padding:0 50px 30px;text-align:center;">
  <p style="margin:0;font-size:13px;color:${TL};font-style:italic;">We do not take lightly the trust it takes to step into something new.<br>You are welcome here &mdash; exactly as you are, and exactly as you are becoming.<br><br>Questions or reflections? <a href="mailto:admin@justxempower.com" style="color:${G};text-decoration:none;">We are here.</a></p>
</td></tr>`;

  return emailHeader() + body + emailFooter();
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. CAMPAIGN TEMPLATE — reusable base for all Mailchimp campaign sends
//    Uses mc:edit regions so content is editable in Mailchimp's editor
// ═════════════════════════════════════════════════════════════════════════════
export function getCampaignTemplate(): string {
  const body = `
<!-- Editable pre-header label -->
<tr><td style="padding:10px 50px 0;text-align:center;" mc:edit="preheader_label">
  <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${G};">From Just Empower&reg;</p>
</td></tr>

<!-- Editable headline -->
<tr><td style="padding:16px 50px 0;text-align:center;" mc:edit="headline">
  <h1 style="margin:0;font-family:Georgia,serif;font-size:26px;font-weight:normal;font-style:italic;color:${DK};">Your Headline Here</h1>
</td></tr>

<!-- Editable hero image (optional) -->
<tr><td style="padding:24px 50px 0;text-align:center;" mc:edit="hero_image">
  <!-- Replace with your campaign image -->
</td></tr>

<!-- Editable main body content -->
<tr><td style="padding:24px 50px 0;" mc:edit="body_content">
  <p style="margin:0;font-size:15px;line-height:1.7;color:${TX};">Dear *|FNAME:Beautiful|*,</p>
  <p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:${TX};">Your campaign content goes here. Write with intention &mdash; every word matters.</p>
</td></tr>

<!-- Editable featured box / callout -->
<tr><td style="padding:28px 50px 0;" mc:edit="callout_box">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CR};border:1px solid ${DV};">
    <tr><td style="padding:28px;text-align:center;">
      <p style="margin:0;font-family:Georgia,serif;font-size:18px;font-style:italic;color:${DK};">Featured content, quote, or announcement</p>
      <p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:12px;color:${TL};">Supporting detail goes here</p>
    </td></tr>
  </table>
</td></tr>

<!-- Editable CTA button -->
<tr><td style="padding:32px 50px;text-align:center;" mc:edit="cta_button">
  <a href="${SITE}" style="display:inline-block;background:${DK};color:${WH};font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:14px 40px;">Shop Now</a>
</td></tr>

<!-- Editable closing -->
<tr><td style="padding:0 50px 30px;text-align:center;" mc:edit="closing">
  <p style="margin:0;font-size:13px;color:${TL};font-style:italic;">Thank you for being part of this journey.<br><a href="mailto:admin@justxempower.com" style="color:${G};text-decoration:none;">Reach out to us</a> &mdash; we&rsquo;re always here.</p>
</td></tr>`;

  return emailHeader() + body + emailFooter();
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. SEND WELCOME EMAIL — triggered automatically via AWS SES on subscribe
//    Renders the welcome template with real subscriber data (no merge tags)
// ═════════════════════════════════════════════════════════════════════════════

function getSesWelcomeHtml(firstName?: string): string {
  const name = firstName || 'Beloved';
  const UNSUB = `${SITE}/unsubscribe`;

  const body = `
<!-- Pre-header label -->
<tr><td style="padding:10px 50px 0;text-align:center;">
  <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${G};">You Were Called Here</p>
  <h1 style="margin:16px 0 0;font-family:Georgia,serif;font-size:26px;font-weight:normal;font-style:italic;color:${DK};">And That Is Not a Small Thing</h1>
</td></tr>

<!-- Body copy -->
<tr><td style="padding:30px 50px 0;">
  <p style="margin:0;font-size:15px;line-height:1.7;color:${TX};">Dear ${name},</p>
  <p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:${TX};">There are no accidents in becoming. Something inside you stirred &mdash; a quiet knowing, a readiness, a question that needed a different kind of space &mdash; and it led you here. We honor that.</p>
  <p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:${TX};">Just Empower&reg; exists at the intersection of ancient wisdom and lived experience. We are a community rooted in trauma-informed transformation, archetypal self-discovery, and the belief that every soul carries an original design worth returning to. Whether you arrived searching or certain, you belong in this circle.</p>
  <p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:${TX};">This is not a space where empowerment is handed to you. It is a space where it is <em>remembered.</em></p>
</td></tr>

<!-- What to expect box -->
<tr><td style="padding:28px 50px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CR};border:1px solid ${DV};">
    <tr><td style="padding:28px;text-align:center;">
      <p style="margin:0;font-family:Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${TL};">Stay Connected &mdash; More Is Coming</p>
      <div style="margin-top:16px;text-align:left;padding:0 12px;">
        <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:${TX};">&#10047;&ensp; <strong style="color:${DK};">Empowerment</strong> &mdash; not given, but remembered &mdash; a return to the wisdom already living within you</p>
        <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:${TX};">&#10047;&ensp; <strong style="color:${DK};">Rooted Unity&trade;</strong> &mdash; a community of souls in conscious restoration, gathering with intention &mdash; <em>Coming Fall 2026</em></p>
        <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:${TX};">&#10047;&ensp; <strong style="color:${DK};">Sacred Gatherings</strong> &mdash; upcoming events and workshops where real conversations happen and real change follows</p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:${TX};">&#10047;&ensp; <strong style="color:${DK};">She Writes &mdash; the Living Journal</strong> &mdash; reflections on Universal Laws, feminine wisdom, and the science of the soul</p>
      </div>
    </td></tr>
  </table>
</td></tr>

<!-- CTA -->
<tr><td style="padding:32px 50px;text-align:center;">
  <a href="${SITE}/offerings" style="display:inline-block;background:${DK};color:${WH};font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:14px 40px;">Begin Your Journey</a>
</td></tr>

<!-- Closing -->
<tr><td style="padding:0 50px 30px;text-align:center;">
  <p style="margin:0;font-size:13px;color:${TL};font-style:italic;">We do not take lightly the trust it takes to step into something new.<br>You are welcome here &mdash; exactly as you are, and exactly as you are becoming.<br><br>Questions or reflections? <a href="mailto:admin@justxempower.com" style="color:${G};text-decoration:none;">We are here.</a></p>
</td></tr>`;

  // SES-compatible header (no Mailchimp merge tags in <title>)
  const header = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Welcome to Just Empower®</title>
</head>
<body style="margin:0;padding:0;background:${CR};font-family:Georgia,'Times New Roman',serif;color:${TX};-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CR};">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${WH};border:1px solid ${DV};">

<!-- Gold accent bar -->
<tr><td style="height:3px;background:${G};font-size:0;" bgcolor="${G}">&nbsp;</td></tr>

<!-- Logo -->
<tr><td style="padding:40px 50px 20px;text-align:center;">
  <a href="${SITE}" style="text-decoration:none;">
    <img src="${LOGO}" alt="Just Empower®" width="180" style="width:180px;height:auto;display:inline-block;" />
  </a>
  <div style="margin-top:12px;text-align:center;">
    <span style="display:inline-block;width:60px;height:1px;background:${G};vertical-align:middle;"></span>
    <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${G};vertical-align:middle;margin:0 12px;"></span>
    <span style="display:inline-block;width:60px;height:1px;background:${G};vertical-align:middle;"></span>
  </div>
</td></tr>`;

  // SES-compatible footer (no Mailchimp merge tags)
  const footer = `
<!-- Divider -->
<tr><td style="padding:0 50px;"><div style="height:1px;background:${DV};"></div></td></tr>

<!-- Footer -->
<tr><td style="padding:30px 50px 20px;text-align:center;">
  <p style="margin:0 0 12px;font-size:13px;color:${TL};font-style:italic;">Where the soul remembers its original design.</p>
  <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:11px;color:${TL};letter-spacing:2px;text-transform:uppercase;">
    <a href="${SITE}/offerings" style="color:${TL};text-decoration:none;">Offerings</a> &nbsp;&bull;&nbsp;
    <a href="${SITE}/journal" style="color:${TL};text-decoration:none;">She Writes</a> &nbsp;&bull;&nbsp;
    <a href="${SITE}/founder" style="color:${TL};text-decoration:none;">About</a>
  </p>
  <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:11px;color:#A8A29E;">&copy; 2026 Just Empower&reg; &mdash; All Rights Reserved</p>
</td></tr>

<!-- Social + Unsubscribe -->
<tr><td style="padding:0 50px 30px;text-align:center;">
  <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:11px;color:#A8A29E;">
    <a href="https://www.instagram.com/justxempower" style="color:${G};text-decoration:none;">Instagram</a> &nbsp;&bull;&nbsp;
    <a href="https://www.facebook.com/justxempower" style="color:${G};text-decoration:none;">Facebook</a>
  </p>
  <p style="margin:0;font-family:Arial,sans-serif;font-size:10px;color:#C4C0B8;line-height:1.5;">
    You&rsquo;re receiving this because you subscribed at justxempower.com<br>
    <a href="${UNSUB}" style="color:${TL};text-decoration:underline;">Unsubscribe</a>
  </p>
</td></tr>

</table>
</td></tr></table>
</body></html>`;

  return header + body + footer;
}

/**
 * Send the branded welcome email to a new subscriber via AWS SES.
 * Called automatically from subscribeToNewsletter().
 */
export async function sendWelcomeEmail(
  email: string,
  firstName?: string,
): Promise<boolean> {
  try {
    const html = getSesWelcomeHtml(firstName);
    const sent = await sendEmail(
      [email],
      'Welcome to Just Empower® — You Were Called Here',
      html,
      'partners@justxempower.com',
    );
    if (sent) {
      console.log(`[WelcomeEmail] Sent to ${email}`);
    }
    return sent;
  } catch (err) {
    console.error('[WelcomeEmail] Failed:', err);
    return false;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// API: Push templates to Mailchimp
// ═════════════════════════════════════════════════════════════════════════════

async function initMailchimp(): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const admin = await db.select().from(adminUsers).limit(1);
  if (!admin?.length) return false;

  const apiKey = admin[0].mailchimpApiKey;
  if (!apiKey) return false;

  const serverPrefix = apiKey.split('-')[1];
  mailchimp.setConfig({ apiKey, server: serverPrefix });
  return true;
}

export async function pushTemplatesToMailchimp(): Promise<{
  welcome: { success: boolean; id?: number; error?: string };
  campaign: { success: boolean; id?: number; error?: string };
}> {
  const results = {
    welcome: { success: false } as { success: boolean; id?: number; error?: string },
    campaign: { success: false } as { success: boolean; id?: number; error?: string },
  };

  const ready = await initMailchimp();
  if (!ready) {
    results.welcome.error = 'Mailchimp not configured';
    results.campaign.error = 'Mailchimp not configured';
    return results;
  }

  // Push welcome template
  try {
    const welcomeResp = await mailchimp.templates.create({
      name: 'Just Empower® — Welcome',
      html: getWelcomeTemplate(),
    });
    results.welcome = { success: true, id: welcomeResp.id };
    console.log(`[Mailchimp] Welcome template created: ID ${welcomeResp.id}`);
  } catch (err: any) {
    results.welcome.error = err.response?.body?.detail || err.message;
    console.error('[Mailchimp] Welcome template error:', results.welcome.error);
  }

  // Push campaign template
  try {
    const campaignResp = await mailchimp.templates.create({
      name: 'Just Empower® — Campaign',
      html: getCampaignTemplate(),
    });
    results.campaign = { success: true, id: campaignResp.id };
    console.log(`[Mailchimp] Campaign template created: ID ${campaignResp.id}`);
  } catch (err: any) {
    results.campaign.error = err.response?.body?.detail || err.message;
    console.error('[Mailchimp] Campaign template error:', results.campaign.error);
  }

  return results;
}
