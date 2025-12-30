CREATE TABLE `redirects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromPath` varchar(500) NOT NULL,
	`toPath` varchar(500) NOT NULL,
	`redirectType` enum('301','302') NOT NULL DEFAULT '301',
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `redirects_id` PRIMARY KEY(`id`)
);
