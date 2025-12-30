ALTER TABLE `articles` ADD `status` varchar(20) DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `publishDate` timestamp;