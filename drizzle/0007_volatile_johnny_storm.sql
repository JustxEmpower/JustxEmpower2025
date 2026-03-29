CREATE TABLE `codex_ceremonies` (
	`id` varchar(30) NOT NULL,
	`circleId` varchar(30) NOT NULL,
	`hostId` varchar(30),
	`ceremonyType` varchar(40) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`promptSequenceJson` longtext,
	`status` varchar(20) NOT NULL DEFAULT 'scheduled',
	`scheduledAt` timestamp,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`maxParticipants` int NOT NULL DEFAULT 12,
	`participantIds` text,
	`synthesisJson` longtext,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_ceremonies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_circle_members` (
	`id` varchar(30) NOT NULL,
	`circleId` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`role` varchar(20) NOT NULL DEFAULT 'member',
	`status` varchar(20) NOT NULL DEFAULT 'active',
	`trustScore` int NOT NULL DEFAULT 50,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`exitedAt` timestamp,
	`exitReason` varchar(100),
	`lastActiveAt` timestamp,
	`notificationPref` varchar(20) NOT NULL DEFAULT 'digest',
	CONSTRAINT `codex_circle_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_circles` (
	`id` varchar(30) NOT NULL,
	`circleType` varchar(30) NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`archetypeFilter` varchar(100),
	`phaseFilter` int,
	`woundFilter` varchar(100),
	`maxMembers` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`visibility` varchar(20) NOT NULL DEFAULT 'public',
	`facilitatorType` varchar(20) NOT NULL DEFAULT 'ai',
	`aiPromptConfig` text,
	`metadata` text,
	`createdBy` varchar(30),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `codex_circles_id` PRIMARY KEY(`id`),
	CONSTRAINT `codex_circles_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `codex_collective_mirrors` (
	`id` varchar(30) NOT NULL,
	`circleId` varchar(30) NOT NULL,
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`reportJson` longtext,
	`memberCount` int NOT NULL,
	`activeCount` int NOT NULL,
	`dominantThemes` text,
	`spectrumShift` text,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_collective_mirrors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_community_messages` (
	`id` varchar(30) NOT NULL,
	`threadId` varchar(30) NOT NULL,
	`authorId` varchar(30) NOT NULL,
	`parentMessageId` varchar(30),
	`content` text NOT NULL,
	`contentType` varchar(30) NOT NULL DEFAULT 'text',
	`isAnonymous` int NOT NULL DEFAULT 0,
	`isAI` int NOT NULL DEFAULT 0,
	`moderationStatus` varchar(20) NOT NULL DEFAULT 'approved',
	`moderationNote` text,
	`reactionSummary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `codex_community_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_community_threads` (
	`id` varchar(30) NOT NULL,
	`circleId` varchar(30) NOT NULL,
	`authorId` varchar(30) NOT NULL,
	`threadType` varchar(30) NOT NULL DEFAULT 'discussion',
	`title` varchar(500) NOT NULL,
	`isPinned` int NOT NULL DEFAULT 0,
	`isLocked` int NOT NULL DEFAULT 0,
	`isAnonymous` int NOT NULL DEFAULT 0,
	`replyCount` int NOT NULL DEFAULT 0,
	`aiGenerated` int NOT NULL DEFAULT 0,
	`status` varchar(20) NOT NULL DEFAULT 'active',
	`lastActivityAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `codex_community_threads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_genome_vectors` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`archetypeVector` text,
	`woundVector` text,
	`spectrumVector` text,
	`mirrorVector` text,
	`phaseVector` text,
	`compositeVector` text,
	`scoringId` varchar(30),
	`computedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `codex_genome_vectors_id` PRIMARY KEY(`id`),
	CONSTRAINT `codex_genome_vectors_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `codex_moderation_log` (
	`id` varchar(30) NOT NULL,
	`messageId` varchar(30),
	`userId` varchar(30) NOT NULL,
	`moderatorType` varchar(20) NOT NULL,
	`moderatorId` varchar(30),
	`action` varchar(20) NOT NULL,
	`reason` text,
	`aiConfidence` varchar(10),
	`previousStatus` varchar(20),
	`newStatus` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_moderation_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_offering_holders` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'applied',
	`applicationJson` text,
	`aiReadinessScore` int,
	`approvedBy` varchar(30),
	`specializations` text,
	`maxSeekers` int NOT NULL DEFAULT 3,
	`currentSeekerCount` int NOT NULL DEFAULT 0,
	`appliedAt` timestamp NOT NULL DEFAULT (now()),
	`approvedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `codex_offering_holders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_offering_matches` (
	`id` varchar(30) NOT NULL,
	`holderId` varchar(30) NOT NULL,
	`seekerUserId` varchar(30) NOT NULL,
	`circleId` varchar(30),
	`matchScore` int,
	`matchReason` text,
	`status` varchar(20) NOT NULL DEFAULT 'proposed',
	`startedAt` timestamp,
	`completedAt` timestamp,
	`feedbackJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_offering_matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_reactions` (
	`id` varchar(30) NOT NULL,
	`messageId` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`reactionType` varchar(20) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_reactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_resonance_matches` (
	`id` varchar(30) NOT NULL,
	`userIdA` varchar(30) NOT NULL,
	`userIdB` varchar(30) NOT NULL,
	`matchMode` varchar(20) NOT NULL,
	`overallScore` int NOT NULL,
	`subscoreJson` text,
	`sharedArchetypes` text,
	`sharedWounds` text,
	`sharedMirrors` text,
	`computedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `codex_resonance_matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_trust_events` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`circleId` varchar(30),
	`eventType` varchar(40) NOT NULL,
	`delta` int NOT NULL,
	`reason` varchar(255),
	`issuedBy` varchar(20) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_trust_events_id` PRIMARY KEY(`id`)
);
