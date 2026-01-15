import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-test-user",
    email: "admin@test.com",
    name: "Admin User",
    loginMethod: "admin",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  
  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
  
  return ctx;
}

describe("Admin Router Structure", () => {
  it("should have admin router with products sub-router", () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify the admin router exists and has the expected structure
    expect(caller.admin).toBeDefined();
    expect(caller.admin.products).toBeDefined();
    expect(caller.admin.events).toBeDefined();
    expect(caller.admin.orders).toBeDefined();
  });

  it("should have products CRUD procedures defined", () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify products procedures exist
    expect(caller.admin.products.list).toBeDefined();
    expect(caller.admin.products.create).toBeDefined();
    expect(caller.admin.products.update).toBeDefined();
    expect(caller.admin.products.delete).toBeDefined();
  });

  it("should have events CRUD procedures defined", () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify events procedures exist
    expect(caller.admin.events.list).toBeDefined();
    expect(caller.admin.events.create).toBeDefined();
    expect(caller.admin.events.update).toBeDefined();
    expect(caller.admin.events.delete).toBeDefined();
    expect(caller.admin.events.getRegistrations).toBeDefined();
  });

  it("should have orders procedures defined", () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify orders procedures exist
    expect(caller.admin.orders.list).toBeDefined();
    expect(caller.admin.orders.updateStatus).toBeDefined();
  });
});

describe("Shop Router Structure", () => {
  it("should have shop router with products sub-router", () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify the shop router exists
    expect(caller.shop).toBeDefined();
    expect(caller.shop.products).toBeDefined();
    expect(caller.shop.categories).toBeDefined();
  });

  it("should have shop products procedures defined", () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify shop products procedures exist
    expect(caller.shop.products.list).toBeDefined();
    expect(caller.shop.products.getBySlug).toBeDefined();
  });
});

describe("Events Router Structure", () => {
  it("should have events router defined", () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify the events router exists
    expect(caller.events).toBeDefined();
  });

  it("should have events procedures defined", () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify events procedures exist
    expect(caller.events.list).toBeDefined();
    expect(caller.events.getBySlug).toBeDefined();
    expect(caller.events.createPaymentIntent).toBeDefined();
    expect(caller.events.completeRegistration).toBeDefined();
  });
});
