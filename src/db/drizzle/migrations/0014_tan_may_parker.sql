ALTER TABLE `userRefreshTokens` ADD `createdAt` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `userRefreshTokens` ADD `expiryDate` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `userRefreshTokens` ADD `revoked` boolean;