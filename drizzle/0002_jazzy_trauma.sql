ALTER TABLE `sales` MODIFY COLUMN `source` enum('shopee','mp_edgar','mp_emerson','direct','debtor','other') NOT NULL;--> statement-breakpoint
ALTER TABLE `sales` ADD `productId` int;--> statement-breakpoint
ALTER TABLE `sales` ADD `customerName` varchar(200);--> statement-breakpoint
ALTER TABLE `services` ADD `customerName` varchar(200);--> statement-breakpoint
ALTER TABLE `services` ADD `osNumber` varchar(50);--> statement-breakpoint
ALTER TABLE `services` ADD `serviceType` enum('no_repair','repaired','test');