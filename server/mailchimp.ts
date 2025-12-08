// @ts-ignore - No types available for @mailchimp/mailchimp_marketing
import mailchimp from '@mailchimp/mailchimp_marketing';
import { getDb } from './db.js';
import { adminUsers } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

interface MailchimpConfig {
  apiKey: string;
  audienceId: string;
  serverPrefix: string;
}

async function getMailchimpConfig(): Promise<MailchimpConfig | null> {
  try {
    const db = await getDb();
    if (!db) return null;
    
    // Get the first admin user's Mailchimp settings
    const admin = await db.select().from(adminUsers).limit(1);
    
    if (!admin || admin.length === 0) {
      return null;
    }

    const apiKey = admin[0].mailchimpApiKey;
    const audienceId = admin[0].mailchimpAudienceId;

    if (!apiKey || !audienceId) {
      return null;
    }

    // Extract server prefix from API key (e.g., "us1" from "xxxxx-us1")
    const serverPrefix = apiKey.split('-')[1];

    return {
      apiKey,
      audienceId,
      serverPrefix,
    };
  } catch (error) {
    console.error('Error getting Mailchimp config:', error);
    return null;
  }
}

export async function subscribeToNewsletter(
  email: string,
  firstName?: string,
  lastName?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const config = await getMailchimpConfig();

    if (!config) {
      return {
        success: false,
        message: 'Mailchimp is not configured. Please contact the administrator.',
      };
    }

    // Configure Mailchimp client
    mailchimp.setConfig({
      apiKey: config.apiKey,
      server: config.serverPrefix,
    });

    // Add subscriber to audience
    const response = await mailchimp.lists.addListMember(config.audienceId, {
      email_address: email,
      status: 'subscribed',
      merge_fields: {
        FNAME: firstName || '',
        LNAME: lastName || '',
      },
    });

    return {
      success: true,
      message: 'Successfully subscribed to newsletter!',
    };
  } catch (error: any) {
    console.error('Mailchimp subscription error:', error);

    // Handle specific Mailchimp errors
    if (error.status === 400 && error.response?.body?.title === 'Member Exists') {
      return {
        success: false,
        message: 'This email is already subscribed to our newsletter.',
      };
    }

    if (error.status === 400 && error.response?.body?.title === 'Invalid Resource') {
      return {
        success: false,
        message: 'Invalid email address. Please check and try again.',
      };
    }

    return {
      success: false,
      message: 'Failed to subscribe. Please try again later.',
    };
  }
}

export async function updateMailchimpSettings(
  apiKey: string,
  audienceId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Validate API key format
    if (!apiKey.includes('-')) {
      return {
        success: false,
        message: 'Invalid API key format. Expected format: xxxxx-us1',
      };
    }

    const serverPrefix = apiKey.split('-')[1];

    // Test the connection
    mailchimp.setConfig({
      apiKey,
      server: serverPrefix,
    });

    // Try to ping the API
    const pingResponse = await mailchimp.ping.get();

    if (!pingResponse || !pingResponse.health_status) {
      return {
        success: false,
        message: 'Failed to connect to Mailchimp. Please check your API key.',
      };
    }

    // Update the database
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        message: 'Database not available.',
      };
    }
    
    const admin = await db.select().from(adminUsers).limit(1);
    
    if (!admin || admin.length === 0) {
      return {
        success: false,
        message: 'Admin user not found.',
      };
    }

    await db
      .update(adminUsers)
      .set({
        mailchimpApiKey: apiKey,
        mailchimpAudienceId: audienceId,
      })
      .where(eq(adminUsers.id, admin[0].id));

    return {
      success: true,
      message: 'Mailchimp settings saved successfully!',
    };
  } catch (error: any) {
    console.error('Mailchimp settings update error:', error);

    if (error.status === 401) {
      return {
        success: false,
        message: 'Invalid API key. Please check your Mailchimp account.',
      };
    }

    return {
      success: false,
      message: 'Failed to save Mailchimp settings. Please try again.',
    };
  }
}
