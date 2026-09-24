CREATE TABLE `project_media` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`kind` text NOT NULL,
	`filename` text DEFAULT '' NOT NULL,
	`content_type` text DEFAULT '' NOT NULL,
	`size` integer DEFAULT 0 NOT NULL,
	`url` text DEFAULT '' NOT NULL,
	`caption` text DEFAULT '' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `project_media_project_idx` ON `project_media` (`project_id`);--> statement-breakpoint
ALTER TABLE `projects` ADD `thumbnail_media_id` text;