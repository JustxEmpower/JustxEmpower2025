import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { 
  events, 
  eventTicketTypes, 
  eventRegistrations, 
  eventAttendees,
  Event
} from "../drizzle/schema";
import { eq, and, desc, asc, gte, lte, sql, or, like } from "drizzle-orm";
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

function formatPrice(cents: number): string {
  return cents === 0 ? "Free" : `$${(cents / 100).toFixed(2)}`;
}

function generateConfirmationNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `EVT-${timestamp}-${random}`;
}

export const eventsRouter = router({
  // List all published events
  list: publicProcedure
    .input(z.object({
      status: z.enum(["upcoming", "past", "all"]).default("upcoming"),
      category: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const { status, category, search, limit, offset } = input || {};
      const now = new Date();
      
      const conditions = [eq(events.status, "published")];
      
      if (status === "upcoming") {
        conditions.push(gte(events.startDate, now));
      } else if (status === "past") {
        conditions.push(lte(events.startDate, now));
      }
      
      if (category) {
        conditions.push(eq(events.eventType, category as "workshop" | "retreat" | "webinar" | "meetup" | "conference" | "other"));
      }
      
      if (search) {
        conditions.push(
          or(
            like(events.title, `%${search}%`),
            like(events.description, `%${search}%`)
          )!
        );
      }
      
      const result = await db
        .select()
        .from(events)
        .where(and(...conditions))
        .orderBy(status === "past" ? desc(events.startDate) : asc(events.startDate))
        .limit(limit || 20)
        .offset(offset || 0);
      
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(events)
        .where(and(...conditions));
      
      return {
        events: result.map((e: Event) => ({
          ...e,
          formattedPrice: formatPrice(e.price || 0),
          isPast: new Date(e.startDate) < now,
          isUpcoming: new Date(e.startDate) > now,
          spotsRemaining: e.capacity ? e.capacity - (e.registrationCount || 0) : null,
        })),
        total: countResult[0]?.count || 0,
        hasMore: (offset || 0) + (limit || 20) < (countResult[0]?.count || 0),
      };
    }),
  
  // Get single event by slug
  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const [event] = await db
        .select()
        .from(events)
        .where(and(eq(events.slug, input.slug), eq(events.status, "published")));
      
      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      
      // Get ticket types for this event
      const tickets = await db
        .select()
        .from(eventTicketTypes)
        .where(and(eq(eventTicketTypes.eventId, event.id), eq(eventTicketTypes.isActive, 1)))
        .orderBy(asc(eventTicketTypes.price));
      
      const now = new Date();
      return {
        ...event,
        formattedPrice: formatPrice(event.price || 0),
        isPast: new Date(event.startDate) < now,
        isUpcoming: new Date(event.startDate) > now,
        spotsRemaining: event.capacity ? event.capacity - (event.registrationCount || 0) : null,
        ticketTypes: tickets.map(t => ({
          ...t,
          formattedPrice: formatPrice(t.price),
          spotsRemaining: t.quantity ? t.quantity - (t.soldCount || 0) : null,
        })),
      };
    }),
  
  // Get event by ID
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const [event] = await db.select().from(events).where(eq(events.id, input.id));
      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      
      return {
        ...event,
        formattedPrice: formatPrice(event.price || 0),
      };
    }),
  
  // Create payment intent for event registration
  createPaymentIntent: publicProcedure
    .input(z.object({
      eventId: z.number(),
      ticketTypeId: z.number().optional(),
      quantity: z.number().min(1).max(10).default(1),
      attendeeEmail: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const { eventId, ticketTypeId, quantity, attendeeEmail } = input;
      
      // Validate event
      const [event] = await db.select().from(events).where(eq(events.id, eventId));
      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      if (event.status !== "published") throw new TRPCError({ code: "BAD_REQUEST", message: "Event is not available for registration" });
      
      const now = new Date();
      if (new Date(event.startDate) < now) throw new TRPCError({ code: "BAD_REQUEST", message: "Event has already started" });
      
      // Check capacity
      if (event.capacity) {
        const spotsRemaining = event.capacity - (event.registrationCount || 0);
        if (spotsRemaining < quantity) throw new TRPCError({ code: "BAD_REQUEST", message: `Only ${spotsRemaining} spots remaining` });
      }
      
      // Calculate price
      let unitPrice = event.price || 0;
      let ticketTypeName = "General Admission";
      
      if (ticketTypeId) {
        const [ticketType] = await db.select().from(eventTicketTypes).where(eq(eventTicketTypes.id, ticketTypeId));
        if (ticketType) {
          unitPrice = ticketType.price;
          ticketTypeName = ticketType.name;
          
          // Check ticket type capacity
          if (ticketType.quantity) {
            const remaining = ticketType.quantity - (ticketType.soldCount || 0);
            if (remaining < quantity) throw new TRPCError({ code: "BAD_REQUEST", message: `Only ${remaining} tickets of this type remaining` });
          }
        }
      }
      
      const totalAmount = unitPrice * quantity;
      
      // If free event, skip payment
      if (totalAmount === 0) {
        return {
          isFree: true,
          totalAmount: 0,
          formattedTotal: "Free",
          eventId,
          ticketTypeId,
          quantity,
        };
      }
      
      // Create Stripe payment intent
      const stripe = getStripe();
      if (!stripe) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Payment processing not configured" });
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmount,
        currency: "usd",
        receipt_email: attendeeEmail,
        metadata: {
          eventId: eventId.toString(),
          ticketTypeId: ticketTypeId?.toString() || "",
          quantity: quantity.toString(),
          ticketTypeName,
        },
      });
      
      return {
        isFree: false,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        totalAmount,
        unitPrice,
        quantity,
        formattedUnitPrice: formatPrice(unitPrice),
        formattedTotal: formatPrice(totalAmount),
        ticketTypeName,
      };
    }),
  
  // Complete registration (for both free and paid events)
  completeRegistration: publicProcedure
    .input(z.object({
      eventId: z.number(),
      ticketTypeId: z.number().optional(),
      paymentIntentId: z.string().optional(),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      phone: z.string().optional(),
      quantity: z.number().min(1).default(1),
      dietaryRestrictions: z.string().optional(),
      specialRequests: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const { eventId, ticketTypeId, paymentIntentId, firstName, lastName, email, phone, quantity, dietaryRestrictions, specialRequests } = input;
      
      // Validate event
      const [event] = await db.select().from(events).where(eq(events.id, eventId));
      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      
      let unitPrice = event.price || 0;
      
      if (ticketTypeId) {
        const [ticketType] = await db.select().from(eventTicketTypes).where(eq(eventTicketTypes.id, ticketTypeId));
        if (ticketType) {
          unitPrice = ticketType.price;
        }
      }
      
      const totalAmount = unitPrice * quantity;
      
      // Verify payment if not free
      if (totalAmount > 0) {
        if (!paymentIntentId) throw new TRPCError({ code: "BAD_REQUEST", message: "Payment required" });
        
        const stripe = getStripe();
        if (!stripe) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Payment processing not configured" });
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== "succeeded") throw new TRPCError({ code: "BAD_REQUEST", message: "Payment not completed" });
      }
      
      const confirmationNumber = generateConfirmationNumber();
      
      // Create registration
      const [registrationResult] = await db.insert(eventRegistrations).values({
        eventId,
        ticketTypeId,
        confirmationNumber,
        firstName,
        lastName,
        email,
        phone,
        quantity,
        unitPrice,
        total: totalAmount,
        status: "confirmed",
        paymentStatus: totalAmount > 0 ? "paid" : "pending",
        paymentIntentId,
        dietaryRestrictions,
        specialRequests,
      });
      
      const registrationId = registrationResult.insertId;
      
      // Create attendee record
      await db.insert(eventAttendees).values({
        registrationId: Number(registrationId),
        eventId,
        firstName,
        lastName,
        email,
        phone,
        ticketTypeId,
        dietaryRestrictions,
      });
      
      // Update event registration count
      await db.update(events).set({
        registrationCount: sql`${events.registrationCount} + ${quantity}`,
      }).where(eq(events.id, eventId));
      
      // Update ticket type sold count if applicable
      if (ticketTypeId) {
        await db.update(eventTicketTypes).set({
          soldCount: sql`${eventTicketTypes.soldCount} + ${quantity}`,
        }).where(eq(eventTicketTypes.id, ticketTypeId));
      }
      
      return {
        success: true,
        confirmationNumber,
        registrationId: Number(registrationId),
        eventTitle: event.title,
        eventDate: event.startDate,
        quantity,
        totalAmount,
        formattedTotal: formatPrice(totalAmount),
      };
    }),
  
  // Look up registration by confirmation number
  lookupRegistration: publicProcedure
    .input(z.object({
      confirmationNumber: z.string(),
      email: z.string().email(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const [registration] = await db
        .select()
        .from(eventRegistrations)
        .where(and(
          eq(eventRegistrations.confirmationNumber, input.confirmationNumber),
          eq(eventRegistrations.email, input.email)
        ));
      
      if (!registration) throw new TRPCError({ code: "NOT_FOUND", message: "Registration not found" });
      
      const [event] = await db.select().from(events).where(eq(events.id, registration.eventId));
      
      const attendees = await db
        .select()
        .from(eventAttendees)
        .where(eq(eventAttendees.registrationId, registration.id));
      
      return {
        ...registration,
        event,
        attendees,
        formattedTotal: formatPrice(registration.total || 0),
      };
    }),
  
  // Get user's registrations
  myRegistrations: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const userEmail = ctx.user.email;
      if (!userEmail) return { registrations: [] };
      
      const registrations = await db
        .select()
        .from(eventRegistrations)
        .where(eq(eventRegistrations.email, userEmail))
        .orderBy(desc(eventRegistrations.createdAt));
      
      const registrationsWithEvents = await Promise.all(
        registrations.map(async (reg) => {
          const [event] = await db.select().from(events).where(eq(events.id, reg.eventId));
          const attendees = await db.select().from(eventAttendees).where(eq(eventAttendees.registrationId, reg.id));
          return {
            ...reg,
            event,
            attendees,
            formattedTotal: formatPrice(reg.total || 0),
          };
        })
      );
      
      return { registrations: registrationsWithEvents };
    }),
  
  // Get events for calendar view (by date range)
  calendar: publicProcedure
    .input(z.object({
      startDate: z.string(), // ISO date string
      endDate: z.string(), // ISO date string
      eventTypes: z.array(z.string()).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const start = new Date(input.startDate);
      const end = new Date(input.endDate);
      
      const conditions = [
        eq(events.status, "published"),
        gte(events.startDate, start),
        lte(events.startDate, end),
      ];
      
      if (input.eventTypes && input.eventTypes.length > 0) {
        conditions.push(
          or(
            ...input.eventTypes.map(type => 
              eq(events.eventType, type as "workshop" | "retreat" | "webinar" | "meetup" | "conference" | "other")
            )
          )!
        );
      }
      
      const result = await db
        .select()
        .from(events)
        .where(and(...conditions))
        .orderBy(asc(events.startDate));
      
      return result.map((e: Event) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        description: e.shortDescription || e.description,
        eventType: e.eventType,
        startDate: e.startDate,
        endDate: e.endDate,
        isAllDay: e.isAllDay === 1,
        locationType: e.locationType,
        venue: e.venue,
        city: e.city,
        isFree: e.isFree === 1,
        price: e.price,
        formattedPrice: formatPrice(e.price || 0),
        capacity: e.capacity,
        registrationCount: e.registrationCount,
        spotsRemaining: e.capacity ? e.capacity - (e.registrationCount || 0) : null,
        featuredImage: e.featuredImage,
        registrationOpen: e.registrationOpen === 1,
      }));
    }),
  
  // Get event types for filter
  eventTypes: publicProcedure.query(async () => {
    return [
      { value: "workshop", label: "Workshop", color: "#F59E0B" },
      { value: "retreat", label: "Retreat", color: "#10B981" },
      { value: "webinar", label: "Webinar", color: "#3B82F6" },
      { value: "meetup", label: "Meetup", color: "#8B5CF6" },
      { value: "conference", label: "Conference", color: "#EC4899" },
      { value: "other", label: "Other", color: "#6B7280" },
    ];
  }),

  // Cancel registration
  cancelRegistration: publicProcedure
    .input(z.object({
      confirmationNumber: z.string(),
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const [registration] = await db
        .select()
        .from(eventRegistrations)
        .where(and(
          eq(eventRegistrations.confirmationNumber, input.confirmationNumber),
          eq(eventRegistrations.email, input.email)
        ));
      
      if (!registration) throw new TRPCError({ code: "NOT_FOUND", message: "Registration not found" });
      if (registration.status === "cancelled") throw new TRPCError({ code: "BAD_REQUEST", message: "Registration already cancelled" });
      
      // Update registration status
      await db.update(eventRegistrations).set({
        status: "cancelled",
      }).where(eq(eventRegistrations.id, registration.id));
      
      // Update event registration count
      await db.update(events).set({
        registrationCount: sql`${events.registrationCount} - ${registration.quantity}`,
      }).where(eq(events.id, registration.eventId));
      
      // Update ticket type sold count if applicable
      if (registration.ticketTypeId) {
        await db.update(eventTicketTypes).set({
          soldCount: sql`${eventTicketTypes.soldCount} - ${registration.quantity}`,
        }).where(eq(eventTicketTypes.id, registration.ticketTypeId));
      }
      
      // Process refund if paid
      if (registration.paymentIntentId && registration.paymentStatus === "paid" && stripe) {
        try {
          await stripe.refunds.create({
            payment_intent: registration.paymentIntentId,
          });
          
          await db.update(eventRegistrations).set({
            paymentStatus: "refunded",
          }).where(eq(eventRegistrations.id, registration.id));
        } catch (error) {
          console.error("Refund failed:", error);
        }
      }
      
      return { success: true, message: "Registration cancelled successfully" };
    }),
});

export type EventsRouter = typeof eventsRouter;
