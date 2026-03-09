/**
 * Living Codex™ Journey — Email Automation System
 *
 * This module handles all triggered emails. In production, swap the
 * `sendEmail` implementation for your preferred provider (Resend, SendGrid,
 * Postmark, AWS SES, etc.). The current implementation logs emails to the
 * console for development.
 */

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

// ── Provider-agnostic send function ──────────────────────────────────────────
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const from = payload.from || "The Living Codex™ Journey <codex@justxempower.com>";

  // --- PRODUCTION: uncomment and configure your provider ---
  // import { Resend } from 'resend';
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({ from, to: payload.to, subject: payload.subject, html: payload.html });

  // --- DEVELOPMENT: log to console ---
  console.log("\n📧 EMAIL SENT ─────────────────────────────");
  console.log(`  To:      ${payload.to}`);
  console.log(`  From:    ${from}`);
  console.log(`  Subject: ${payload.subject}`);
  console.log("  Body:    [HTML content – see below]");
  console.log("───────────────────────────────────────────\n");

  return true;
}

// ── Shared wrapper ───────────────────────────────────────────────────────────
function wrap(inner: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#12090F;color:#F5E6D3;font-family:'Georgia',serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:32px;">🜂</span>
      <p style="color:#C9A84C;font-size:14px;letter-spacing:3px;margin-top:8px;">THE LIVING CODEX™ JOURNEY</p>
    </div>
    ${inner}
    <div style="border-top:1px solid #3D2233;margin-top:40px;padding-top:24px;text-align:center;">
      <p style="color:#3D2233;font-size:11px;">© ${new Date().getFullYear()} Just Empower®. All rights reserved.</p>
      <p style="color:#3D2233;font-size:10px;">This email contains confidential information intended solely for the recipient.</p>
    </div>
  </div>
</body>
</html>`;
}

// ── 1. WELCOME EMAIL (after purchase) ────────────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string, tier: string): Promise<boolean> {
  const tierName: Record<string, string> = {
    threshold: "Threshold Session",
    self_guided: "Self-Guided Journey",
    awakening: "Awakening Arc",
    reclamation: "Reclamation Path",
    legacy: "Legacy Immersion",
  };

  const html = wrap(`
    <h1 style="color:#C9A84C;font-size:28px;font-weight:300;margin-bottom:16px;">
      Welcome, ${name || "Sovereign One"}
    </h1>
    <p style="line-height:1.8;color:#D4C4B0;">
      Your path has been chosen: <strong style="color:#C9A84C;">${tierName[tier] || tier}</strong>.
    </p>
    <p style="line-height:1.8;color:#D4C4B0;">
      The Living Codex™ Journey is not a program or a test — it is a mirror, a map,
      and a field of remembrance crafted uniquely for you.
    </p>
    <p style="line-height:1.8;color:#D4C4B0;">Here is what happens next:</p>
    <ol style="color:#D4C4B0;line-height:2;">
      <li>Create your account (if you haven't already)</li>
      <li>Enter the Codex Portal</li>
      <li>Begin the 16-section assessment when you are ready — there is no rush</li>
    </ol>
    <div style="text-align:center;margin:32px 0;">
      <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/signup"
         style="display:inline-block;padding:14px 32px;background:rgba(201,168,76,0.15);
                border:1px solid rgba(201,168,76,0.4);color:#C9A84C;text-decoration:none;
                font-size:16px;letter-spacing:2px;border-radius:8px;">
        Create Your Account
      </a>
    </div>
    <p style="color:#8B7332;font-style:italic;font-size:14px;">
      Take your time. The Codex waits for you — not the other way around.
    </p>
  `);

  return sendEmail({ to, subject: "Welcome to The Living Codex™ Journey", html });
}

// ── 2. ASSESSMENT COMPLETE EMAIL ─────────────────────────────────────────────
export async function sendAssessmentCompleteEmail(to: string, name: string): Promise<boolean> {
  const html = wrap(`
    <h1 style="color:#C9A84C;font-size:28px;font-weight:300;margin-bottom:16px;">
      The Codex Has Received You
    </h1>
    <p style="line-height:1.8;color:#D4C4B0;">
      ${name || "Dear one"}, your assessment is complete. Every answer you offered has been
      woven into your archetypal map.
    </p>
    <p style="line-height:1.8;color:#D4C4B0;">
      Your Mirror Report is now being prepared. Once reviewed, it will be released to your
      portal — a document unlike anything you have encountered before.
    </p>
    <p style="line-height:1.8;color:#D4C4B0;">
      In the meantime, your Codex Scroll is available. Begin whenever you feel ready.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/codex/portal"
         style="display:inline-block;padding:14px 32px;background:rgba(201,168,76,0.15);
                border:1px solid rgba(201,168,76,0.4);color:#C9A84C;text-decoration:none;
                font-size:16px;letter-spacing:2px;border-radius:8px;">
        Enter Your Portal
      </a>
    </div>
  `);

  return sendEmail({ to, subject: "Your Assessment is Complete — The Living Codex™ Journey", html });
}

// ── 3. MIRROR REPORT RELEASED EMAIL ──────────────────────────────────────────
export async function sendMirrorReportReleasedEmail(to: string, name: string): Promise<boolean> {
  const html = wrap(`
    <h1 style="color:#C9A84C;font-size:28px;font-weight:300;margin-bottom:16px;">
      Your Mirror Awaits
    </h1>
    <p style="line-height:1.8;color:#D4C4B0;">
      ${name || "Dear one"}, your Archetypal Mirror Report has been reviewed and released.
    </p>
    <p style="line-height:1.8;color:#D4C4B0;">
      This is your personal archetypal portrait — a reflection of the patterns, wounds,
      and gifts that live within you. Read it slowly. Let it settle. It is not meant to be
      consumed — it is meant to be <em>felt</em>.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/codex/mirror-report"
         style="display:inline-block;padding:14px 32px;background:rgba(201,168,76,0.15);
                border:1px solid rgba(201,168,76,0.4);color:#C9A84C;text-decoration:none;
                font-size:16px;letter-spacing:2px;border-radius:8px;">
        View Your Mirror Report
      </a>
    </div>
    <p style="color:#8B7332;font-style:italic;font-size:14px;">
      What you see in this mirror was always yours. The Codex merely illuminated it.
    </p>
  `);

  return sendEmail({ to, subject: "Your Mirror Report is Ready — The Living Codex™ Journey", html });
}

// ── 4. SAFETY REFERRAL EMAIL (triggered by S14 abuse flags) ──────────────────
export async function sendSafetyReferralEmail(to: string, name: string): Promise<boolean> {
  const html = wrap(`
    <h1 style="color:#C9A84C;font-size:28px;font-weight:300;margin-bottom:16px;">
      A Note of Care
    </h1>
    <p style="line-height:1.8;color:#D4C4B0;">
      ${name || "Dear one"}, parts of what you shared in your assessment touched on
      experiences that carry deep weight. We want you to know: you are seen, and what you
      carry matters.
    </p>
    <p style="line-height:1.8;color:#D4C4B0;">
      The Living Codex™ Journey is a field of self-discovery and empowerment — but it is
      not a replacement for professional support. If anything that emerged in your
      assessment stirred something that feels urgent or overwhelming, please know that
      help is available.
    </p>
    <div style="background:#1E1118;border:1px solid #3D2233;border-radius:8px;padding:24px;margin:24px 0;">
      <p style="color:#C9A84C;margin:0 0 12px 0;font-size:14px;letter-spacing:1px;">CRISIS RESOURCES</p>
      <p style="color:#D4C4B0;margin:4px 0;">National Domestic Violence Hotline: <strong>1-800-799-7233</strong></p>
      <p style="color:#D4C4B0;margin:4px 0;">Crisis Text Line: Text <strong>HOME</strong> to <strong>741741</strong></p>
      <p style="color:#D4C4B0;margin:4px 0;">RAINN National Sexual Assault Hotline: <strong>1-800-656-4673</strong></p>
      <p style="color:#D4C4B0;margin:4px 0;">988 Suicide & Crisis Lifeline: <strong>988</strong></p>
    </div>
    <p style="line-height:1.8;color:#D4C4B0;">
      You are not alone. Your courage in this process is already a form of reclamation.
    </p>
    <p style="color:#8B7332;font-style:italic;font-size:14px;">
      With deep respect for your journey,<br/>April & the Just Empower® team
    </p>
  `);

  return sendEmail({ to, subject: "A Note of Care — The Living Codex™ Journey", html });
}

// ── 5. SCROLL COMPLETION EMAIL ───────────────────────────────────────────────
export async function sendScrollCompleteEmail(to: string, name: string): Promise<boolean> {
  const html = wrap(`
    <h1 style="color:#C9A84C;font-size:28px;font-weight:300;margin-bottom:16px;">
      Your Scroll is Complete
    </h1>
    <p style="line-height:1.8;color:#D4C4B0;">
      ${name || "Dear one"}, you have walked through all nine modules of the Codex Scroll.
    </p>
    <p style="line-height:1.8;color:#D4C4B0;">
      What you wrote in those pages is sacred. It is yours — a living record of your
      descent, your reclamation, and your return to sovereignty.
    </p>
    <p style="line-height:1.8;color:#D4C4B0;">
      Your Scroll remains in your portal. You may return to it at any time. The words
      you wrote today will read differently in six months — that is the nature of a
      living document.
    </p>
    <p style="color:#8B7332;font-style:italic;font-size:14px;">
      This is not an ending. It is a way of being.
    </p>
  `);

  return sendEmail({ to, subject: "Your Codex Scroll is Complete — The Living Codex™ Journey", html });
}
