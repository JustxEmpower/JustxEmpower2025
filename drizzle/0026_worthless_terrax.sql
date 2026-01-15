CREATE TABLE `resourceCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(100),
	`order` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `resourceCategories_id` PRIMARY KEY(`id`),
	CONSTRAINT `resourceCategories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `resourceDownloads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resourceId` int NOT NULL,
	`visitorId` varchar(255),
	`email` varchar(320),
	`ipAddress` varchar(45),
	`userAgent` text,
	`downloadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `resourceDownloads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`categoryId` int,
	`fileUrl` varchar(1000) NOT NULL,
	`s3Key` varchar(500) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileType` varchar(100) NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`fileSize` int NOT NULL,
	`thumbnailUrl` varchar(1000),
	`isPublic` int NOT NULL DEFAULT 1,
	`requiresEmail` int NOT NULL DEFAULT 0,
	`downloadCount` int NOT NULL DEFAULT 0,
	`viewCount` int NOT NULL DEFAULT 0,
	`metaTitle` varchar(255),
	`metaDescription` text,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'published',
	`isFeatured` int NOT NULL DEFAULT 0,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resources_id` PRIMARY KEY(`id`),
	CONSTRAINT `resources_slug_unique` UNIQUE(`slug`)
);
