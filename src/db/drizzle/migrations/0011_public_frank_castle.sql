CREATE TABLE `userRefreshTokens` (
	`id` serial AUTO_INCREMENT,
	`memberId` bigint unsigned NOT NULL,
	`refreshToken` varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `members` ADD `role` enum('librarian','member');--> statement-breakpoint
ALTER TABLE `userRefreshTokens` ADD CONSTRAINT `userRefreshTokens_memberId_members_id_fk` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `members` DROP COLUMN `refresh_token`;