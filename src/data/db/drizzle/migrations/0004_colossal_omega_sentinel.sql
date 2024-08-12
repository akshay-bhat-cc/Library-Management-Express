ALTER TABLE `transactions` RENAME COLUMN `status` TO `Status`;--> statement-breakpoint
ALTER TABLE `transactions` MODIFY COLUMN `Status` enum('Issued','Returned');