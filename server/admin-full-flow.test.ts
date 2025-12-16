import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import type { Context } from './_core/trpc';
import { getDb } from './db';
import * as schema from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Admin Full Flow', () => {
  let loginToken: string;
  let testContentId: number;

  beforeAll(async () => {
    // Get a test content item ID
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const [content] = await db
      .select()
      .from(schema.siteContent)
      .where(eq(schema.siteContent.page, 'home'))
      .limit(1);
    
    if (!content) throw new Error('No test content found');
    testContentId = content.id;
  });

  it('should login and get a valid token', async () => {
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

    const result = await caller.admin.login({
      username: 'JusticeEmpower',
      password: 'EmpowerX2025',
    });

    expect(result.token).toBeDefined();
    expect(result.token.length).toBeGreaterThan(20);
    expect(result.username).toBe('JusticeEmpower');
    
    loginToken = result.token;
    console.log('[TEST] Login successful, token:', loginToken.substring(0, 10) + '...');
  });

  it('should verify session with the login token', async () => {
    expect(loginToken).toBeDefined();

    const mockReq = {
      headers: {
        'x-admin-token': loginToken,
      },
    } as any;

    const mockRes = {} as any;

    const ctx: Context = {
      req: mockReq,
      res: mockRes,
      user: null,
    };

    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.verifySession();

    expect(result.valid).toBe(true);
    expect(result.username).toBe('JusticeEmpower');
    console.log('[TEST] Session verified successfully');
  });

  it('should update content with the login token', async () => {
    expect(loginToken).toBeDefined();

    const mockReq = {
      headers: {
        'x-admin-token': loginToken,
      },
    } as any;

    const mockRes = {} as any;

    const ctx: Context = {
      req: mockReq,
      res: mockRes,
      user: null,
    };

    const caller = appRouter.createCaller(ctx);

    const testValue = 'Full Flow Test - ' + Date.now();

    const result = await caller.admin.content.update({
      id: testContentId,
      contentValue: testValue,
    });

    expect(result).toEqual({ success: true });
    console.log('[TEST] Content updated successfully');

    // Verify the update persisted
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const [updated] = await db
      .select()
      .from(schema.siteContent)
      .where(eq(schema.siteContent.id, testContentId))
      .limit(1);

    expect(updated.contentValue).toBe(testValue);
    console.log('[TEST] Content verified in database');
  });
});
