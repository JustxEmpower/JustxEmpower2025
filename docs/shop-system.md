# Just Empower Shop System Documentation

**Version:** 1.0  
**Last Updated:** January 10, 2026  
**Author:** Manus AI

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Reference](#api-reference)
5. [Frontend Components](#frontend-components)
6. [Cart System](#cart-system)
7. [Checkout & Payment Flow](#checkout--payment-flow)
8. [Admin Management](#admin-management)
9. [Discount Codes](#discount-codes)
10. [Order Management](#order-management)
11. [Configuration](#configuration)
12. [Security Considerations](#security-considerations)

---

## Overview

The Just Empower Shop System is a full-featured e-commerce solution built into the Just Empower platform. It provides complete product management, shopping cart functionality, Stripe payment integration, order processing, and administrative tools for managing an online store.

### Key Features

| Feature | Description |
|---------|-------------|
| **Product Management** | Create, edit, and organize products with categories, variants, and inventory tracking |
| **Shopping Cart** | Persistent cart with localStorage backup and server-side synchronization |
| **Stripe Payments** | Secure payment processing with Payment Intents API |
| **Discount Codes** | Percentage, fixed amount, and free shipping promotions |
| **Order Tracking** | Full order lifecycle management with status updates |
| **Inventory Control** | Automatic stock deduction and low-stock alerts |
| **Guest Checkout** | No account required for purchases |
| **Admin Dashboard** | Comprehensive tools for product and order management |

---

## Architecture

The shop system follows a layered architecture pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Shop.tsx  │  │ProductDetail│  │    Checkout.tsx     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              CartContext (State Management)              ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    tRPC API Layer                            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                   shopRouter.ts                          ││
│  │  • products.list / bySlug / byId                        ││
│  │  • categories.list                                       ││
│  │  • cart.get / update / applyDiscount / clear            ││
│  │  • checkout.createPaymentIntent / completeOrder         ││
│  │  • orders.myOrders / byOrderNumber                      ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (MySQL/TiDB)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐│
│  │ products │ │  orders  │ │orderItems│ │ productCategories││
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘│
│  ┌──────────────┐ ┌────────────────┐ ┌──────────────────────┐│
│  │shoppingCarts │ │ discountCodes  │ │  productVariants    ││
│  └──────────────┘ └────────────────┘ └──────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Stripe API                            ││
│  │  • Payment Intents for secure card processing           ││
│  │  • Automatic receipt emails                              ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Products Table

The `products` table stores all product information with comprehensive fields for e-commerce functionality.

```typescript
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  sku: varchar("sku", { length: 100 }).unique(),
  description: text("description"),
  shortDescription: text("shortDescription"),
  price: int("price").notNull(),                    // Price in cents
  compareAtPrice: int("compareAtPrice"),            // Original price for discounts
  costPrice: int("costPrice"),                      // Cost for profit calculations
  categoryId: int("categoryId"),
  images: text("images"),                           // JSON array of image URLs
  featuredImage: varchar("featuredImage", { length: 1000 }),
  stock: int("stock").default(0).notNull(),
  lowStockThreshold: int("lowStockThreshold").default(5),
  trackInventory: int("trackInventory").default(1).notNull(),
  weight: int("weight"),                            // Weight in grams
  dimensions: text("dimensions"),                   // JSON: {length, width, height}
  tags: text("tags"),                               // JSON array of tags
  metaTitle: varchar("metaTitle", { length: 255 }),
  metaDescription: text("metaDescription"),
  status: mysqlEnum("status", ["draft", "active", "archived"]).default("draft"),
  isFeatured: int("isFeatured").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | INT | Auto-incrementing primary key |
| `name` | VARCHAR(255) | Product display name |
| `slug` | VARCHAR(255) | URL-friendly identifier (unique) |
| `sku` | VARCHAR(100) | Stock Keeping Unit (unique) |
| `price` | INT | Price in cents (e.g., 2999 = $29.99) |
| `compareAtPrice` | INT | Original price for showing discounts |
| `stock` | INT | Current inventory quantity |
| `status` | ENUM | draft, active, or archived |
| `isFeatured` | INT | Boolean flag for featured products |

### Product Categories Table

```typescript
export const productCategories = mysqlTable("productCategories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  imageUrl: varchar("imageUrl", { length: 1000 }),
  parentId: int("parentId"),                        // For nested categories
  order: int("order").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
```

### Product Variants Table

```typescript
export const productVariants = mysqlTable("productVariants", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "Small / Red"
  sku: varchar("sku", { length: 100 }),
  price: int("price"),                              // Override price if different
  stock: int("stock").default(0).notNull(),
  options: text("options"),                         // JSON: {size: "S", color: "Red"}
  imageUrl: varchar("imageUrl", { length: 1000 }),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

### Shopping Carts Table

```typescript
export const shoppingCarts = mysqlTable("shoppingCarts", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 255 }).notNull(),
  userId: int("userId"),                            // Optional: for logged-in users
  items: text("items").notNull(),                   // JSON array of cart items
  subtotal: int("subtotal").default(0).notNull(),   // In cents
  discountCode: varchar("discountCode", { length: 100 }),
  discountAmount: int("discountAmount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  expiresAt: timestamp("expiresAt"),                // For cart abandonment
});
```

### Discount Codes Table

```typescript
export const discountCodes = mysqlTable("discountCodes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  type: mysqlEnum("type", ["percentage", "fixed", "free_shipping"]).notNull(),
  value: int("value").notNull(),                    // Percentage (0-100) or cents
  minOrderAmount: int("minOrderAmount"),            // Minimum order for discount
  maxUses: int("maxUses"),                          // Total uses allowed
  usedCount: int("usedCount").default(0).notNull(),
  startsAt: timestamp("startsAt"),
  expiresAt: timestamp("expiresAt"),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

### Orders Table

```typescript
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  userId: int("userId"),                            // Optional: for guest checkout
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  status: mysqlEnum("status", [
    "pending", "processing", "shipped", "delivered", "cancelled", "refunded"
  ]).default("pending").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", [
    "pending", "paid", "failed", "refunded"
  ]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  paymentIntentId: varchar("paymentIntentId", { length: 255 }),
  subtotal: int("subtotal").notNull(),              // In cents
  discountAmount: int("discountAmount").default(0),
  discountCode: varchar("discountCode", { length: 100 }),
  shippingAmount: int("shippingAmount").default(0),
  taxAmount: int("taxAmount").default(0),
  total: int("total").notNull(),                    // In cents
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  // Shipping address fields...
  // Billing address fields...
  trackingNumber: varchar("trackingNumber", { length: 255 }),
  trackingUrl: varchar("trackingUrl", { length: 500 }),
  shippedAt: timestamp("shippedAt"),
  deliveredAt: timestamp("deliveredAt"),
  notes: text("notes"),                             // Internal notes
  customerNotes: text("customerNotes"),             // Customer order notes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
```

### Order Items Table

```typescript
export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  variantId: int("variantId"),
  name: varchar("name", { length: 255 }).notNull(), // Product name at time of order
  sku: varchar("sku", { length: 100 }),
  price: int("price").notNull(),                    // Price per unit in cents
  quantity: int("quantity").notNull(),
  total: int("total").notNull(),                    // price * quantity
  imageUrl: varchar("imageUrl", { length: 1000 }),
  options: text("options"),                         // JSON: variant options selected
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

---

## API Reference

### Public Shop Router (`shopRouter`)

All public shop endpoints are accessible without authentication.

#### Products

| Endpoint | Method | Description |
|----------|--------|-------------|
| `shop.products.list` | Query | List products with filtering and pagination |
| `shop.products.bySlug` | Query | Get single product by URL slug |
| `shop.products.byId` | Query | Get single product by ID |

**`shop.products.list` Input:**

```typescript
{
  categoryId?: number;        // Filter by category
  search?: string;            // Search in name/description
  minPrice?: number;          // Minimum price in cents
  maxPrice?: number;          // Maximum price in cents
  sortBy?: "newest" | "oldest" | "price_asc" | "price_desc" | "name";
  limit?: number;             // Default: 20, Max: 100
  offset?: number;            // Pagination offset
  featured?: boolean;         // Only featured products
}
```

**Response:**

```typescript
{
  products: Array<{
    id: number;
    name: string;
    slug: string;
    price: number;
    formattedPrice: string;   // e.g., "$29.99"
    images: string[];
    tags: string[];
    // ... all product fields
  }>;
  total: number;
  hasMore: boolean;
}
```

#### Categories

| Endpoint | Method | Description |
|----------|--------|-------------|
| `shop.categories.list` | Query | List all product categories |

#### Cart

| Endpoint | Method | Description |
|----------|--------|-------------|
| `shop.cart.get` | Query | Get cart by session ID |
| `shop.cart.update` | Mutation | Update cart items |
| `shop.cart.applyDiscount` | Mutation | Apply discount code |
| `shop.cart.removeDiscount` | Mutation | Remove discount code |
| `shop.cart.clear` | Mutation | Clear entire cart |

**`shop.cart.update` Input:**

```typescript
{
  sessionId: string;
  items: Array<{
    productId: number;
    variantId?: number;
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string;
  }>;
}
```

#### Checkout

| Endpoint | Method | Description |
|----------|--------|-------------|
| `shop.checkout.createPaymentIntent` | Mutation | Create Stripe payment intent |
| `shop.checkout.completeOrder` | Mutation | Complete order after payment |

**`shop.checkout.createPaymentIntent` Input:**

```typescript
{
  sessionId: string;
  email: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}
```

**Response:**

```typescript
{
  clientSecret: string;       // Stripe client secret for payment
  paymentIntentId: string;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  total: number;
  formattedTotal: string;
}
```

#### Orders

| Endpoint | Method | Description |
|----------|--------|-------------|
| `shop.orders.myOrders` | Query | Get orders for logged-in user |
| `shop.orders.byOrderNumber` | Query | Look up order by number and email |

---

## Frontend Components

### Shop Page (`Shop.tsx`)

The main shop page displays products in a grid layout with filtering capabilities.

**Features:**
- Product grid with responsive columns
- Category filtering
- Search functionality
- Sort options (newest, price, name)
- "Add to Cart" buttons
- Quick view product cards

**Location:** `client/src/pages/Shop.tsx`

### Product Detail Page (`ProductDetail.tsx`)

Individual product page with full details and purchase options.

**Features:**
- Large product images with gallery
- Full description
- Price display with sale indicators
- Quantity selector
- "Add to Cart" button
- Related products section

**Location:** `client/src/pages/ProductDetail.tsx`

### Cart Slideout (`CartSlideout.tsx`)

A slide-out panel showing cart contents.

**Features:**
- Item list with images
- Quantity adjustment (+/-)
- Remove item button
- Subtotal calculation
- Shipping estimate
- Free shipping threshold indicator
- Checkout button
- Clear cart option

**Location:** `client/src/components/CartSlideout.tsx`

### Checkout Page (`Checkout.tsx`)

Multi-step checkout process with Stripe integration.

**Features:**
- Order summary
- Shipping address form
- Stripe payment element
- Order confirmation
- Email receipt

**Location:** `client/src/pages/Checkout.tsx`

---

## Cart System

### CartContext

The cart system uses React Context for global state management with localStorage persistence.

**Location:** `client/src/contexts/CartContext.tsx`

```typescript
interface CartItem {
  id: number;
  name: string;
  price: number;        // In cents
  image: string;
  quantity: number;
  variant?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}
```

### Cart Persistence

The cart is persisted in two ways:

1. **localStorage** - Immediate persistence for the current browser session
2. **Server-side** - Synchronized to `shoppingCarts` table for cross-device access

**Storage Key:** `justxempower_cart`

### Cart Operations

| Operation | Description |
|-----------|-------------|
| `addToCart` | Adds item or increases quantity if exists |
| `removeFromCart` | Removes item completely |
| `updateQuantity` | Sets specific quantity (removes if 0) |
| `clearCart` | Empties entire cart |
| `getCartTotal` | Returns sum of (price × quantity) |
| `getCartCount` | Returns total number of items |

---

## Checkout & Payment Flow

### Payment Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Customer Journey                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. CART REVIEW                                              │
│     • View cart items                                        │
│     • Apply discount code (optional)                         │
│     • Click "Checkout"                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. SHIPPING INFORMATION                                     │
│     • Enter email address                                    │
│     • Enter shipping address                                 │
│     • Review order summary                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. CREATE PAYMENT INTENT                                    │
│     • API: shop.checkout.createPaymentIntent                │
│     • Calculates: subtotal, discount, shipping, tax, total  │
│     • Creates Stripe PaymentIntent                          │
│     • Returns clientSecret                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. STRIPE PAYMENT                                           │
│     • Display Stripe Payment Element                        │
│     • Customer enters card details                          │
│     • Stripe processes payment                              │
│     • Returns payment confirmation                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  5. COMPLETE ORDER                                           │
│     • API: shop.checkout.completeOrder                      │
│     • Verifies payment succeeded                            │
│     • Creates order record                                   │
│     • Creates order items                                    │
│     • Deducts inventory                                      │
│     • Increments discount code usage                        │
│     • Clears shopping cart                                   │
│     • Returns order confirmation                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  6. ORDER CONFIRMATION                                       │
│     • Display order number                                   │
│     • Show order summary                                     │
│     • Stripe sends receipt email                            │
└─────────────────────────────────────────────────────────────┘
```

### Shipping Calculation

Shipping is calculated based on order subtotal:

| Subtotal | Shipping Cost |
|----------|---------------|
| < $100.00 | $10.00 |
| ≥ $100.00 | FREE |

```typescript
const shippingAmount = subtotal >= 10000 ? 0 : 1000; // In cents
```

### Order Number Generation

Order numbers follow the format: `JE-{TIMESTAMP}-{RANDOM}`

```typescript
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `JE-${timestamp}-${random}`;
}
// Example: JE-M5K9X2-A7B3
```

---

## Admin Management

### Admin Products Page (`AdminProducts.tsx`)

**Location:** `client/src/pages/AdminProducts.tsx`

**Features:**
- Product listing with search and filters
- Create new product form
- Edit existing products
- Delete products
- Status management (draft/active/archived)
- Inventory tracking

### Admin Orders Page (`AdminOrders.tsx`)

**Location:** `client/src/pages/AdminOrders.tsx`

**Features:**
- Order listing with filters
- Order status updates
- Order details view
- Tracking number entry
- Customer information
- Order items breakdown

### Admin API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `admin.products.list` | Query | List all products (including drafts) |
| `admin.products.create` | Mutation | Create new product |
| `admin.products.update` | Mutation | Update product details |
| `admin.products.delete` | Mutation | Delete product |
| `admin.orders.list` | Query | List all orders |
| `admin.orders.getById` | Query | Get order details |
| `admin.orders.updateStatus` | Mutation | Update order status |

---

## Discount Codes

### Discount Types

| Type | Description | Value Field |
|------|-------------|-------------|
| `percentage` | Percentage off order | 0-100 (percent) |
| `fixed` | Fixed amount off | Amount in cents |
| `free_shipping` | Free shipping | Not used |

### Discount Validation

When applying a discount code, the system validates:

1. **Code exists** - Must be in database
2. **Is active** - `isActive = 1`
3. **Not expired** - `expiresAt > now()` or null
4. **Not maxed out** - `usedCount < maxUses` or null
5. **Minimum order met** - `subtotal >= minOrderAmount` or null

### Discount Application

```typescript
let discountAmount = 0;
if (discount.type === "percentage") {
  discountAmount = Math.round(cart.subtotal * (discount.value / 100));
} else if (discount.type === "fixed") {
  discountAmount = discount.value;
}
```

---

## Order Management

### Order Status Flow

```
pending → processing → shipped → delivered
    │         │           │
    └─────────┴───────────┴──→ cancelled
                               refunded
```

| Status | Description |
|--------|-------------|
| `pending` | Order created, awaiting processing |
| `processing` | Payment confirmed, preparing shipment |
| `shipped` | Package sent, tracking available |
| `delivered` | Package received by customer |
| `cancelled` | Order cancelled before shipment |
| `refunded` | Payment refunded to customer |

### Payment Status

| Status | Description |
|--------|-------------|
| `pending` | Awaiting payment |
| `paid` | Payment successful |
| `failed` | Payment failed |
| `refunded` | Payment refunded |

### Inventory Management

When an order is completed:

```typescript
// Deduct stock for each item
await db.update(products)
  .set({ stock: sql`${products.stock} - ${item.quantity}` })
  .where(eq(products.id, item.productId));
```

---

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `STRIPE_SECRET_KEY` | Stripe API secret key | Yes (for payments) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Yes (for frontend) |
| `DATABASE_URL` | MySQL/TiDB connection string | Yes |

### Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get API keys from Dashboard → Developers → API keys
3. Set `STRIPE_SECRET_KEY` in environment
4. Set `VITE_STRIPE_PUBLISHABLE_KEY` for frontend

### Price Format

All prices are stored in **cents** (integer) to avoid floating-point issues:

| Display | Stored Value |
|---------|--------------|
| $29.99 | 2999 |
| $100.00 | 10000 |
| $0.50 | 50 |

**Helper function:**

```typescript
function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
```

---

## Security Considerations

### Payment Security

- All payment processing happens through Stripe
- Card details never touch your server
- Payment Intents API provides secure, PCI-compliant flow
- Server verifies payment status before completing orders

### Data Validation

- All inputs validated with Zod schemas
- SQL injection prevented by Drizzle ORM
- XSS prevented by React's automatic escaping

### Authentication

- Admin endpoints protected by `adminProcedure`
- User order history protected by `protectedProcedure`
- Guest checkout available for public purchases

### Rate Limiting

Consider implementing rate limiting for:
- Discount code attempts
- Checkout submissions
- Product searches

---

## File Reference

| File | Purpose |
|------|---------|
| `drizzle/schema.ts` | Database table definitions |
| `server/shopRouter.ts` | Public shop API endpoints |
| `server/adminRouters.ts` | Admin shop API endpoints |
| `client/src/contexts/CartContext.tsx` | Cart state management |
| `client/src/components/CartSlideout.tsx` | Cart UI component |
| `client/src/pages/Shop.tsx` | Main shop page |
| `client/src/pages/ProductDetail.tsx` | Product detail page |
| `client/src/pages/Checkout.tsx` | Checkout flow |
| `client/src/pages/AdminProducts.tsx` | Admin product management |
| `client/src/pages/AdminOrders.tsx` | Admin order management |

---

## Appendix: Complete Cart Item Schema

```typescript
// Cart item as stored in CartContext
interface CartItem {
  id: number;           // Product ID
  name: string;         // Product name
  price: number;        // Price in cents
  image: string;        // Product image URL
  quantity: number;     // Quantity in cart
  variant?: string;     // Optional variant name
}

// Cart item as stored in server (shoppingCarts.items JSON)
interface ServerCartItem {
  productId: number;
  variantId?: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}
```

---

*This documentation is maintained as part of the Just Empower platform. For questions or updates, contact the development team.*
