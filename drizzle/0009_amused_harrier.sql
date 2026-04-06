CREATE TABLE `sale_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`saleId` int NOT NULL,
	`productId` int,
	`description` varchar(200) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`unitPrice` decimal(15,2) NOT NULL,
	`unitCost` decimal(15,2) NOT NULL DEFAULT '0',
	`totalPrice` decimal(15,2) NOT NULL,
	`totalCost` decimal(15,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sale_items_id` PRIMARY KEY(`id`)
);
