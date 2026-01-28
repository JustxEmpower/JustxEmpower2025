const mysql = require('mysql2/promise');

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL environment variable not set');
    process.exit(1);
  }
  
  const conn = await mysql.createConnection(dbUrl);

  const legalPages = [
    {
      page: 'privacy-policy',
      sections: [
        { id: '1', header: 'Last Updated: January 1, 2026', body: 'This Privacy Policy explains how Just Empower collects, uses, and protects your personal information when you visit our website or use our services.' },
        { id: '2', header: 'Information We Collect', body: 'We collect information you provide directly, such as your name, email address, and any content you submit through our forms, newsletter subscriptions, or AI chatbot interactions.' },
        { id: '3', header: 'How We Use Your Information', body: 'We use your information to provide and improve our services, communicate with you about offerings and updates, personalize your experience, and respond to your inquiries.' },
        { id: '4', header: 'Data Protection', body: 'We implement appropriate security measures to protect your personal information from unauthorized access, alteration, or disclosure. Your data is stored securely and accessed only by authorized personnel.' },
        { id: '5', header: 'Your Rights', body: 'You have the right to access, correct, or delete your personal information. You may also opt out of marketing communications at any time by clicking the unsubscribe link in our emails.' },
        { id: '6', header: 'Contact Us', body: 'If you have questions about this Privacy Policy or our data practices, please contact us at hello@justxempower.com' }
      ]
    },
    {
      page: 'terms-of-service',
      sections: [
        { id: '1', header: 'Last Updated: January 1, 2026', body: 'These Terms of Service govern your use of the Just Empower website and services. By accessing our site, you agree to these terms.' },
        { id: '2', header: 'Eligibility', body: 'You must be at least 18 years old to use our services. By using our website, you represent that you meet this age requirement.' },
        { id: '3', header: 'Account Registration', body: 'Some features may require account registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.' },
        { id: '4', header: 'Acceptable Use', body: 'You agree to use our services only for lawful purposes. You may not use our platform to harass, harm, or infringe on the rights of others.' },
        { id: '5', header: 'Intellectual Property', body: 'All content on this website, including text, images, and branding, is the property of Just Empower and protected by copyright laws. You may not reproduce or distribute our content without permission.' },
        { id: '6', header: 'Limitation of Liability', body: 'Just Empower is not liable for any indirect, incidental, or consequential damages arising from your use of our services.' },
        { id: '7', header: 'Contact Us', body: 'For questions about these Terms of Service, please contact us at hello@justxempower.com' }
      ]
    },
    {
      page: 'accessibility',
      sections: [
        { id: '1', header: 'Last Updated: January 1, 2026', body: 'Just Empower is committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone.' },
        { id: '2', header: 'Compliance Framework', body: 'We aim to conform to Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards. These guidelines help make web content more accessible to people with disabilities.' },
        { id: '3', header: 'Accessibility Features', body: 'Our website includes features such as keyboard navigation, screen reader compatibility, text alternatives for images, sufficient color contrast, and resizable text.' },
        { id: '4', header: 'Ongoing Efforts', body: 'We regularly review our website for accessibility issues and work to address any barriers. Our team receives training on accessibility best practices.' },
        { id: '5', header: 'Feedback', body: 'We welcome your feedback on the accessibility of our website. If you encounter any barriers, please contact us at hello@justxempower.com' },
        { id: '6', header: 'Third-Party Content', body: 'While we strive to ensure accessibility across our website, some third-party content or applications may not be fully accessible. We encourage third-party providers to also prioritize accessibility.' }
      ]
    },
    {
      page: 'cookie-policy',
      sections: [
        { id: '1', header: 'Last Updated: January 1, 2026', body: 'This Cookie Policy explains how Just Empower uses cookies and similar technologies when you visit our website.' },
        { id: '2', header: 'What Are Cookies', body: 'Cookies are small text files stored on your device when you visit a website. They help the website remember your preferences and improve your browsing experience.' },
        { id: '3', header: 'How We Use Cookies', body: 'We use cookies to remember your preferences, analyze website traffic, personalize content, and improve our services. Some cookies are essential for the website to function properly.' },
        { id: '4', header: 'Types of Cookies We Use', body: 'Essential Cookies: Required for basic website functionality.\n\nAnalytics Cookies: Help us understand how visitors interact with our website.\n\nPreference Cookies: Remember your settings and preferences.' },
        { id: '5', header: 'Managing Cookies', body: 'You can control cookies through your browser settings. You may choose to block or delete cookies, though this may affect your experience on our website.' },
        { id: '6', header: 'Contact Us', body: 'If you have questions about our use of cookies, please contact us at hello@justxempower.com' }
      ]
    }
  ];

  for (const { page, sections } of legalPages) {
    const json = JSON.stringify(sections);
    
    // First delete any existing entry
    await conn.execute(
      'DELETE FROM siteContent WHERE page = ? AND section = ? AND contentKey = ?',
      [page, 'legalSections', 'sections']
    );
    
    // Then insert the new content
    await conn.execute(
      'INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES (?, ?, ?, ?)',
      [page, 'legalSections', 'sections', json]
    );
    
    console.log(`Inserted legal sections for: ${page}`);
  }

  await conn.end();
  console.log('Done!');
}

run().catch(console.error);
