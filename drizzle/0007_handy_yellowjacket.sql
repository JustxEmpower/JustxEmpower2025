CREATE TABLE `aiFeedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`visitorId` varchar(255),
	`rating` enum('positive','negative') NOT NULL,
	`feedbackText` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiFeedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `visitorProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`visitorId` varchar(255) NOT NULL,
	`firstVisit` timestamp NOT NULL DEFAULT (now()),
	`lastVisit` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`totalConversations` int NOT NULL DEFAULT 0,
	`preferences` text,
	`context` text,
	CONSTRAINT `visitorProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `visitorProfiles_visitorId_unique` UNIQUE(`visitorId`)
);
