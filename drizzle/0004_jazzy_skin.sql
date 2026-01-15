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
ALTER TABLE `brandAssets` MODIFY COLUMN `assetType` enum('logo_header','logo_footer','logo_mobile','logo_preloader','favicon','og_image','twitter_image') NOT NULL;--> statement-breakpoint
ALTER TABLE `media` ADD `thumbnailUrl` varchar(1000);--> statement-breakpoint
ALTER TABLE `resources` ADD `isPremium` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `resources` ADD `price` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `resources` ADD `allowPreview` int DEFAULT 1 NOT NULL;