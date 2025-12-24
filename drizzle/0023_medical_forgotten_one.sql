CREATE TABLE `adminSessions` (
	`token` varchar(255) NOT NULL,
	`username` varchar(100) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adminSessions_token` PRIMARY KEY(`token`)
);
--> statement-breakpoint
CREATE TABLE `adminUsers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(100) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`email` varchar(320),
	`role` varchar(50) NOT NULL DEFAULT 'editor',
	`permissions` text,
	`mailchimpApiKey` varchar(255),
	`mailchimpAudienceId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastLoginAt` timestamp,
	CONSTRAINT `adminUsers_id` PRIMARY KEY(`id`),
	CONSTRAINT `adminUsers_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `aiChatConversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(255) NOT NULL,
	`visitorId` varchar(255),
	`message` text NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`context` text,
	`sentiment` varchar(50),
	`topic` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiChatConversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aiFeedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`visitorId` varchar(255),
	`rating` enum('positive','negative') NOT NULL,
	`feedbackText` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiFeedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aiSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`geminiApiKey` varchar(500),
	`chatEnabled` int NOT NULL DEFAULT 1,
	`chatBubbleColor` varchar(50) DEFAULT '#000000',
	`chatBubblePosition` varchar(50) DEFAULT 'bottom-right',
	`systemPrompt` text,
	`autoResponses` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aiSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analyticsEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`visitorId` varchar(255),
	`sessionId` varchar(255) NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`eventData` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analyticsEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analyticsPageViews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`visitorId` varchar(255),
	`sessionId` varchar(255) NOT NULL,
	`page` varchar(500) NOT NULL,
	`referrer` varchar(500),
	`userAgent` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analyticsPageViews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analyticsSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(255) NOT NULL,
	`visitorId` varchar(255),
	`startTime` timestamp NOT NULL DEFAULT (now()),
	`endTime` timestamp,
	`pageCount` int NOT NULL DEFAULT 0,
	`duration` int NOT NULL DEFAULT 0,
	CONSTRAINT `analyticsSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `analyticsSessions_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE TABLE `articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`category` varchar(100),
	`date` varchar(50),
	`excerpt` text,
	`content` text NOT NULL,
	`imageUrl` varchar(500),
	`published` int NOT NULL DEFAULT 1,
	`status` varchar(20) NOT NULL DEFAULT 'published',
	`publishDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `articles_id` PRIMARY KEY(`id`),
	CONSTRAINT `articles_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `backups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`backupName` varchar(255) NOT NULL,
	`backupType` varchar(50) NOT NULL,
	`backupData` text NOT NULL,
	`fileSize` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `backups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blockTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`blocks` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blockTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blockVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`blockId` int NOT NULL,
	`pageId` int NOT NULL,
	`type` enum('text','image','video','quote','cta','spacer') NOT NULL,
	`content` text,
	`order` int NOT NULL,
	`settings` text,
	`versionNumber` int NOT NULL,
	`createdBy` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blockVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brandAssets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assetType` enum('logo_header','logo_footer','logo_mobile','favicon','og_image','twitter_image') NOT NULL,
	`assetUrl` varchar(1000) NOT NULL,
	`assetName` varchar(255),
	`width` int,
	`height` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brandAssets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `discountCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(100) NOT NULL,
	`type` enum('percentage','fixed','free_shipping') NOT NULL,
	`value` int NOT NULL,
	`minOrderAmount` int,
	`maxUses` int,
	`usedCount` int NOT NULL DEFAULT 0,
	`startsAt` timestamp,
	`expiresAt` timestamp,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `discountCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `discountCodes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `emailSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`emailProvider` varchar(50),
	`apiKey` varchar(500),
	`fromEmail` varchar(320),
	`fromName` varchar(255),
	`smtpHost` varchar(255),
	`smtpPort` int,
	`smtpUsername` varchar(255),
	`smtpPassword` varchar(255),
	`weeklyReportEnabled` int NOT NULL DEFAULT 0,
	`reportRecipients` text,
	`reportDay` int DEFAULT 1,
	`reportTime` varchar(5) DEFAULT '09:00',
	`lastSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `eventAttendees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registrationId` int NOT NULL,
	`eventId` int NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(320),
	`phone` varchar(50),
	`ticketTypeId` int,
	`checkedInAt` timestamp,
	`qrCode` varchar(255),
	`dietaryRestrictions` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `eventAttendees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `eventRegistrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`userId` int,
	`ticketTypeId` int,
	`confirmationNumber` varchar(50) NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`quantity` int NOT NULL DEFAULT 1,
	`unitPrice` int NOT NULL,
	`total` int NOT NULL,
	`paymentStatus` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
	`paymentIntentId` varchar(255),
	`status` enum('pending','confirmed','waitlisted','cancelled','attended','no_show') NOT NULL DEFAULT 'pending',
	`checkedInAt` timestamp,
	`dietaryRestrictions` text,
	`specialRequests` text,
	`customFields` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `eventRegistrations_id` PRIMARY KEY(`id`),
	CONSTRAINT `eventRegistrations_confirmationNumber_unique` UNIQUE(`confirmationNumber`)
);
--> statement-breakpoint
CREATE TABLE `eventTicketTypes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`price` int NOT NULL,
	`quantity` int,
	`soldCount` int NOT NULL DEFAULT 0,
	`maxPerOrder` int DEFAULT 10,
	`salesStart` timestamp,
	`salesEnd` timestamp,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `eventTicketTypes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`shortDescription` text,
	`eventType` enum('workshop','retreat','webinar','meetup','conference','other') NOT NULL DEFAULT 'workshop',
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`timezone` varchar(100) DEFAULT 'America/Los_Angeles',
	`isAllDay` int NOT NULL DEFAULT 0,
	`locationType` enum('in_person','virtual','hybrid') NOT NULL DEFAULT 'in_person',
	`venue` varchar(255),
	`address` text,
	`city` varchar(100),
	`state` varchar(100),
	`country` varchar(100),
	`virtualUrl` varchar(500),
	`virtualPassword` varchar(100),
	`isFree` int NOT NULL DEFAULT 0,
	`price` int DEFAULT 0,
	`earlyBirdPrice` int,
	`earlyBirdDeadline` timestamp,
	`capacity` int,
	`registrationCount` int NOT NULL DEFAULT 0,
	`waitlistEnabled` int NOT NULL DEFAULT 0,
	`featuredImage` varchar(1000),
	`images` text,
	`registrationOpen` int NOT NULL DEFAULT 1,
	`registrationDeadline` timestamp,
	`requiresApproval` int NOT NULL DEFAULT 0,
	`metaTitle` varchar(255),
	`metaDescription` text,
	`status` enum('draft','published','cancelled','completed') NOT NULL DEFAULT 'draft',
	`isFeatured` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`),
	CONSTRAINT `events_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `formFields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fieldName` varchar(100) NOT NULL,
	`fieldLabel` varchar(255) NOT NULL,
	`fieldType` enum('text','email','tel','textarea','select','checkbox') NOT NULL,
	`placeholder` varchar(255),
	`required` int NOT NULL DEFAULT 1,
	`order` int NOT NULL DEFAULT 0,
	`options` text,
	`validation` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `formFields_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `formSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formData` text NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`isRead` int NOT NULL DEFAULT 0,
	CONSTRAINT `formSubmissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`filename` varchar(255) NOT NULL,
	`originalName` varchar(255) NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`fileSize` int NOT NULL,
	`s3Key` varchar(500) NOT NULL,
	`url` varchar(1000) NOT NULL,
	`type` enum('image','video') NOT NULL,
	`uploadedBy` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `navigation` (
	`id` int AUTO_INCREMENT NOT NULL,
	`location` enum('header','footer') NOT NULL,
	`label` varchar(100) NOT NULL,
	`url` varchar(500) NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	`isExternal` int NOT NULL DEFAULT 0,
	`openInNewTab` int NOT NULL DEFAULT 0,
	`parentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `navigation_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`variantId` int,
	`name` varchar(255) NOT NULL,
	`sku` varchar(100),
	`price` int NOT NULL,
	`quantity` int NOT NULL,
	`total` int NOT NULL,
	`imageUrl` varchar(1000),
	`options` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(50) NOT NULL,
	`userId` int,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`status` enum('pending','processing','shipped','delivered','cancelled','refunded') NOT NULL DEFAULT 'pending',
	`paymentStatus` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(50),
	`paymentIntentId` varchar(255),
	`subtotal` int NOT NULL,
	`discountAmount` int DEFAULT 0,
	`discountCode` varchar(100),
	`shippingAmount` int DEFAULT 0,
	`taxAmount` int DEFAULT 0,
	`total` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`shippingFirstName` varchar(100),
	`shippingLastName` varchar(100),
	`shippingAddress1` varchar(255),
	`shippingAddress2` varchar(255),
	`shippingCity` varchar(100),
	`shippingState` varchar(100),
	`shippingPostalCode` varchar(20),
	`shippingCountry` varchar(100),
	`billingFirstName` varchar(100),
	`billingLastName` varchar(100),
	`billingAddress1` varchar(255),
	`billingAddress2` varchar(255),
	`billingCity` varchar(100),
	`billingState` varchar(100),
	`billingPostalCode` varchar(20),
	`billingCountry` varchar(100),
	`trackingNumber` varchar(255),
	`trackingUrl` varchar(500),
	`shippedAt` timestamp,
	`deliveredAt` timestamp,
	`notes` text,
	`customerNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `pageBlocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageId` int NOT NULL,
	`type` enum('text','image','video','quote','cta','spacer') NOT NULL,
	`content` text,
	`order` int NOT NULL DEFAULT 0,
	`settings` text,
	`visibility` text,
	`animation` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pageBlocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`template` varchar(100) DEFAULT 'default',
	`metaTitle` varchar(255),
	`metaDescription` text,
	`ogImage` varchar(1000),
	`published` int NOT NULL DEFAULT 1,
	`showInNav` int NOT NULL DEFAULT 1,
	`navOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `pages_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `productCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`imageUrl` varchar(1000),
	`parentId` int,
	`order` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `productCategories_id` PRIMARY KEY(`id`),
	CONSTRAINT `productCategories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `productVariants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`sku` varchar(100),
	`price` int,
	`stock` int NOT NULL DEFAULT 0,
	`options` text,
	`imageUrl` varchar(1000),
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productVariants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`sku` varchar(100),
	`description` text,
	`shortDescription` text,
	`price` int NOT NULL,
	`compareAtPrice` int,
	`costPrice` int,
	`categoryId` int,
	`images` text,
	`featuredImage` varchar(1000),
	`stock` int NOT NULL DEFAULT 0,
	`lowStockThreshold` int DEFAULT 5,
	`trackInventory` int NOT NULL DEFAULT 1,
	`weight` int,
	`dimensions` text,
	`tags` text,
	`metaTitle` varchar(255),
	`metaDescription` text,
	`status` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
	`isFeatured` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `products_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `redirects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromPath` varchar(500) NOT NULL,
	`toPath` varchar(500) NOT NULL,
	`redirectType` enum('301','302') NOT NULL DEFAULT '301',
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `redirects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sectionBackgrounds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sectionKey` varchar(100) NOT NULL,
	`backgroundType` enum('color','image','video','gradient') NOT NULL DEFAULT 'color',
	`backgroundColor` varchar(50),
	`backgroundImage` varchar(1000),
	`backgroundVideo` varchar(1000),
	`gradientStart` varchar(50),
	`gradientEnd` varchar(50),
	`gradientDirection` varchar(50) DEFAULT 'to bottom',
	`overlayColor` varchar(50),
	`overlayOpacity` int DEFAULT 50,
	`backgroundPosition` varchar(50) DEFAULT 'center center',
	`backgroundSize` varchar(50) DEFAULT 'cover',
	`backgroundAttachment` enum('scroll','fixed') DEFAULT 'scroll',
	`isActive` int NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sectionBackgrounds_id` PRIMARY KEY(`id`),
	CONSTRAINT `sectionBackgrounds_sectionKey_unique` UNIQUE(`sectionKey`)
);
--> statement-breakpoint
CREATE TABLE `seoSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageSlug` varchar(255) NOT NULL,
	`metaTitle` varchar(255),
	`metaDescription` text,
	`metaKeywords` text,
	`ogTitle` varchar(255),
	`ogDescription` text,
	`ogImage` varchar(1000),
	`twitterCard` varchar(50) DEFAULT 'summary_large_image',
	`canonicalUrl` varchar(500),
	`noIndex` int NOT NULL DEFAULT 0,
	`structuredData` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `seoSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `seoSettings_pageSlug_unique` UNIQUE(`pageSlug`)
);
--> statement-breakpoint
CREATE TABLE `shoppingCarts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(255) NOT NULL,
	`userId` int,
	`items` text NOT NULL,
	`subtotal` int NOT NULL DEFAULT 0,
	`discountCode` varchar(100),
	`discountAmount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`expiresAt` timestamp,
	CONSTRAINT `shoppingCarts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteContent` (
	`id` int AUTO_INCREMENT NOT NULL,
	`page` varchar(100) NOT NULL,
	`section` varchar(100) NOT NULL,
	`contentKey` varchar(100) NOT NULL,
	`contentValue` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteContent_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(100) NOT NULL,
	`settingValue` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `siteSettings_settingKey_unique` UNIQUE(`settingKey`)
);
--> statement-breakpoint
CREATE TABLE `themeSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`primaryColor` varchar(50) DEFAULT '#000000',
	`secondaryColor` varchar(50) DEFAULT '#ffffff',
	`accentColor` varchar(50) DEFAULT '#1a1a1a',
	`backgroundColor` varchar(50) DEFAULT '#ffffff',
	`textColor` varchar(50) DEFAULT '#000000',
	`headingFont` varchar(255) DEFAULT 'Playfair Display',
	`bodyFont` varchar(255) DEFAULT 'Inter',
	`headingFontUrl` varchar(500),
	`bodyFontUrl` varchar(500),
	`containerMaxWidth` varchar(50) DEFAULT '1280px',
	`sectionSpacing` varchar(50) DEFAULT '120px',
	`borderRadius` varchar(50) DEFAULT '8px',
	`enableAnimations` int NOT NULL DEFAULT 1,
	`animationSpeed` varchar(50) DEFAULT '0.6s',
	`heroBackgroundImage` varchar(1000),
	`heroBackgroundVideo` varchar(1000),
	`shopBackgroundImage` varchar(1000),
	`eventsBackgroundImage` varchar(1000),
	`footerBackgroundImage` varchar(1000),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `themeSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `visitorProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`visitorId` varchar(255) NOT NULL,
	`firstVisit` timestamp NOT NULL DEFAULT (now()),
	`lastVisit` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`totalConversations` int NOT NULL DEFAULT 0,
	`preferences` text,
	`context` text,
	CONSTRAINT `visitorProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `visitorProfiles_visitorId_unique` UNIQUE(`visitorId`)
);
