/**
 * Just Empower Shop Utilities
 * 
 * Shared utilities for safe data handling, price formatting, and validation
 * across all shop components and API routes.
 * 
 * @version 2.0
 * @date January 2026
 */

// ============================================================================
// SAFE JSON PARSING
// ============================================================================

/**
 * Safely parse JSON with type-safe defaults
 * Prevents crashes from malformed JSON in database fields
 */
export function safeJsonParse<T>(
  jsonString: string | null | undefined,
  defaultValue: T,
  fieldName?: string
): T {
  if (!jsonString || jsonString === '' || jsonString === 'null' || jsonString === 'undefined') {
    return defaultValue;
  }

  try {
    const parsed = JSON.parse(jsonString);
    
    // Validate array types
    if (Array.isArray(defaultValue) && !Array.isArray(parsed)) {
      console.warn(`[Shop] Expected array for ${fieldName || 'field'}, got ${typeof parsed}`);
      return defaultValue;
    }
    
    // Validate object types
    if (defaultValue !== null && typeof defaultValue === 'object' && !Array.isArray(defaultValue)) {
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        console.warn(`[Shop] Expected object for ${fieldName || 'field'}, got ${typeof parsed}`);
        return defaultValue;
      }
    }
    
    return parsed as T;
  } catch (error) {
    console.error(`[Shop] JSON parse error for ${fieldName || 'field'}:`, error);
    return defaultValue;
  }
}

/**
 * Parse product images field
 */
export function parseProductImages(imagesJson: string | null | undefined): string[] {
  return safeJsonParse<string[]>(imagesJson, [], 'images');
}

/**
 * Parse product tags field
 */
export function parseProductTags(tagsJson: string | null | undefined): string[] {
  return safeJsonParse<string[]>(tagsJson, [], 'tags');
}

/**
 * Parse product dimensions field
 */
export interface ProductDimensions {
  length?: number;
  width?: number;
  height?: number;
  unit?: 'in' | 'cm';
}

export function parseProductDimensions(dimensionsJson: string | null | undefined): ProductDimensions {
  return safeJsonParse<ProductDimensions>(dimensionsJson, {}, 'dimensions');
}

/**
 * Parse variant options field
 */
export interface VariantOptions {
  [key: string]: string;
}

export function parseVariantOptions(optionsJson: string | null | undefined): VariantOptions {
  return safeJsonParse<VariantOptions>(optionsJson, {}, 'options');
}

/**
 * Parse cart items from server storage
 */
export interface ServerCartItem {
  productId: number;
  variantId?: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export function parseCartItems(itemsJson: string | null | undefined): ServerCartItem[] {
  const items = safeJsonParse<ServerCartItem[]>(itemsJson, [], 'cartItems');
  
  // Validate each item has required fields
  return items.filter(item => {
    if (typeof item.productId !== 'number' || 
        typeof item.name !== 'string' ||
        typeof item.price !== 'number' ||
        typeof item.quantity !== 'number') {
      console.warn('[Shop] Invalid cart item structure:', item);
      return false;
    }
    return true;
  });
}

// ============================================================================
// PRICE UTILITIES (All calculations in cents to avoid floating point)
// ============================================================================

/**
 * Format cents to display price string
 */
export function formatPrice(cents: number): string {
  if (typeof cents !== 'number' || isNaN(cents)) {
    console.warn('[Shop] Invalid cents value:', cents);
    return '$0.00';
  }
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Parse display price to cents
 */
export function parsePriceToCents(displayPrice: string | number): number {
  if (typeof displayPrice === 'number') {
    // Assume already in cents if integer, otherwise convert
    return Number.isInteger(displayPrice) ? displayPrice : Math.round(displayPrice * 100);
  }
  
  // Remove currency symbols and whitespace
  const cleaned = displayPrice.replace(/[$,\s]/g, '');
  const parsed = parseFloat(cleaned);
  
  if (isNaN(parsed)) {
    console.warn('[Shop] Could not parse price:', displayPrice);
    return 0;
  }
  
  return Math.round(parsed * 100);
}

/**
 * Calculate line item total (quantity × price)
 * All values in cents
 */
export function calculateLineTotal(price: number, quantity: number): number {
  return Math.round(price * quantity);
}

/**
 * Calculate cart subtotal from items
 */
export function calculateSubtotal(items: Array<{ price: number; quantity: number }>): number {
  return items.reduce((sum, item) => sum + calculateLineTotal(item.price, item.quantity), 0);
}

/**
 * Calculate discount amount
 */
export interface DiscountApplication {
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
}

export function calculateDiscount(subtotal: number, discount: DiscountApplication): number {
  switch (discount.type) {
    case 'percentage':
      // Value is 0-100 percentage
      return Math.round(subtotal * (Math.min(discount.value, 100) / 100));
    case 'fixed':
      // Value is in cents, can't exceed subtotal
      return Math.min(discount.value, subtotal);
    case 'free_shipping':
      // Returns 0 for discount, shipping handled separately
      return 0;
    default:
      return 0;
  }
}

/**
 * Calculate shipping based on subtotal
 */
export const SHIPPING_RATES = {
  FREE_THRESHOLD: 10000, // $100 in cents
  STANDARD_RATE: 1000,   // $10 in cents
  EXPRESS_RATE: 2500,    // $25 in cents (future)
};

export function calculateShipping(subtotal: number, isFreeShipping: boolean = false): number {
  if (isFreeShipping || subtotal >= SHIPPING_RATES.FREE_THRESHOLD) {
    return 0;
  }
  return SHIPPING_RATES.STANDARD_RATE;
}

/**
 * Calculate order total
 */
export interface OrderCalculation {
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  total: number;
}

export function calculateOrderTotal(
  subtotal: number,
  discount: DiscountApplication | null,
  taxRate: number = 0 // e.g., 0.0825 for 8.25%
): OrderCalculation {
  const discountAmount = discount ? calculateDiscount(subtotal, discount) : 0;
  const afterDiscount = subtotal - discountAmount;
  
  const isFreeShipping = discount?.type === 'free_shipping';
  const shippingAmount = calculateShipping(afterDiscount, isFreeShipping);
  
  const taxableAmount = afterDiscount; // Shipping not taxed in most cases
  const taxAmount = Math.round(taxableAmount * taxRate);
  
  const total = afterDiscount + shippingAmount + taxAmount;
  
  return {
    subtotal,
    discountAmount,
    shippingAmount,
    taxAmount,
    total: Math.max(total, 0), // Never negative
  };
}

// ============================================================================
// INVENTORY VALIDATION
// ============================================================================

export interface StockCheckResult {
  available: boolean;
  currentStock: number;
  requestedQuantity: number;
  message?: string;
}

/**
 * Check if requested quantity is available
 */
export function checkStockAvailability(
  currentStock: number,
  requestedQuantity: number,
  trackInventory: boolean = true
): StockCheckResult {
  // If not tracking inventory, always available
  if (!trackInventory) {
    return {
      available: true,
      currentStock: Infinity,
      requestedQuantity,
    };
  }
  
  if (currentStock <= 0) {
    return {
      available: false,
      currentStock: 0,
      requestedQuantity,
      message: 'This item is currently out of stock',
    };
  }
  
  if (requestedQuantity > currentStock) {
    return {
      available: false,
      currentStock,
      requestedQuantity,
      message: `Only ${currentStock} available`,
    };
  }
  
  return {
    available: true,
    currentStock,
    requestedQuantity,
  };
}

/**
 * Check low stock threshold
 */
export function isLowStock(currentStock: number, threshold: number = 5): boolean {
  return currentStock > 0 && currentStock <= threshold;
}

// ============================================================================
// URL & SLUG UTILITIES
// ============================================================================

/**
 * Generate URL-safe slug from product name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Normalize image URL (handle S3, relative paths, etc.)
 */
export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url || url === '' || url === 'null' || url === 'undefined') {
    return null;
  }
  
  // Already a full URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // S3 path without protocol
  if (url.includes('.s3.') || url.includes('s3.amazonaws.com')) {
    return `https://${url}`;
  }
  
  // Relative path - prepend site root
  if (url.startsWith('/')) {
    return url; // Keep as relative for same-origin
  }
  
  // Assume relative path needs leading slash
  return `/${url}`;
}

/**
 * Generate SVG fallback image as data URL (no external dependencies)
 */
export const FALLBACK_PRODUCT_IMAGE = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8f8f7"/>
      <stop offset="100%" stop-color="#e8e7e1"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="100" y="175" width="200" height="3" fill="#c9a86c" opacity="0.5"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="#1a1a19" opacity="0.6">Product Image</text>
  <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="Georgia, serif" font-size="10" fill="#c9a86c" letter-spacing="2">JUST EMPOWER</text>
</svg>
`)}`;

// ============================================================================
// ORDER NUMBER GENERATION
// ============================================================================

/**
 * Generate unique order number
 * Format: JE-{TIMESTAMP_BASE36}-{RANDOM_4CHAR}
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `JE-${timestamp}-${random}`;
}

/**
 * Validate order number format
 */
export function isValidOrderNumber(orderNumber: string): boolean {
  return /^JE-[A-Z0-9]+-[A-Z0-9]{4}$/.test(orderNumber);
}

// ============================================================================
// DISCOUNT CODE VALIDATION
// ============================================================================

export interface DiscountValidation {
  valid: boolean;
  code?: string;
  type?: 'percentage' | 'fixed' | 'free_shipping';
  value?: number;
  message?: string;
}

/**
 * Validate discount code structure (client-side pre-check)
 */
export function validateDiscountCodeFormat(code: string): boolean {
  // At least 3 characters, alphanumeric with optional hyphens
  return /^[A-Z0-9-]{3,30}$/i.test(code.trim());
}

// ============================================================================
// SESSION ID MANAGEMENT
// ============================================================================

const SESSION_STORAGE_KEY = 'justxempower_session_id';

/**
 * Get or create session ID for cart association
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    return generateSessionId();
  }
  
  let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
  
  if (!sessionId || !isValidSessionId(sessionId)) {
    sessionId = generateSessionId();
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
  
  return sessionId;
}

/**
 * Generate new session ID
 */
function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `sess_${timestamp}_${random}`;
}

/**
 * Validate session ID format
 */
function isValidSessionId(id: string): boolean {
  return /^sess_[a-z0-9]+_[a-z0-9]+$/.test(id);
}

// ============================================================================
// DEBOUNCE UTILITY
// ============================================================================

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, waitMs);
  };
}

// ============================================================================
// ERROR HELPERS
// ============================================================================

export type ShopErrorType = 
  | 'network'
  | 'payment'
  | 'inventory'
  | 'validation'
  | 'server'
  | 'unknown';

export interface ShopError {
  type: ShopErrorType;
  message: string;
  code?: string;
  retryable: boolean;
}

/**
 * Categorize error for appropriate handling
 */
export function categorizeError(error: unknown): ShopError {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return {
        type: 'network',
        message: 'Unable to connect. Please check your internet connection.',
        retryable: true,
      };
    }
    
    // Payment errors
    if (message.includes('payment') || message.includes('stripe') || message.includes('card')) {
      return {
        type: 'payment',
        message: 'Payment could not be processed. Please try again or use a different payment method.',
        retryable: true,
      };
    }
    
    // Inventory errors
    if (message.includes('stock') || message.includes('inventory') || message.includes('available')) {
      return {
        type: 'inventory',
        message: 'Some items in your cart are no longer available.',
        retryable: false,
      };
    }
    
    // Validation errors
    if (message.includes('valid') || message.includes('required') || message.includes('invalid')) {
      return {
        type: 'validation',
        message: error.message,
        retryable: false,
      };
    }
  }
  
  // Generic server/unknown error
  return {
    type: 'unknown',
    message: 'Something went wrong. Please try again.',
    retryable: true,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // JSON Parsing
  safeJsonParse,
  parseProductImages,
  parseProductTags,
  parseProductDimensions,
  parseVariantOptions,
  parseCartItems,
  
  // Price Utilities
  formatPrice,
  parsePriceToCents,
  calculateLineTotal,
  calculateSubtotal,
  calculateDiscount,
  calculateShipping,
  calculateOrderTotal,
  SHIPPING_RATES,
  
  // Inventory
  checkStockAvailability,
  isLowStock,
  
  // URLs & Slugs
  generateSlug,
  normalizeImageUrl,
  FALLBACK_PRODUCT_IMAGE,
  
  // Order Numbers
  generateOrderNumber,
  isValidOrderNumber,
  
  // Discount Codes
  validateDiscountCodeFormat,
  
  // Session Management
  getSessionId,
  
  // Utilities
  debounce,
  categorizeError,
};
