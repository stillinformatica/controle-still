ALTER TABLE `service_orders` ADD `entryDate` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `service_orders` ADD `expectedDeliveryDate` date;--> statement-breakpoint
ALTER TABLE `service_orders` ADD `exitDate` timestamp;