import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import type { Context } from './_core/trpc';
import { getDb } from './db';
import * as schema from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Admin Content Update', () => {
  let adminToken: string;
  let testContentId: number;

  beforeAll(async () => {
    // Create admin session for testing
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Generate test session token
    const token = 'test-session-' + Date.now();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    await db.insert(schema.adminSessions).values({
      token,
      username: 'JusticeEmpower',
      expiresAt,
    });

    adminToken = token;

    // Get a test content item ID
    const [content] = await db
      .select()
      .from(schema.siteContent)
      .where(eq(schema.siteContent.page, 'home'))
      .limit(1);
    
    if (!content) throw new Error('No test content found');
    testContentId = content.id;
  });

  it('should update content with valid admin session', async () => {
    const mockReq = {
      headers: {
        'x-admin-token': adminToken,
      },
    } as any;

    const mockRes = {} as any;

    const ctx: Context = {
      req: mockReq,
      res: mockRes,
      user: null,
    };

    const caller = appRouter.createCaller(ctx);

    const originalValue = 'Test Original Value';
    const updatedValue = 'Test Updated Value - ' + Date.now();

    // First, set a known value
    await caller.admin.content.update({
      id: testContentId,
      contentValue: originalValue,
    });

    // Then update it
    const result = await caller.admin.content.update({
      id: testContentId,
      contentValue: updatedValue,
    });

    expect(result).toEqual({ success: true });

    // Verify the update persisted
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const [updated] = await db
      .select()
      .from(schema.siteContent)
      .where(eq(schema.siteContent.id, testContentId))
      .limit(1);

    expect(updated.contentValue).toBe(updatedValue);
  });

  it('should fail without admin token', async () => {
    const mockReq = {
      headers: {},
    } as any;

    const mockRes = {} as any;

    const ctx: Context = {
      req: mockReq,
      res: mockRes,
      user: null,
    };

    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.content.update({
        id: testContentId,
        contentValue: 'Should fail',
      })
    ).rejects.toThrow('Admin token required');
  });

  it('should fail with invalid admin token', async () => {
    const mockReq = {
      headers: {
        'x-admin-token': 'invalid-token-123',
      },
    } as any;

    const mockRes = {} as any;

    const ctx: Context = {
      req: mockReq,
      res: mockRes,
      user: null,
    };

    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.content.update({
        id: testContentId,
        contentValue: 'Should fail',
      })
    ).rejects.toThrow('Invalid or expired admin session');
  });
});
