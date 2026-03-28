CREATE TABLE `admin_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('order','payment','shipment','refund','dispute','event_registration','low_stock','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text,
	`link` varchar(500),
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`read` int NOT NULL DEFAULT 0,
	`dismissed` int NOT NULL DEFAULT 0,
	`relatedId` int,
	`relatedType` varchar(50),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aiKnowledgeBase` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(100) NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`keywords` text,
	`priority` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`usageCount` int NOT NULL DEFAULT 0,
	`lastUsedAt` timestamp,
	`createdBy` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aiKnowledgeBase_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aiTrainingLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`action` enum('added','updated','deleted','used','feedback') NOT NULL,
	`knowledgeId` int,
	`conversationId` int,
	`details` text,
	`performedBy` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiTrainingLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blockStore` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100) NOT NULL DEFAULT 'custom',
	`icon` varchar(50) DEFAULT 'box',
	`blockType` varchar(100) NOT NULL,
	`content` longtext NOT NULL,
	`thumbnail` varchar(1000),
	`tags` text,
	`isPublic` int NOT NULL DEFAULT 1,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdBy` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blockStore_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `carousel_slides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`carousel_id` int NOT NULL,
	`title` varchar(500),
	`subtitle` varchar(500),
	`description` text,
	`image_url` varchar(1000),
	`video_url` varchar(1000),
	`thumbnail_url` varchar(1000),
	`alt_text` varchar(500),
	`cta_text` varchar(255),
	`cta_link` varchar(1000),
	`cta_style` enum('primary','secondary','ghost','outline') DEFAULT 'primary',
	`author_name` varchar(255),
	`author_role` varchar(255),
	`author_avatar` varchar(1000),
	`rating` int,
	`styling` text,
	`visible` int NOT NULL DEFAULT 1,
	`start_date` timestamp,
	`end_date` timestamp,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `carousel_slides_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `carousels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`type` enum('hero','featured','testimonial','gallery','card','custom') NOT NULL DEFAULT 'featured',
	`settings` text,
	`styling` text,
	`active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `carousels_id` PRIMARY KEY(`id`),
	CONSTRAINT `carousels_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `codex_ai_governance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`configKey` varchar(100) NOT NULL,
	`configValue` longtext NOT NULL,
	`category` varchar(50) NOT NULL,
	`guideId` varchar(50),
	`label` varchar(255) NOT NULL,
	`description` text,
	`isActive` int NOT NULL DEFAULT 1,
	`updatedBy` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `codex_ai_governance_id` PRIMARY KEY(`id`),
	CONSTRAINT `codex_ai_governance_configKey_unique` UNIQUE(`configKey`)
);
--> statement-breakpoint
CREATE TABLE `codex_adaptive_responses` (
	`id` varchar(30) NOT NULL,
	`sessionId` varchar(30) NOT NULL,
	`questionId` varchar(30) NOT NULL,
	`questionIndex` int NOT NULL,
	`answerCode` varchar(10),
	`openText` text,
	`posteriorsSnapshot` text,
	`entropyAtAnswer` varchar(10),
	`phaseAtAnswer` varchar(30),
	`responseTimeMs` int,
	`answeredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_adaptive_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_adaptive_sessions` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`assessmentId` varchar(30) NOT NULL,
	`state` text NOT NULL,
	`config` text,
	`phase` varchar(30) NOT NULL DEFAULT 'broad_signal',
	`questionsAsked` int NOT NULL DEFAULT 0,
	`topArchetype` varchar(100),
	`topConfidence` varchar(10),
	`entropy` varchar(10),
	`terminated` int NOT NULL DEFAULT 0,
	`terminationReason` varchar(60),
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `codex_adaptive_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_admin_notes` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_admin_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_answers` (
	`id` varchar(30) NOT NULL,
	`questionId` varchar(30) NOT NULL,
	`code` varchar(10) NOT NULL,
	`text` text NOT NULL,
	`spectrumDepth` varchar(30) NOT NULL,
	`arPrimary` varchar(50) NOT NULL,
	`arSecondary` varchar(50) NOT NULL,
	`wi` varchar(50) NOT NULL,
	`mp` varchar(50) NOT NULL,
	`mmi` varchar(50),
	`abi` varchar(50),
	`epcl` varchar(50),
	`wombField` varchar(50),
	CONSTRAINT `codex_answers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_assessments` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`status` varchar(30) NOT NULL DEFAULT 'not_started',
	`currentSection` int NOT NULL DEFAULT 1,
	`currentQuestion` int NOT NULL DEFAULT 1,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `codex_assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_bridge_entries` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`bookId` varchar(10) NOT NULL,
	`journalSection` varchar(60) NOT NULL,
	`codexSection` int,
	`entryText` text NOT NULL,
	`aiReflection` text,
	`themes` text,
	`maternalPattern` varchar(60),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `codex_bridge_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_check_in_patterns` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`pattern` varchar(300) NOT NULL,
	`frequency` int NOT NULL DEFAULT 1,
	`trend` varchar(20) NOT NULL DEFAULT 'stable',
	`relatedArchetype` varchar(100),
	`firstDetectedAt` timestamp NOT NULL DEFAULT (now()),
	`lastDetectedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_check_in_patterns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_check_ins` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`type` varchar(20) NOT NULL,
	`questionsData` text NOT NULL,
	`responsesData` text,
	`patternsExtracted` text,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_check_ins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_companion_state` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`mood` varchar(30) NOT NULL DEFAULT 'calm',
	`energy` int NOT NULL DEFAULT 50,
	`lastInteractionAt` timestamp,
	`daysWithoutInteraction` int NOT NULL DEFAULT 0,
	`totalInteractions` int NOT NULL DEFAULT 0,
	`gardenLevel` int NOT NULL DEFAULT 1,
	`gardenElements` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `codex_companion_state_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_custom_backgrounds` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`name` varchar(100) NOT NULL,
	`imageUrl` text NOT NULL,
	`width` int NOT NULL,
	`height` int NOT NULL,
	`fileSizeKb` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_custom_backgrounds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_dialogue_exchanges` (
	`id` varchar(30) NOT NULL,
	`sessionId` varchar(30) NOT NULL,
	`exchangeIndex` int NOT NULL,
	`guidePrompt` text NOT NULL,
	`userResponse` text,
	`guideReflection` text,
	`depthScore` varchar(10),
	`patternDetected` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_dialogue_exchanges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_dialogue_sessions` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`type` varchar(40) NOT NULL,
	`guideId` varchar(30),
	`exchangeCount` int NOT NULL DEFAULT 0,
	`maxDepthReached` varchar(10) NOT NULL DEFAULT '0',
	`challengeId` varchar(30),
	`status` varchar(20) NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `codex_dialogue_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_escalation_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(30),
	`sessionId` varchar(255),
	`triggerType` varchar(50) NOT NULL,
	`severity` varchar(20) NOT NULL,
	`detectedPatterns` text,
	`userMessageExcerpt` text,
	`aiResponseGiven` text,
	`action` varchar(50) NOT NULL,
	`resourcesOffered` text,
	`resolved` int NOT NULL DEFAULT 0,
	`resolvedBy` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_escalation_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_escalation_resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`contact` varchar(255) NOT NULL,
	`url` varchar(500),
	`availability` varchar(100) DEFAULT '24/7',
	`category` varchar(100) NOT NULL,
	`triggerTypes` text,
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `codex_escalation_resources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_escalation_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`severity` varchar(20) NOT NULL,
	`templateText` longtext NOT NULL,
	`label` varchar(255),
	`isActive` int NOT NULL DEFAULT 1,
	`updatedBy` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `codex_escalation_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_events` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`eventType` varchar(60) NOT NULL,
	`eventData` text,
	`reactionsTriggered` text,
	`errors` text,
	`emittedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_guide_conversations` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`guideId` varchar(50) NOT NULL,
	`title` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_guide_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_guide_key_moments` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`guideId` varchar(30) NOT NULL,
	`content` text NOT NULL,
	`context` text NOT NULL,
	`emotionalIntensity` varchar(20) NOT NULL DEFAULT 'moderate',
	`referenced` int NOT NULL DEFAULT 0,
	`lastReferencedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_guide_key_moments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_guide_memory` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`guideId` varchar(30) NOT NULL,
	`intimacyLevel` int NOT NULL DEFAULT 0,
	`totalSessions` int NOT NULL DEFAULT 0,
	`totalExchanges` int NOT NULL DEFAULT 0,
	`recurringThemes` text,
	`userLanguage` text,
	`lastInteractionAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `codex_guide_memory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_guide_messages` (
	`id` varchar(30) NOT NULL,
	`conversationId` varchar(30) NOT NULL,
	`role` varchar(20) NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_guide_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_journal_entries` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`mood` varchar(50),
	`themes` text,
	`aiPrompt` text,
	`aiSummary` text,
	`phase` varchar(50),
	`archetypeContext` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_journal_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_journal_ownership` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`bookId` varchar(10) NOT NULL,
	`verificationType` varchar(30) NOT NULL,
	`isbn` varchar(30),
	`stripeSessionId` varchar(255),
	`verified` int NOT NULL DEFAULT 1,
	`verifiedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_journal_ownership_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_maternal_resonance` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`bookId` varchar(10) NOT NULL,
	`resonanceType` varchar(30) NOT NULL,
	`sourceJournalRef` varchar(60),
	`sourceCodexRef` varchar(60),
	`pattern` text NOT NULL,
	`strength` int NOT NULL DEFAULT 50,
	`aiInsight` text,
	`acknowledged` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_maternal_resonance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_micro_revelations` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`sessionId` varchar(30) NOT NULL,
	`content` text NOT NULL,
	`type` varchar(40) NOT NULL,
	`archetypeRelevance` text,
	`viewed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_micro_revelations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_milestones` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`milestoneType` varchar(60) NOT NULL,
	`displayName` varchar(255) NOT NULL,
	`narrative` text,
	`value` text,
	`celebrated` int NOT NULL DEFAULT 0,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_milestones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_mirror_addendums` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`reportId` varchar(30),
	`type` varchar(40) NOT NULL,
	`content` text NOT NULL,
	`patternShiftData` text,
	`viewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_mirror_addendums_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_mirror_reports` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`assessmentId` varchar(30),
	`scoringId` varchar(30),
	`status` varchar(30) NOT NULL DEFAULT 'generating',
	`contentJson` longtext NOT NULL,
	`aprilNote` text,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	`releasedAt` timestamp,
	CONSTRAINT `codex_mirror_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_mirror_snapshots` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`sourceType` varchar(30) NOT NULL,
	`sourceId` varchar(30) NOT NULL,
	`dominantThemes` text,
	`emotionalTone` text,
	`avoidancePatterns` text,
	`growthIndicators` text,
	`userLanguage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_mirror_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_pattern_shifts` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`pattern` text NOT NULL,
	`direction` varchar(20) NOT NULL,
	`evidenceBefore` text NOT NULL,
	`evidenceAfter` text NOT NULL,
	`narrative` text NOT NULL,
	`confidenceScore` varchar(10) NOT NULL DEFAULT '0.5',
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_pattern_shifts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_prediction_outcomes` (
	`id` varchar(30) NOT NULL,
	`predictionId` varchar(30) NOT NULL,
	`predictedEvent` varchar(100) NOT NULL,
	`actualOutcome` varchar(100),
	`accuracy` varchar(10),
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_prediction_outcomes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_predictions` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`predictionData` text,
	`selfSabotageScore` varchar(10) NOT NULL DEFAULT '0',
	`phaseReadinessScore` varchar(10) NOT NULL DEFAULT '0',
	`retentionRiskScore` varchar(10) NOT NULL DEFAULT '0',
	`interventionRecommended` varchar(50),
	`validUntil` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_predictions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_question_signals` (
	`id` varchar(30) NOT NULL,
	`questionId` varchar(30) NOT NULL,
	`sectionNum` int NOT NULL,
	`archetypeWeights` text NOT NULL,
	`woundWeights` text NOT NULL,
	`informationGain` varchar(10),
	`discriminativePower` varchar(10),
	`timesAsked` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `codex_question_signals_id` PRIMARY KEY(`id`),
	CONSTRAINT `codex_question_signals_questionId_unique` UNIQUE(`questionId`)
);
--> statement-breakpoint
CREATE TABLE `codex_questions` (
	`id` varchar(30) NOT NULL,
	`sectionNum` int NOT NULL,
	`questionNum` int NOT NULL,
	`questionText` text NOT NULL,
	`invitation` text,
	`isGhost` int NOT NULL DEFAULT 0,
	`isOpenEnded` int NOT NULL DEFAULT 0,
	CONSTRAINT `codex_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_real_world_challenges` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`sessionId` varchar(30),
	`challengeText` text NOT NULL,
	`difficulty` varchar(20) NOT NULL,
	`timeframe` varchar(255) NOT NULL,
	`archetypeTarget` varchar(100) NOT NULL,
	`intentDescription` text,
	`reportBackText` text,
	`guideResponse` text,
	`reportDepth` varchar(10),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_real_world_challenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_responses` (
	`id` varchar(30) NOT NULL,
	`assessmentId` varchar(30) NOT NULL,
	`sectionNum` int NOT NULL,
	`questionId` varchar(30) NOT NULL,
	`answerCode` varchar(10),
	`openText` text,
	`isGhost` int NOT NULL DEFAULT 0,
	`answeredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_scorings` (
	`id` varchar(30) NOT NULL,
	`assessmentId` varchar(30) NOT NULL,
	`resultJson` longtext NOT NULL,
	`scoredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_scorings_id` PRIMARY KEY(`id`),
	CONSTRAINT `codex_scorings_assessmentId_unique` UNIQUE(`assessmentId`)
);
--> statement-breakpoint
CREATE TABLE `codex_scroll_entries` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`moduleNum` int NOT NULL,
	`promptId` varchar(30) NOT NULL,
	`responseText` text,
	`ledgerJson` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_scroll_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_scroll_interactions` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`layerId` varchar(30) NOT NULL,
	`sectionId` varchar(60),
	`interactionType` varchar(30) NOT NULL,
	`responseText` text,
	`reflectionDepth` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_scroll_interactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_scroll_layers` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`layer` int NOT NULL,
	`sealed` int NOT NULL DEFAULT 1,
	`unlockProgress` text,
	`unlockedAt` timestamp,
	`contentData` longtext,
	`viewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `codex_scroll_layers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_sections` (
	`id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`subtitle` varchar(500),
	`glyph` varchar(10),
	`entryText` text,
	`isSpecial` int NOT NULL DEFAULT 0,
	`weight` varchar(20) NOT NULL DEFAULT '1',
	CONSTRAINT `codex_sections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_share_snippets` (
	`id` varchar(30) NOT NULL,
	`publicId` varchar(12) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`journalEntryId` varchar(30) NOT NULL,
	`snippet` text NOT NULL,
	`hashtags` text,
	`imageUrl` text,
	`phase` varchar(50),
	`archetype` varchar(100),
	`mood` varchar(50),
	`viewCount` int NOT NULL DEFAULT 0,
	`shareCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_share_snippets_id` PRIMARY KEY(`id`),
	CONSTRAINT `codex_share_snippets_publicId_unique` UNIQUE(`publicId`)
);
--> statement-breakpoint
CREATE TABLE `codex_user_settings` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`weatherZip` varchar(100),
	`weatherLat` varchar(20),
	`weatherLon` varchar(20),
	`guideStyle` varchar(50) DEFAULT 'poetic',
	`guideFrequency` varchar(50) DEFAULT 'daily',
	`preferredGuideId` varchar(30),
	`preferredVoiceId` varchar(50),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codex_user_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_user_streaks` (
	`id` varchar(30) NOT NULL,
	`userId` varchar(30) NOT NULL,
	`currentStreak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`lastActivityDate` varchar(10),
	`lastActivityType` varchar(50),
	`gracePeriodUsed` int NOT NULL DEFAULT 0,
	`totalActiveDays` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `codex_user_streaks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codex_users` (
	`id` varchar(30) NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(255),
	`passwordHash` varchar(255) NOT NULL,
	`role` varchar(20) NOT NULL DEFAULT 'client',
	`tier` varchar(30),
	`purchaseDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `codex_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `codex_users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `customerAddresses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`label` varchar(50),
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`address1` varchar(255) NOT NULL,
	`address2` varchar(255),
	`city` varchar(100) NOT NULL,
	`state` varchar(100) NOT NULL,
	`postalCode` varchar(20) NOT NULL,
	`country` varchar(100) NOT NULL DEFAULT 'US',
	`phone` varchar(50),
	`isDefaultShipping` int NOT NULL DEFAULT 0,
	`isDefaultBilling` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customerAddresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customerSessions` (
	`token` varchar(255) NOT NULL,
	`customerId` int NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customerSessions_token` PRIMARY KEY(`token`)
);
--> statement-breakpoint
CREATE TABLE `customerWishlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`productId` int NOT NULL,
	`variantId` int,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customerWishlist_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`phone` varchar(50),
	`avatarUrl` varchar(500),
	`tier` enum('customer','vip','wholesale') NOT NULL DEFAULT 'customer',
	`stripeCustomerId` varchar(255),
	`preferences` text,
	`emailVerified` int NOT NULL DEFAULT 0,
	`emailVerifyToken` varchar(255),
	`resetToken` varchar(255),
	`resetTokenExpiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastLoginAt` timestamp,
	`codexTier` varchar(30),
	`codexPurchaseDate` timestamp,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `pageContentSchema` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageSlug` varchar(100) NOT NULL,
	`displayName` varchar(255) NOT NULL,
	`template` varchar(50) DEFAULT 'default',
	`sectionKey` varchar(100) NOT NULL,
	`sectionDisplayName` varchar(255) NOT NULL,
	`sectionType` varchar(50) NOT NULL,
	`sectionOrder` int DEFAULT 0,
	`fieldKey` varchar(100) NOT NULL,
	`fieldLabel` varchar(255) NOT NULL,
	`fieldType` varchar(50) NOT NULL,
	`fieldOrder` int DEFAULT 0,
	`isRequired` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pageContentSchema_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pageZones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageSlug` varchar(100) NOT NULL,
	`zoneName` varchar(100) NOT NULL,
	`blocks` longtext,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pageZones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `status` enum('pending','processing','shipped','delivered','cancelled','refunded','on_hold') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `paymentStatus` enum('pending','paid','failed','refunded','partially_refunded','disputed') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `media` ADD `altText` varchar(500);--> statement-breakpoint
ALTER TABLE `navigation` ADD `isActive` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `carrier` varchar(50);--> statement-breakpoint
ALTER TABLE `products` ADD `sortOrder` int DEFAULT 0 NOT NULL;