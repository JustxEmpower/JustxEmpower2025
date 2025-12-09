CREATE TABLE `analyticsEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`visitorId` varchar(255),
	`sessionId` varchar(255) NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`eventData` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analyticsEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analyticsPageViews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`visitorId` varchar(255),
	`sessionId` varchar(255) NOT NULL,
	`page` varchar(500) NOT NULL,
	`referrer` varchar(500),
	`userAgent` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analyticsPageViews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analyticsSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(255) NOT NULL,
	`visitorId` varchar(255),
	`startTime` timestamp NOT NULL DEFAULT (now()),
	`endTime` timestamp,
	`pageCount` int NOT NULL DEFAULT 0,
	`duration` int NOT NULL DEFAULT 0,
	CONSTRAINT `analyticsSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `analyticsSessions_sessionId_unique` UNIQUE(`sessionId`)
);
