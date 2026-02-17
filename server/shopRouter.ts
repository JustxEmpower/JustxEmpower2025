import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { 
  products, 
  productCategories, 
  shoppingCarts, 
  orders, 
  orderItems, 
  discountCodes,
  Product,
  Order
} from "../drizzle/schema";
import { eq, and, desc, asc, like, sql, gte, lte, or, isNotNull } from "drizzle-orm";
import Stripe from "stripe";

// Lazy Stripe initialization — env vars may not be loaded at module init time
let _stripe: Stripe | null = null;
function getStripe(): Stripe | null {
  if (!_stripe && process.env.STRIPE_SECRET_KEY) {
    try {
      _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2024-12-18.acacia" as any,
      });
    } catch (e) {
      console.warn("Stripe initialization failed - payment features disabled", e);
    }
  }
  return _stripe;
}

// Helper to generate order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `JE-${timestamp}-${random}`;
}

// Helper to format price from cents
function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Safe JSON parse with default fallback - prevents crashes from malformed data
function safeJsonParse<T>(jsonString: string | null | undefined, defaultValue: T): T {
  if (!jsonString || jsonString === '' || jsonString === 'null' || jsonString === 'undefined') {
    return defaultValue;
  }
  try {
    const parsed = JSON.parse(jsonString);
    return parsed as T;
  } catch (error) {
    console.error('[ShopRouter] JSON parse error:', error, 'Input:', jsonString?.substring(0, 100));
    return defaultValue;
  }
}

export const shopRouter = router({
  // Debug endpoint to check all products in database
  debugProducts: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { error: "No database" };
    const allProducts = await db.select().from(products);
    return { 
      count: allProducts.length, 
      products: allProducts.map(p => ({ id: p.id, name: p.name, status: p.status, price: p.price }))
    };
  }),

  // Get all active products with filtering
  products: router({
    list: publicProcedure
      .input(z.object({
        categoryId: z.number().optional(),
        search: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        sortBy: z.enum(["newest", "oldest", "price_asc", "price_desc", "name"]).default("newest"),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        featured: z.boolean().optional(),
      }).optional())
      .query(async ({ input }) => {
        const { categoryId, search, minPrice, maxPrice, sortBy, limit, offset, featured } = input || {};
        
        const conditions = [eq(products.status, "active")];
        
        if (categoryId) {
          conditions.push(eq(products.categoryId, categoryId));
        }
        
        if (search) {
          conditions.push(
            or(
              like(products.name, `%${search}%`),
              like(products.description, `%${search}%`)
            )!
          );
        }
        
        if (minPrice !== undefined) {
          conditions.push(gte(products.price, minPrice));
        }
        
        if (maxPrice !== undefined) {
          conditions.push(lte(products.price, maxPrice));
        }
        
        if (featured) {
          conditions.push(eq(products.isFeatured, 1));
        }
        
        let orderBy;
        switch (sortBy) {
          case "oldest": orderBy = asc(products.createdAt); break;
          case "price_asc": orderBy = asc(products.price); break;
          case "price_desc": orderBy = desc(products.price); break;
          case "name": orderBy = asc(products.name); break;
          default: orderBy = asc(products.sortOrder); // Default to manual sort order
        }
        
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        const result = await db
          .select()
          .from(products)
          .where(and(...conditions))
          .orderBy(orderBy)
          .limit(limit || 20)
          .offset(offset || 0);
        
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(products)
          .where(and(...conditions));
        
        return {
          products: result.map((p: Product) => ({
            ...p,
            images: safeJsonParse<string[]>(p.images, []),
            tags: safeJsonParse<string[]>(p.tags, []),
            formattedPrice: formatPrice(p.price),
            formattedCompareAtPrice: p.compareAtPrice ? formatPrice(p.compareAtPrice) : null,
          })),
          total: countResult[0]?.count || 0,
          hasMore: (offset || 0) + (limit || 20) < (countResult[0]?.count || 0),
        };
      }),
    
    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const [product] = await db
          .select()
          .from(products)
          .where(and(eq(products.slug, input.slug), eq(products.status, "active")));
        
        if (!product) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        }
        
        return {
          ...product,
          images: safeJsonParse<string[]>(product.images, []),
          tags: safeJsonParse<string[]>(product.tags, []),
          dimensions: safeJsonParse<Record<string, any>>(product.dimensions, {}),
          formattedPrice: formatPrice(product.price),
          formattedCompareAtPrice: product.compareAtPrice ? formatPrice(product.compareAtPrice) : null,
        };
      }),
    
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const [product] = await db.select().from(products).where(eq(products.id, input.id));
        if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        return {
          ...product,
          images: safeJsonParse<string[]>(product.images, []),
          tags: safeJsonParse<string[]>(product.tags, []),
          dimensions: safeJsonParse<Record<string, any>>(product.dimensions, {}),
          formattedPrice: formatPrice(product.price),
          formattedCompareAtPrice: product.compareAtPrice ? formatPrice(product.compareAtPrice) : null,
        };
      }),
  }),
  
  categories: router({
    list: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      // Return all categories (remove isActive filter to show all created categories)
      return await db.select().from(productCategories).orderBy(asc(productCategories.order));
    }),
  }),
  
  cart: router({
    get: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const [cart] = await db.select().from(shoppingCarts).where(eq(shoppingCarts.sessionId, input.sessionId));
        if (!cart) return { items: [], subtotal: 0, discountAmount: 0, total: 0 };
        const items = safeJsonParse<any[]>(cart.items, []);
        const subtotal = cart.subtotal || 0;
        const discountAmount = cart.discountAmount || 0;
        return {
          id: cart.id,
          items,
          subtotal,
          discountCode: cart.discountCode,
          discountAmount,
          total: subtotal - discountAmount,
          formattedSubtotal: formatPrice(subtotal),
          formattedDiscount: formatPrice(discountAmount),
          formattedTotal: formatPrice(subtotal - discountAmount),
        };
      }),
    
    update: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        items: z.array(z.object({
          productId: z.number(),
          variantId: z.number().optional(),
          name: z.string(),
          price: z.number(),
          quantity: z.number(),
          imageUrl: z.string().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const { sessionId, items } = input;
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const [existingCart] = await db.select().from(shoppingCarts).where(eq(shoppingCarts.sessionId, sessionId));
        
        if (existingCart) {
          await db.update(shoppingCarts).set({ items: JSON.stringify(items), subtotal }).where(eq(shoppingCarts.sessionId, sessionId));
        } else {
          await db.insert(shoppingCarts).values({ sessionId, items: JSON.stringify(items), subtotal });
        }
        return { success: true, subtotal, formattedSubtotal: formatPrice(subtotal) };
      }),
    
    applyDiscount: publicProcedure
      .input(z.object({ sessionId: z.string(), code: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const { sessionId, code } = input;
        const [discount] = await db.select().from(discountCodes).where(and(eq(discountCodes.code, code.toUpperCase()), eq(discountCodes.isActive, 1)));
        if (!discount) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid discount code" });
        if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) throw new TRPCError({ code: "BAD_REQUEST", message: "Discount code has expired" });
        if (discount.maxUses && discount.usedCount >= discount.maxUses) throw new TRPCError({ code: "BAD_REQUEST", message: "Discount code has reached maximum uses" });
        
        const [cart] = await db.select().from(shoppingCarts).where(eq(shoppingCarts.sessionId, sessionId));
        if (!cart) throw new TRPCError({ code: "NOT_FOUND", message: "Cart not found" });
        if (discount.minOrderAmount && cart.subtotal < discount.minOrderAmount) throw new TRPCError({ code: "BAD_REQUEST", message: `Minimum order of ${formatPrice(discount.minOrderAmount)} required` });
        
        let discountAmount = 0;
        if (discount.type === "percentage") discountAmount = Math.round(cart.subtotal * (discount.value / 100));
        else if (discount.type === "fixed") discountAmount = discount.value;
        
        await db.update(shoppingCarts).set({ discountCode: code.toUpperCase(), discountAmount }).where(eq(shoppingCarts.sessionId, sessionId));
        return { success: true, discountAmount, formattedDiscount: formatPrice(discountAmount), discountType: discount.type };
      }),
    
    removeDiscount: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        await db.update(shoppingCarts).set({ discountCode: null, discountAmount: 0 }).where(eq(shoppingCarts.sessionId, input.sessionId));
        return { success: true };
      }),
    
    clear: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        await db.delete(shoppingCarts).where(eq(shoppingCarts.sessionId, input.sessionId));
        return { success: true };
      }),
  }),
  
  checkout: router({
    createPaymentIntent: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        email: z.string().email(),
        shippingAddress: z.object({
          firstName: z.string(),
          lastName: z.string(),
          address1: z.string(),
          address2: z.string().optional(),
          city: z.string(),
          state: z.string(),
          postalCode: z.string(),
          country: z.string(),
        }),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const { sessionId, email, shippingAddress } = input;
        const [cart] = await db.select().from(shoppingCarts).where(eq(shoppingCarts.sessionId, sessionId));
        if (!cart) throw new TRPCError({ code: "NOT_FOUND", message: "Cart not found" });
        
        const items = safeJsonParse<any[]>(cart.items, []);
        if (items.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Cart is empty" });
        
        const subtotal = cart.subtotal || 0;
        const discountAmount = cart.discountAmount || 0;
        const shippingAmount = subtotal >= 10000 ? 0 : 1000;
        const taxAmount = 0;
        const total = subtotal - discountAmount + shippingAmount + taxAmount;
        
        const stripe = getStripe();
        if (!stripe) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Payment processing not configured. STRIPE_SECRET_KEY=" + (process.env.STRIPE_SECRET_KEY ? 'SET' : 'MISSING') });
        const paymentIntent = await stripe.paymentIntents.create({
          amount: total,
          currency: "usd",
          receipt_email: email,
          metadata: { sessionId, email },
        });
        
        return {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          subtotal, discountAmount, shippingAmount, taxAmount, total,
          formattedSubtotal: formatPrice(subtotal),
          formattedDiscount: formatPrice(discountAmount),
          formattedShipping: shippingAmount === 0 ? "FREE" : formatPrice(shippingAmount),
          formattedTax: formatPrice(taxAmount),
          formattedTotal: formatPrice(total),
        };
      }),
    
    completeOrder: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        paymentIntentId: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
        shippingAddress: z.object({
          firstName: z.string(),
          lastName: z.string(),
          address1: z.string(),
          address2: z.string().optional(),
          city: z.string(),
          state: z.string(),
          postalCode: z.string(),
          country: z.string(),
        }),
        customerNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const { sessionId, paymentIntentId, email, phone, shippingAddress, customerNotes } = input;
        
        const stripe = getStripe();
        if (!stripe) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Payment processing not configured" });
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== "succeeded") throw new TRPCError({ code: "BAD_REQUEST", message: "Payment not completed" });
        
        const [cart] = await db.select().from(shoppingCarts).where(eq(shoppingCarts.sessionId, sessionId));
        if (!cart) throw new TRPCError({ code: "NOT_FOUND", message: "Cart not found" });
        
        const items = safeJsonParse<any[]>(cart.items, []);
        const subtotal = cart.subtotal || 0;
        const discountAmount = cart.discountAmount || 0;
        const shippingAmount = subtotal >= 10000 ? 0 : 1000;
        const taxAmount = 0;
        const total = subtotal - discountAmount + shippingAmount + taxAmount;
        const orderNumber = generateOrderNumber();
        
        const [orderResult] = await db.insert(orders).values({
          orderNumber, email, phone,
          status: "processing",
          paymentStatus: "paid",
          paymentMethod: "stripe",
          paymentIntentId,
          subtotal, discountAmount, discountCode: cart.discountCode,
          shippingAmount, taxAmount, total,
          currency: "USD",
          shippingFirstName: shippingAddress.firstName,
          shippingLastName: shippingAddress.lastName,
          shippingAddress1: shippingAddress.address1,
          shippingAddress2: shippingAddress.address2,
          shippingCity: shippingAddress.city,
          shippingState: shippingAddress.state,
          shippingPostalCode: shippingAddress.postalCode,
          shippingCountry: shippingAddress.country,
          customerNotes,
        });
        
        const orderId = orderResult.insertId;
        
        for (const item of items) {
          await db.insert(orderItems).values({
            orderId: Number(orderId),
            productId: item.productId,
            variantId: item.variantId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity,
            imageUrl: item.imageUrl,
          });
          await db.update(products).set({ stock: sql`${products.stock} - ${item.quantity}` }).where(eq(products.id, item.productId));
        }
        
        if (cart.discountCode) {
          await db.update(discountCodes).set({ usedCount: sql`${discountCodes.usedCount} + 1` }).where(eq(discountCodes.code, cart.discountCode));
        }
        
        await db.delete(shoppingCarts).where(eq(shoppingCarts.sessionId, sessionId));
        
        return { success: true, orderNumber, orderId: Number(orderId), total, formattedTotal: formatPrice(total) };
      }),
  }),
  
  orders: router({
    myOrders: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(10), offset: z.number().min(0).default(0) }).optional())
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const { limit, offset } = input || {};
        const userEmail = ctx.user.email;
        if (!userEmail) return { orders: [], total: 0 };
        
        const result = await db.select().from(orders).where(eq(orders.email, userEmail)).orderBy(desc(orders.createdAt)).limit(limit || 10).offset(offset || 0);
        
        const ordersWithItems = await Promise.all(
          result.map(async (order: Order) => {
            const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
            return { ...order, items, formattedTotal: formatPrice(order.total), formattedSubtotal: formatPrice(order.subtotal) };
          })
        );
        
        const countResult = await db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.email, userEmail));
        return { orders: ordersWithItems, total: countResult[0]?.count || 0 };
      }),
    
    byOrderNumber: publicProcedure
      .input(z.object({ orderNumber: z.string(), email: z.string().email() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const [order] = await db.select().from(orders).where(and(eq(orders.orderNumber, input.orderNumber), eq(orders.email, input.email)));
        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
        return {
          ...order, items,
          formattedTotal: formatPrice(order.total),
          formattedSubtotal: formatPrice(order.subtotal),
          formattedShipping: order.shippingAmount === 0 ? "FREE" : formatPrice(order.shippingAmount || 0),
          formattedDiscount: formatPrice(order.discountAmount || 0),
        };
      }),
  }),
});

export type ShopRouter = typeof shopRouter;
