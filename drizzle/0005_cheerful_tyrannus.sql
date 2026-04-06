ALTER TABLE `services` MODIFY COLUMN `amount` decimal(15,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `services` MODIFY COLUMN `serviceType` enum('no_repair','repaired','test','pending');--> statement-breakpoint
ALTER TABLE `services` ADD `serialNumber` varchar(100);