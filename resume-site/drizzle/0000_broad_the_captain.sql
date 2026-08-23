CREATE TABLE `portfolios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `positions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`portfolio_id` integer NOT NULL,
	`isin` text NOT NULL,
	`units` real NOT NULL,
	`purchase_price` real NOT NULL,
	`current_price` real NOT NULL,
	`purchase_date` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
