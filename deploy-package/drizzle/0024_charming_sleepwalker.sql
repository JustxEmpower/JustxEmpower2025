ALTER TABLE `backups` MODIFY COLUMN `backupData` text;--> statement-breakpoint
ALTER TABLE `backups` ADD `s3Key` varchar(500);--> statement-breakpoint
ALTER TABLE `backups` ADD `s3Url` varchar(1000);--> statement-breakpoint
ALTER TABLE `backups` ADD `description` text;--> statement-breakpoint
ALTER TABLE `backups` ADD `tablesIncluded` text;--> statement-breakpoint
ALTER TABLE `backups` ADD `createdBy` varchar(100);