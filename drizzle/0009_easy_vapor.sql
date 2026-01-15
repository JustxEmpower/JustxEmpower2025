CREATE TABLE `pageBlocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageId` int NOT NULL,
	`type` enum('text','image','video','quote','cta','spacer') NOT NULL,
	`content` text,
	`order` int NOT NULL DEFAULT 0,
	`settings` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pageBlocks_id` PRIMARY KEY(`id`)
);
