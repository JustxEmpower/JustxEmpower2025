ALTER TABLE `adminUsers` ADD `email` varchar(320);--> statement-breakpoint
ALTER TABLE `adminUsers` ADD `role` varchar(50) DEFAULT 'editor' NOT NULL;--> statement-breakpoint
ALTER TABLE `adminUsers` ADD `permissions` text;