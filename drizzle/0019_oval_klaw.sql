CREATE TABLE `emailSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`emailProvider` varchar(50),
	`apiKey` varchar(500),
	`fromEmail` varchar(320),
	`fromName` varchar(255),
	`smtpHost` varchar(255),
	`smtpPort` int,
	`smtpUsername` varchar(255),
	`smtpPassword` varchar(255),
	`weeklyReportEnabled` int NOT NULL DEFAULT 0,
	`reportRecipients` text,
	`reportDay` int DEFAULT 1,
	`reportTime` varchar(5) DEFAULT '09:00',
	`lastSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailSettings_id` PRIMARY KEY(`id`)
);
