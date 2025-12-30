CREATE TABLE `blockVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`blockId` int NOT NULL,
	`pageId` int NOT NULL,
	`type` enum('text','image','video','quote','cta','spacer') NOT NULL,
	`content` text,
	`order` int NOT NULL,
	`settings` text,
	`versionNumber` int NOT NULL,
	`createdBy` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blockVersions_id` PRIMARY KEY(`id`)
);
