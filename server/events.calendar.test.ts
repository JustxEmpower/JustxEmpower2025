import { describe, it, expect, vi } from 'vitest';
import { eventsRouter } from './eventsRouter';
import type { TrpcContext } from './_core/context';

// Create a mock context
function createMockContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext['res'],
  };
}

describe('Events Calendar Router', () => {
  describe('eventTypes', () => {
    it('should return event types for filtering', async () => {
      const ctx = createMockContext();
      const caller = eventsRouter.createCaller(ctx);
      
      // Call the eventTypes procedure
      const result = await caller.eventTypes();
      
      // Verify the result structure
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Verify each event type has required properties
      result.forEach(type => {
        expect(type).toHaveProperty('value');
        expect(type).toHaveProperty('label');
        expect(type).toHaveProperty('color');
      });
    });

    it('should include all expected event types', async () => {
      const ctx = createMockContext();
      const caller = eventsRouter.createCaller(ctx);
      const result = await caller.eventTypes();
      
      const expectedTypes = ['workshop', 'retreat', 'webinar', 'meetup', 'conference', 'other'];
      const resultValues = result.map(t => t.value);
      
      expectedTypes.forEach(type => {
        expect(resultValues).toContain(type);
      });
    });

    it('should have correct color codes for each type', async () => {
      const ctx = createMockContext();
      const caller = eventsRouter.createCaller(ctx);
      const result = await caller.eventTypes();
      
      // Verify colors are valid hex codes
      result.forEach(type => {
        expect(type.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe('calendar procedure', () => {
    it('should be defined and callable', () => {
      const ctx = createMockContext();
      const caller = eventsRouter.createCaller(ctx);
      
      // Verify the calendar procedure exists
      expect(typeof caller.calendar).toBe('function');
    });
  });

  describe('list procedure', () => {
    it('should be defined and callable', () => {
      const ctx = createMockContext();
      const caller = eventsRouter.createCaller(ctx);
      
      // Verify the list procedure exists
      expect(typeof caller.list).toBe('function');
    });
  });
});
