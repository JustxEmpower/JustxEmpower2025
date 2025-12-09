CREATE TABLE `aiChatConversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(255) NOT NULL,
	`visitorId` varchar(255),
	`message` text NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`context` text,
	`sentiment` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiChatConversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aiSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`geminiApiKey` varchar(500),
	`chatEnabled` int NOT NULL DEFAULT 1,
	`chatBubbleColor` varchar(50) DEFAULT '#000000',
	`chatBubblePosition` varchar(50) DEFAULT 'bottom-right',
	`systemPrompt` text,
	`autoResponses` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aiSettings_id` PRIMARY KEY(`id`)
);
