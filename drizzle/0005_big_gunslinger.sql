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
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `themeSettings_id` PRIMARY KEY(`id`)
);
