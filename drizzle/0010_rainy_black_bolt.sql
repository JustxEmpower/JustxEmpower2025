CREATE TABLE `adminSessions` (
	`token` varchar(255) NOT NULL,
	`username` varchar(100) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adminSessions_token` PRIMARY KEY(`token`)
);
