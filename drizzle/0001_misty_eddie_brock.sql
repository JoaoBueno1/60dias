CREATE TABLE `accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` text NOT NULL,
	`type` enum('bank','credit_card','wallet','broker','savings') NOT NULL,
	`currencyCode` varchar(10) NOT NULL,
	`initialBalance` int NOT NULL DEFAULT 0,
	`isHidden` boolean NOT NULL DEFAULT false,
	`color` varchar(20),
	`icon` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` text NOT NULL,
	`type` enum('expense','income','transfer','investment') NOT NULL,
	`color` varchar(20),
	`icon` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `currencies` (
	`code` varchar(10) NOT NULL,
	`name` text NOT NULL,
	`symbol` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `currencies_code` PRIMARY KEY(`code`)
);
--> statement-breakpoint
CREATE TABLE `currency_rates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromCurrency` varchar(10) NOT NULL,
	`toCurrency` varchar(10) NOT NULL,
	`rate` int NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `currency_rates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `investment_positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accountId` int NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`name` text NOT NULL,
	`quantity` int NOT NULL,
	`avgPrice` int NOT NULL,
	`currentPrice` int,
	`currencyCode` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `investment_positions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `investment_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`positionId` int NOT NULL,
	`accountId` int NOT NULL,
	`type` enum('buy','sell') NOT NULL,
	`quantity` int NOT NULL,
	`price` int NOT NULL,
	`total` int NOT NULL,
	`fee` int NOT NULL DEFAULT 0,
	`date` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `investment_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fullName` text,
	`baseCurrency` varchar(10) NOT NULL DEFAULT 'AUD',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accountId` int NOT NULL,
	`categoryId` int,
	`type` enum('expense','income','transfer','investment') NOT NULL,
	`description` text NOT NULL,
	`amount` int NOT NULL,
	`currencyCode` varchar(10) NOT NULL,
	`direction` enum('debit','credit') NOT NULL,
	`date` date NOT NULL,
	`relatedAccountId` int,
	`tags` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_currencyCode_currencies_code_fk` FOREIGN KEY (`currencyCode`) REFERENCES `currencies`(`code`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `categories_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `currency_rates` ADD CONSTRAINT `currency_rates_fromCurrency_currencies_code_fk` FOREIGN KEY (`fromCurrency`) REFERENCES `currencies`(`code`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `currency_rates` ADD CONSTRAINT `currency_rates_toCurrency_currencies_code_fk` FOREIGN KEY (`toCurrency`) REFERENCES `currencies`(`code`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `investment_positions` ADD CONSTRAINT `investment_positions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `investment_positions` ADD CONSTRAINT `investment_positions_accountId_accounts_id_fk` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `investment_positions` ADD CONSTRAINT `investment_positions_currencyCode_currencies_code_fk` FOREIGN KEY (`currencyCode`) REFERENCES `currencies`(`code`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `investment_transactions` ADD CONSTRAINT `investment_transactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `investment_transactions` ADD CONSTRAINT `investment_transactions_positionId_investment_positions_id_fk` FOREIGN KEY (`positionId`) REFERENCES `investment_positions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `investment_transactions` ADD CONSTRAINT `investment_transactions_accountId_accounts_id_fk` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_accountId_accounts_id_fk` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_currencyCode_currencies_code_fk` FOREIGN KEY (`currencyCode`) REFERENCES `currencies`(`code`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_relatedAccountId_accounts_id_fk` FOREIGN KEY (`relatedAccountId`) REFERENCES `accounts`(`id`) ON DELETE no action ON UPDATE no action;