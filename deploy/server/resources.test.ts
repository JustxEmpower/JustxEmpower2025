import { describe, it, expect, vi } from 'vitest';
import { publicResourcesRouter } from './resourcesRouter';
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

describe('Public Resources Router', () => {
  describe('categories procedure', () => {
    it('should be defined and callable', () => {
      const ctx = createMockContext();
      const caller = publicResourcesRouter.createCaller(ctx);
      
      // Verify the categories procedure exists
      expect(typeof caller.categories).toBe('function');
    });
  });

  describe('list procedure', () => {
    it('should be defined and callable', () => {
      const ctx = createMockContext();
      const caller = publicResourcesRouter.createCaller(ctx);
      
      // Verify the list procedure exists
      expect(typeof caller.list).toBe('function');
    });
  });

  describe('featured procedure', () => {
    it('should be defined and callable', () => {
      const ctx = createMockContext();
      const caller = publicResourcesRouter.createCaller(ctx);
      
      // Verify the featured procedure exists
      expect(typeof caller.featured).toBe('function');
    });
  });

  describe('download procedure', () => {
    it('should be defined and callable', () => {
      const ctx = createMockContext();
      const caller = publicResourcesRouter.createCaller(ctx);
      
      // Verify the download procedure exists
      expect(typeof caller.download).toBe('function');
    });
  });
});

describe('Public Resources Router Structure', () => {
  it('should have all required procedures', () => {
    const ctx = createMockContext();
    const caller = publicResourcesRouter.createCaller(ctx);
    
    // Verify all procedures exist
    expect(caller.categories).toBeDefined();
    expect(caller.list).toBeDefined();
    expect(caller.featured).toBeDefined();
    expect(caller.download).toBeDefined();
  });
});
