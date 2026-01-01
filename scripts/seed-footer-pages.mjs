#!/usr/bin/env node
/**
 * Seed script for footer pages content
 * Run with: node scripts/seed-footer-pages.mjs
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

// Parse DATABASE_URL
const url = new URL(DATABASE_URL);
const config = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false }
};

const footerPagesContent = [
  // Accessibility Page
  { page: 'accessibility', section: 'main', contentKey: 'title', contentValue: 'Accessibility Statement' },
  { page: 'accessibility', section: 'main', contentKey: 'lastUpdated', contentValue: 'December 2024' },
  { page: 'accessibility', section: 'main', contentKey: 'content', contentValue: `JustxEmpower is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.

## Our Commitment

We strive to ensure that our website is accessible to people with disabilities. We are actively working to increase the accessibility and usability of our website and in doing so adhere to many of the available standards and guidelines.

## Measures We Take

- We employ accessible design practices in our website development
- We provide text alternatives for non-text content
- We ensure our content is adaptable and distinguishable
- We make all functionality available from a keyboard
- We provide users enough time to read and use content
- We do not design content in a way that is known to cause seizures
- We provide ways to help users navigate, find content, and determine where they are
- We make text content readable and understandable

## Feedback

We welcome your feedback on the accessibility of JustxEmpower. Please let us know if you encounter accessibility barriers:

- Email: accessibility@justxempower.com
- Phone: Contact us through our main line

We try to respond to feedback within 5 business days.` },

  // Privacy Policy Page
  { page: 'privacy-policy', section: 'main', contentKey: 'title', contentValue: 'Privacy Policy' },
  { page: 'privacy-policy', section: 'main', contentKey: 'lastUpdated', contentValue: 'December 2024' },
  { page: 'privacy-policy', section: 'main', contentKey: 'content', contentValue: `This Privacy Policy describes how JustxEmpower ("we", "us", or "our") collects, uses, and shares information about you when you use our website and services.

## Information We Collect

### Information You Provide
- Contact information (name, email address, phone number)
- Account information when you register
- Payment information for purchases
- Communications you send to us

### Information Collected Automatically
- Device and browser information
- IP address and location data
- Usage data and browsing history on our site
- Cookies and similar technologies

## How We Use Your Information

We use the information we collect to:
- Provide and improve our services
- Process transactions and send related information
- Send promotional communications (with your consent)
- Respond to your comments and questions
- Analyze usage patterns to improve user experience

## Information Sharing

We do not sell your personal information. We may share your information with:
- Service providers who assist in our operations
- Professional advisors (lawyers, accountants)
- Law enforcement when required by law

## Your Rights

You have the right to:
- Access your personal information
- Correct inaccurate information
- Delete your information
- Opt-out of marketing communications

## Contact Us

For questions about this Privacy Policy, contact us at:
privacy@justxempower.com` },

  // Terms of Service Page
  { page: 'terms-of-service', section: 'main', contentKey: 'title', contentValue: 'Terms of Service' },
  { page: 'terms-of-service', section: 'main', contentKey: 'lastUpdated', contentValue: 'December 2024' },
  { page: 'terms-of-service', section: 'main', contentKey: 'content', contentValue: `Welcome to JustxEmpower. By accessing or using our website and services, you agree to be bound by these Terms of Service.

## Acceptance of Terms

By accessing or using our services, you agree to these Terms. If you do not agree, please do not use our services.

## Use of Services

You agree to use our services only for lawful purposes and in accordance with these Terms. You agree not to:
- Use the services in any way that violates applicable laws
- Attempt to gain unauthorized access to any part of the services
- Interfere with or disrupt the services or servers
- Transmit any harmful code or malware

## Intellectual Property

All content on this website, including text, graphics, logos, and images, is the property of JustxEmpower and is protected by copyright and other intellectual property laws.

## User Content

By submitting content to our services, you grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, and display such content in connection with our services.

## Disclaimer of Warranties

Our services are provided "as is" without warranties of any kind, either express or implied.

## Limitation of Liability

JustxEmpower shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services.

## Changes to Terms

We may modify these Terms at any time. Continued use of our services after changes constitutes acceptance of the modified Terms.

## Contact

For questions about these Terms, contact us at:
legal@justxempower.com` },

  // Cookie Policy Page
  { page: 'cookie-policy', section: 'main', contentKey: 'title', contentValue: 'Cookie Policy' },
  { page: 'cookie-policy', section: 'main', contentKey: 'lastUpdated', contentValue: 'December 2024' },
  { page: 'cookie-policy', section: 'main', contentKey: 'content', contentValue: `This Cookie Policy explains how JustxEmpower uses cookies and similar technologies on our website.

## What Are Cookies?

Cookies are small text files that are stored on your device when you visit a website. They help websites remember your preferences and improve your browsing experience.

## Types of Cookies We Use

### Essential Cookies
These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.

### Analytics Cookies
We use analytics cookies to understand how visitors interact with our website. This helps us improve our services and user experience.

### Functional Cookies
These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings.

### Marketing Cookies
With your consent, we may use marketing cookies to deliver relevant advertisements and track the effectiveness of our marketing campaigns.

## Managing Cookies

You can control and manage cookies in various ways:
- **Browser Settings**: Most browsers allow you to refuse or accept cookies through their settings
- **Cookie Consent**: You can update your cookie preferences through our cookie consent banner
- **Opt-Out Links**: For third-party cookies, you can opt out through the respective provider's website

## Third-Party Cookies

We may use third-party services that set their own cookies, including:
- Google Analytics for website analytics
- Social media platforms for sharing functionality
- Payment processors for secure transactions

## Updates to This Policy

We may update this Cookie Policy from time to time. The updated version will be indicated by an updated "Last Updated" date.

## Contact Us

If you have questions about our use of cookies, please contact us at:
privacy@justxempower.com` }
];

async function seedFooterPages() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(config);
    
    console.log('Seeding footer pages content...');
    
    for (const content of footerPagesContent) {
      // Check if content already exists
      const [existing] = await connection.execute(
        'SELECT id FROM siteContent WHERE page = ? AND section = ? AND contentKey = ?',
        [content.page, content.section, content.contentKey]
      );
      
      if (existing.length > 0) {
        // Update existing
        await connection.execute(
          'UPDATE siteContent SET contentValue = ?, updatedAt = NOW() WHERE page = ? AND section = ? AND contentKey = ?',
          [content.contentValue, content.page, content.section, content.contentKey]
        );
        console.log(`Updated: ${content.page} - ${content.contentKey}`);
      } else {
        // Insert new
        await connection.execute(
          'INSERT INTO siteContent (page, section, contentKey, contentValue, updatedAt) VALUES (?, ?, ?, ?, NOW())',
          [content.page, content.section, content.contentKey, content.contentValue]
        );
        console.log(`Inserted: ${content.page} - ${content.contentKey}`);
      }
    }
    
    console.log('Footer pages content seeded successfully!');
    
  } catch (error) {
    console.error('Error seeding footer pages:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedFooterPages();
