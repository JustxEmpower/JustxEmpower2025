CREATE TABLE `carouselOfferings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`link` varchar(500),
	`imageUrl` varchar(1000),
	`order` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `carouselOfferings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cartSyncLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(255) NOT NULL,
	`action` enum('merge','push','pull','conflict') NOT NULL,
	`beforeState` text,
	`afterState` text,
	`resolved` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cartSyncLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contentTextStyles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentId` int NOT NULL,
	`isBold` int NOT NULL DEFAULT 0,
	`isItalic` int NOT NULL DEFAULT 0,
	`isUnderline` int NOT NULL DEFAULT 0,
	`fontOverride` varchar(255),
	`fontSize` varchar(50),
	`fontColor` varchar(50),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contentTextStyles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fontSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`headingFont` varchar(255) NOT NULL DEFAULT 'Cormorant Garamond',
	`bodyFont` varchar(255) NOT NULL DEFAULT 'Inter',
	`accentFont` varchar(255) DEFAULT 'Cormorant Garamond',
	`headingWeight` varchar(10) DEFAULT '400',
	`bodyWeight` varchar(10) DEFAULT '400',
	`headingBaseSize` varchar(20) DEFAULT '3rem',
	`bodyBaseSize` varchar(20) DEFAULT '1rem',
	`headingLineHeight` varchar(10) DEFAULT '1.2',
	`bodyLineHeight` varchar(10) DEFAULT '1.6',
	`headingLetterSpacing` varchar(20) DEFAULT '0',
	`bodyLetterSpacing` varchar(20) DEFAULT '0',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fontSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventoryReservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`variantId` int,
	`sessionId` varchar(255) NOT NULL,
	`quantity` int NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventoryReservations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pageSections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageId` int NOT NULL,
	`sectionType` enum('header','hero','content','carousel','grid','form','video','quote','cta','calendar','footer','newsletter','community','testimonials','gallery','map','products','articles','team','faq','pricing','features','stats','social','rooted-unity','pillar-grid','pillars','principles','volumes','options','mission','vision','ethos') NOT NULL,
	`sectionOrder` int NOT NULL DEFAULT 0,
	`title` varchar(255),
	`content` text,
	`requiredFields` text,
	`isVisible` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pageSections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `backups` MODIFY COLUMN `backupData` longtext;--> statement-breakpoint
ALTER TABLE `blockVersions` MODIFY COLUMN `type` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `brandAssets` MODIFY COLUMN `assetType` enum('logo_header','logo_footer','logo_mobile','logo_preloader','favicon','og_image','twitter_image') NOT NULL;--> statement-breakpoint
ALTER TABLE `pageBlocks` MODIFY COLUMN `type` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `displayOrder` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `backups` ADD `verificationStatus` varchar(20);--> statement-breakpoint
ALTER TABLE `backups` ADD `lastVerifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `media` ADD `thumbnailUrl` varchar(1000);--> statement-breakpoint
ALTER TABLE `pages` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `pages` ADD `deletedBy` varchar(100);--> statement-breakpoint
ALTER TABLE `products` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `products` ADD `archivedReason` varchar(255);--> statement-breakpoint
ALTER TABLE `resources` ADD `isPremium` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `resources` ADD `price` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `resources` ADD `allowPreview` int DEFAULT 1 NOT NULL;