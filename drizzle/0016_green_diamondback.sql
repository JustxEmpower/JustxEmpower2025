CREATE TABLE `backups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`backupName` varchar(255) NOT NULL,
	`backupType` varchar(50) NOT NULL,
	`backupData` text NOT NULL,
	`fileSize` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `backups_id` PRIMARY KEY(`id`)
);
