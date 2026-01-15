import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { appRouter } from './routers';
import type { Context } from './_core/trpc';
import { getDb } from './db';
import * as schema from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from './adminDb';

describe('Admin Full Flow', () => {
  let loginToken: string;
  let testContentId: number;
  const testUsername = 'TestAdminUser';
  const testPassword = 'TestPassword123';

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    // Create test admin user
    const existingAdmin = await db
      .select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.username, testUsername))
      .limit(1);
    
    if (existingAdmin.length === 0) {
      await db.insert(schema.adminUsers).values({
        username: testUsername,
        passwordHash: hashPassword(testPassword),
        role: 'admin',
        email: 'testadmin@test.com',
      });
    }
    
    // Get or create test content item
    let [content] = await db
      .select()
      .from(schema.siteContent)
      .where(eq(schema.siteContent.page, 'home'))
      .limit(1);
    
    if (!content) {
      // Create test content if none exists
      const [result] = await db.insert(schema.siteContent).values({
        page: 'home',
        section: 'test-section',
        contentKey: 'test-key-' + Date.now(),
        contentValue: 'Test content value',
        contentType: 'text',
      });
      
      [content] = await db
        .select()
        .from(schema.siteContent)
        .where(eq(schema.siteContent.id, result.insertId))
        .limit(1);
    }
    
    testContentId = content.id;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;
    
    // Clean up test admin sessions
    await db.delete(schema.adminSessions).where(eq(schema.adminSessions.username, testUsername));
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
      username: testUsername,
      password: testPassword,
    });

    expect(result.token).toBeDefined();
    expect(result.token.length).toBeGreaterThan(20);
    expect(result.username).toBe(testUsername);
    
    loginToken = result.token;
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
    expect(result.username).toBe(testUsername);
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

    // Verify the update persisted
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const [updated] = await db
      .select()
      .from(schema.siteContent)
      .where(eq(schema.siteContent.id, testContentId))
      .limit(1);

    expect(updated.contentValue).toBe(testValue);
  });
});
