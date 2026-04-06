CREATE TABLE `service_order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceOrderId` int NOT NULL,
	`itemNumber` int NOT NULL,
	`itemCode` varchar(20) NOT NULL,
	`description` text NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`cost` decimal(15,2) NOT NULL DEFAULT '0',
	`profit` decimal(15,2) NOT NULL DEFAULT '0',
	`serviceType` enum('no_repair','repaired','test') NOT NULL,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `service_order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `service_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`osNumber` varchar(10) NOT NULL,
	`customerName` varchar(200) NOT NULL,
	`status` enum('open','completed') NOT NULL DEFAULT 'open',
	`totalAmount` decimal(15,2) NOT NULL DEFAULT '0',
	`totalCost` decimal(15,2) NOT NULL DEFAULT '0',
	`totalProfit` decimal(15,2) NOT NULL DEFAULT '0',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `service_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `service_orders_osNumber_unique` UNIQUE(`osNumber`)
);
