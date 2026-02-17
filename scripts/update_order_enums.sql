-- Migration: Add new enum values for order status and payment status
-- Required for Stripe webhook handling (disputes, partial refunds, holds)

ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'on_hold') NOT NULL DEFAULT 'pending';

ALTER TABLE orders MODIFY COLUMN paymentStatus ENUM('pending', 'paid', 'failed', 'refunded', 'partially_refunded', 'disputed') NOT NULL DEFAULT 'pending';
