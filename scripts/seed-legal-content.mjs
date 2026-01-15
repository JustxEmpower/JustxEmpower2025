import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const legalContent = [
  // ============ ACCESSIBILITY PAGE ============
  { page: 'accessibility', section: 'hero', contentKey: 'title', contentValue: 'Accessibility Statement' },
  { page: 'accessibility', section: 'hero', contentKey: 'lastUpdated', contentValue: 'January 2025' },
  { page: 'accessibility', section: 'commitment', contentKey: 'heading', contentValue: 'Our Commitment' },
  { page: 'accessibility', section: 'commitment', contentKey: 'content', contentValue: 'Just Empower is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.' },
  { page: 'accessibility', section: 'conformance', contentKey: 'heading', contentValue: 'Conformance Status' },
  { page: 'accessibility', section: 'conformance', contentKey: 'content', contentValue: 'The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA. Just Empower is partially conformant with WCAG 2.1 level AA.' },
  { page: 'accessibility', section: 'measures', contentKey: 'heading', contentValue: 'Measures We Take' },
  { page: 'accessibility', section: 'measures', contentKey: 'intro', contentValue: 'Just Empower takes the following measures to ensure accessibility:' },
  { page: 'accessibility', section: 'measures', contentKey: 'item1', contentValue: 'Include accessibility as part of our mission statement' },
  { page: 'accessibility', section: 'measures', contentKey: 'item2', contentValue: 'Integrate accessibility into our procurement practices' },
  { page: 'accessibility', section: 'measures', contentKey: 'item3', contentValue: 'Provide continual accessibility training for our staff' },
  { page: 'accessibility', section: 'measures', contentKey: 'item4', contentValue: 'Include people with disabilities in our design personas' },
  { page: 'accessibility', section: 'measures', contentKey: 'item5', contentValue: 'Use clear and consistent navigation throughout the website' },
  { page: 'accessibility', section: 'measures', contentKey: 'item6', contentValue: 'Provide text alternatives for non-text content' },
  { page: 'accessibility', section: 'measures', contentKey: 'item7', contentValue: 'Ensure sufficient color contrast' },
  { page: 'accessibility', section: 'measures', contentKey: 'item8', contentValue: 'Make all functionality available from a keyboard' },
  { page: 'accessibility', section: 'features', contentKey: 'heading', contentValue: 'Accessibility Features' },
  { page: 'accessibility', section: 'features', contentKey: 'intro', contentValue: 'Our website includes the following accessibility features:' },
  { page: 'accessibility', section: 'features', contentKey: 'keyboard', contentValue: 'All interactive elements can be accessed using a keyboard' },
  { page: 'accessibility', section: 'features', contentKey: 'screenReader', contentValue: 'Our site is compatible with popular screen readers' },
  { page: 'accessibility', section: 'features', contentKey: 'altText', contentValue: 'Images include descriptive alternative text' },
  { page: 'accessibility', section: 'features', contentKey: 'resizableText', contentValue: 'Text can be resized without loss of content or functionality' },
  { page: 'accessibility', section: 'features', contentKey: 'colorContrast', contentValue: 'We maintain sufficient contrast between text and backgrounds' },
  { page: 'accessibility', section: 'features', contentKey: 'focusIndicators', contentValue: 'Visible focus indicators for keyboard navigation' },
  { page: 'accessibility', section: 'features', contentKey: 'skipLinks', contentValue: 'Skip navigation links for screen reader users' },
  { page: 'accessibility', section: 'limitations', contentKey: 'heading', contentValue: 'Known Limitations' },
  { page: 'accessibility', section: 'limitations', contentKey: 'intro', contentValue: 'Despite our best efforts, some content may not yet be fully accessible. We are actively working to identify and address these issues. Known limitations include:' },
  { page: 'accessibility', section: 'limitations', contentKey: 'item1', contentValue: 'Some older PDF documents may not be fully accessible' },
  { page: 'accessibility', section: 'limitations', contentKey: 'item2', contentValue: 'Some video content may not have captions (we are working to add them)' },
  { page: 'accessibility', section: 'limitations', contentKey: 'item3', contentValue: 'Some third-party content may not meet accessibility standards' },
  { page: 'accessibility', section: 'feedback', contentKey: 'heading', contentValue: 'Feedback' },
  { page: 'accessibility', section: 'feedback', contentKey: 'intro', contentValue: 'We welcome your feedback on the accessibility of the Just Empower website. Please let us know if you encounter accessibility barriers:' },
  { page: 'accessibility', section: 'feedback', contentKey: 'email', contentValue: 'accessibility@justxempower.com' },
  { page: 'accessibility', section: 'feedback', contentKey: 'response', contentValue: 'We try to respond to accessibility feedback within 5 business days and will work with you to resolve any issues.' },
  { page: 'accessibility', section: 'compatibility', contentKey: 'heading', contentValue: 'Compatibility' },
  { page: 'accessibility', section: 'compatibility', contentKey: 'intro', contentValue: 'Our website is designed to be compatible with the following assistive technologies:' },
  { page: 'accessibility', section: 'compatibility', contentKey: 'item1', contentValue: 'Screen readers (JAWS, NVDA, VoiceOver)' },
  { page: 'accessibility', section: 'compatibility', contentKey: 'item2', contentValue: 'Screen magnification software' },
  { page: 'accessibility', section: 'compatibility', contentKey: 'item3', contentValue: 'Speech recognition software' },
  { page: 'accessibility', section: 'compatibility', contentKey: 'item4', contentValue: 'Keyboard-only navigation' },
  { page: 'accessibility', section: 'contact', contentKey: 'heading', contentValue: 'Contact Us' },
  { page: 'accessibility', section: 'contact', contentKey: 'intro', contentValue: 'If you have any questions about our accessibility efforts, please contact us:' },
  { page: 'accessibility', section: 'contact', contentKey: 'companyName', contentValue: 'Just Empower' },
  { page: 'accessibility', section: 'contact', contentKey: 'email', contentValue: 'info@justxempower.com' },
  { page: 'accessibility', section: 'contact', contentKey: 'location', contentValue: '' },

  // ============ PRIVACY POLICY PAGE ============
  { page: 'privacy-policy', section: 'hero', contentKey: 'title', contentValue: 'Privacy Policy' },
  { page: 'privacy-policy', section: 'hero', contentKey: 'lastUpdated', contentValue: 'January 2025' },
  { page: 'privacy-policy', section: 'introduction', contentKey: 'heading', contentValue: 'Introduction' },
  { page: 'privacy-policy', section: 'introduction', contentKey: 'content', contentValue: 'Just Empower ("we", "our", or "us") respects your privacy and is committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.' },
  { page: 'privacy-policy', section: 'informationCollect', contentKey: 'heading', contentValue: 'Information We Collect' },
  { page: 'privacy-policy', section: 'informationCollect', contentKey: 'subheading', contentValue: 'Personal Data' },
  { page: 'privacy-policy', section: 'informationCollect', contentKey: 'intro', contentValue: 'We may collect personally identifiable information, such as:' },
  { page: 'privacy-policy', section: 'informationCollect', contentKey: 'item1', contentValue: 'Name and email address' },
  { page: 'privacy-policy', section: 'informationCollect', contentKey: 'item2', contentValue: 'Phone number' },
  { page: 'privacy-policy', section: 'informationCollect', contentKey: 'item3', contentValue: 'Mailing address' },
  { page: 'privacy-policy', section: 'informationCollect', contentKey: 'item4', contentValue: 'Payment information' },
  { page: 'privacy-policy', section: 'informationCollect', contentKey: 'item5', contentValue: 'Any other information you voluntarily provide' },
  { page: 'privacy-policy', section: 'howWeUse', contentKey: 'heading', contentValue: 'How We Use Your Information' },
  { page: 'privacy-policy', section: 'howWeUse', contentKey: 'intro', contentValue: 'We use the information we collect for purposes including:' },
  { page: 'privacy-policy', section: 'howWeUse', contentKey: 'item1', contentValue: 'Providing and improving our services' },
  { page: 'privacy-policy', section: 'howWeUse', contentKey: 'item2', contentValue: 'Processing transactions and sending related information' },
  { page: 'privacy-policy', section: 'howWeUse', contentKey: 'item3', contentValue: 'Sending promotional communications (with your consent)' },
  { page: 'privacy-policy', section: 'howWeUse', contentKey: 'item4', contentValue: 'Responding to your inquiries and requests' },
  { page: 'privacy-policy', section: 'howWeUse', contentKey: 'item5', contentValue: 'Analyzing usage patterns to improve our website' },
  { page: 'privacy-policy', section: 'howWeUse', contentKey: 'item6', contentValue: 'Complying with legal obligations' },
  { page: 'privacy-policy', section: 'dataSecurity', contentKey: 'heading', contentValue: 'Data Security' },
  { page: 'privacy-policy', section: 'dataSecurity', contentKey: 'content', contentValue: 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is completely secure.' },
  { page: 'privacy-policy', section: 'yourRights', contentKey: 'heading', contentValue: 'Your Rights' },
  { page: 'privacy-policy', section: 'yourRights', contentKey: 'intro', contentValue: 'Depending on your location, you may have certain rights regarding your personal information, including:' },
  { page: 'privacy-policy', section: 'yourRights', contentKey: 'item1', contentValue: 'The right to access your personal data' },
  { page: 'privacy-policy', section: 'yourRights', contentKey: 'item2', contentValue: 'The right to correct inaccurate data' },
  { page: 'privacy-policy', section: 'yourRights', contentKey: 'item3', contentValue: 'The right to request deletion of your data' },
  { page: 'privacy-policy', section: 'yourRights', contentKey: 'item4', contentValue: 'The right to opt-out of marketing communications' },
  { page: 'privacy-policy', section: 'contact', contentKey: 'heading', contentValue: 'Contact Us' },
  { page: 'privacy-policy', section: 'contact', contentKey: 'intro', contentValue: 'If you have questions about this Privacy Policy or our privacy practices, please contact us:' },
  { page: 'privacy-policy', section: 'contact', contentKey: 'companyName', contentValue: 'Just Empower' },
  { page: 'privacy-policy', section: 'contact', contentKey: 'email', contentValue: 'privacy@justxempower.com' },
  { page: 'privacy-policy', section: 'contact', contentKey: 'location', contentValue: '' },

  // ============ TERMS OF SERVICE PAGE ============
  { page: 'terms-of-service', section: 'hero', contentKey: 'title', contentValue: 'Terms of Service' },
  { page: 'terms-of-service', section: 'hero', contentKey: 'lastUpdated', contentValue: 'January 2025' },
  { page: 'terms-of-service', section: 'agreement', contentKey: 'heading', contentValue: 'Agreement to Terms' },
  { page: 'terms-of-service', section: 'agreement', contentKey: 'content', contentValue: 'By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.' },
  { page: 'terms-of-service', section: 'useLicense', contentKey: 'heading', contentValue: 'Use License' },
  { page: 'terms-of-service', section: 'useLicense', contentKey: 'intro', contentValue: "Permission is granted to temporarily download one copy of the materials (information or software) on Just Empower's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:" },
  { page: 'terms-of-service', section: 'useLicense', contentKey: 'item1', contentValue: 'Modify or copy the materials' },
  { page: 'terms-of-service', section: 'useLicense', contentKey: 'item2', contentValue: 'Use the materials for any commercial purpose or for any public display' },
  { page: 'terms-of-service', section: 'useLicense', contentKey: 'item3', contentValue: 'Attempt to decompile or reverse engineer any software contained on the website' },
  { page: 'terms-of-service', section: 'useLicense', contentKey: 'item4', contentValue: 'Remove any copyright or other proprietary notations from the materials' },
  { page: 'terms-of-service', section: 'useLicense', contentKey: 'item5', contentValue: 'Transfer the materials to another person or "mirror" the materials on any other server' },
  { page: 'terms-of-service', section: 'disclaimer', contentKey: 'heading', contentValue: 'Disclaimer' },
  { page: 'terms-of-service', section: 'disclaimer', contentKey: 'content', contentValue: "The materials on Just Empower's website are provided on an 'as is' basis. Just Empower makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights." },
  { page: 'terms-of-service', section: 'limitations', contentKey: 'heading', contentValue: 'Limitations' },
  { page: 'terms-of-service', section: 'limitations', contentKey: 'content', contentValue: "In no event shall Just Empower or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Just Empower's website." },
  { page: 'terms-of-service', section: 'accuracy', contentKey: 'heading', contentValue: 'Accuracy of Materials' },
  { page: 'terms-of-service', section: 'accuracy', contentKey: 'content', contentValue: "The materials appearing on Just Empower's website could include technical, typographical, or photographic errors. Just Empower does not warrant that any of the materials on its website are accurate, complete, or current. Just Empower may make changes to the materials contained on its website at any time without notice." },
  { page: 'terms-of-service', section: 'links', contentKey: 'heading', contentValue: 'Links' },
  { page: 'terms-of-service', section: 'links', contentKey: 'content', contentValue: "Just Empower has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Just Empower of the site. Use of any such linked website is at the user's own risk." },
  { page: 'terms-of-service', section: 'modifications', contentKey: 'heading', contentValue: 'Modifications' },
  { page: 'terms-of-service', section: 'modifications', contentKey: 'content', contentValue: 'Just Empower may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.' },
  { page: 'terms-of-service', section: 'governingLaw', contentKey: 'heading', contentValue: 'Governing Law' },
  { page: 'terms-of-service', section: 'governingLaw', contentKey: 'content', contentValue: 'These terms and conditions are governed by and construed in accordance with the laws of the United States, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.' },
  { page: 'terms-of-service', section: 'contact', contentKey: 'heading', contentValue: 'Contact Us' },
  { page: 'terms-of-service', section: 'contact', contentKey: 'intro', contentValue: 'If you have any questions about these Terms of Service, please contact us:' },
  { page: 'terms-of-service', section: 'contact', contentKey: 'companyName', contentValue: 'Just Empower' },
  { page: 'terms-of-service', section: 'contact', contentKey: 'email', contentValue: 'legal@justxempower.com' },
  { page: 'terms-of-service', section: 'contact', contentKey: 'location', contentValue: '' },

  // ============ COOKIE POLICY PAGE ============
  { page: 'cookie-policy', section: 'hero', contentKey: 'title', contentValue: 'Cookie Policy' },
  { page: 'cookie-policy', section: 'hero', contentKey: 'lastUpdated', contentValue: 'January 2025' },
  { page: 'cookie-policy', section: 'whatAreCookies', contentKey: 'heading', contentValue: 'What Are Cookies?' },
  { page: 'cookie-policy', section: 'whatAreCookies', contentKey: 'content', contentValue: 'Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the owners of the site.' },
  { page: 'cookie-policy', section: 'howWeUse', contentKey: 'heading', contentValue: 'How We Use Cookies' },
  { page: 'cookie-policy', section: 'howWeUse', contentKey: 'intro', contentValue: 'Just Empower uses cookies for the following purposes:' },
  { page: 'cookie-policy', section: 'howWeUse', contentKey: 'essential', contentValue: 'Required for the website to function properly' },
  { page: 'cookie-policy', section: 'howWeUse', contentKey: 'performance', contentValue: 'Help us understand how visitors use our website' },
  { page: 'cookie-policy', section: 'howWeUse', contentKey: 'functional', contentValue: 'Remember your preferences and settings' },
  { page: 'cookie-policy', section: 'howWeUse', contentKey: 'marketing', contentValue: 'Track your activity for targeted advertising (with consent)' },
  { page: 'cookie-policy', section: 'thirdParty', contentKey: 'heading', contentValue: 'Third-Party Cookies' },
  { page: 'cookie-policy', section: 'thirdParty', contentKey: 'content', contentValue: 'We may allow third-party service providers to place cookies on your device for analytics, advertising, and other purposes. These third parties have their own privacy policies governing their use of cookies.' },
  { page: 'cookie-policy', section: 'managing', contentKey: 'heading', contentValue: 'Managing Cookies' },
  { page: 'cookie-policy', section: 'managing', contentKey: 'content', contentValue: 'You can control and manage cookies through your browser settings. Most browsers allow you to refuse cookies or alert you when cookies are being sent. However, blocking cookies may affect the functionality of our website.' },
  { page: 'cookie-policy', section: 'yourChoices', contentKey: 'heading', contentValue: 'Your Choices' },
  { page: 'cookie-policy', section: 'yourChoices', contentKey: 'content', contentValue: 'By using our website, you consent to our use of cookies as described in this policy. You can withdraw your consent at any time by changing your browser settings or contacting us.' },
  { page: 'cookie-policy', section: 'contact', contentKey: 'heading', contentValue: 'Contact Us' },
  { page: 'cookie-policy', section: 'contact', contentKey: 'intro', contentValue: 'If you have questions about our cookie practices, please contact us:' },
  { page: 'cookie-policy', section: 'contact', contentKey: 'companyName', contentValue: 'Just Empower' },
  { page: 'cookie-policy', section: 'contact', contentKey: 'email', contentValue: 'privacy@justxempower.com' },
  { page: 'cookie-policy', section: 'contact', contentKey: 'location', contentValue: '' },
];

async function seedLegalContent() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('🌱 Seeding legal pages content...');
  
  for (const item of legalContent) {
    try {
      // Check if content already exists
      const [existing] = await connection.execute(
        'SELECT id FROM siteContent WHERE page = ? AND section = ? AND contentKey = ?',
        [item.page, item.section, item.contentKey]
      );
      
      if (existing.length === 0) {
        // Insert new content
        await connection.execute(
          'INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES (?, ?, ?, ?)',
          [item.page, item.section, item.contentKey, item.contentValue]
        );
        console.log(`  ✅ Added: ${item.page} > ${item.section} > ${item.contentKey}`);
      } else {
        console.log(`  ⏭️  Skipped (exists): ${item.page} > ${item.section} > ${item.contentKey}`);
      }
    } catch (error) {
      console.error(`  ❌ Error adding ${item.page} > ${item.section} > ${item.contentKey}:`, error.message);
    }
  }
  
  await connection.end();
  console.log('✅ Legal pages content seeding complete!');
}

seedLegalContent().catch(console.error);
