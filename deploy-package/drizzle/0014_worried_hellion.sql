CREATE TABLE `formFields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fieldName` varchar(100) NOT NULL,
	`fieldLabel` varchar(255) NOT NULL,
	`fieldType` enum('text','email','tel','textarea','select','checkbox') NOT NULL,
	`placeholder` varchar(255),
	`required` int NOT NULL DEFAULT 1,
	`order` int NOT NULL DEFAULT 0,
	`options` text,
	`validation` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `formFields_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `formSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formData` text NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`isRead` int NOT NULL DEFAULT 0,
	CONSTRAINT `formSubmissions_id` PRIMARY KEY(`id`)
);
