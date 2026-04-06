CREATE TABLE `product_kit_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kitId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_kit_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_kits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`totalCost` decimal(15,2) NOT NULL DEFAULT '0',
	`salePrice` decimal(15,2) NOT NULL,
	`profit` decimal(15,2) NOT NULL DEFAULT '0',
	`profitMargin` decimal(5,2) NOT NULL DEFAULT '0',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_kits_id` PRIMARY KEY(`id`)
);
