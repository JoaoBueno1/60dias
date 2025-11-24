import { integer, sqliteTable, text, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  lastSignedIn: integer("last_signed_in", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

/**
 * User profiles with financial preferences
 */
export const profiles = sqliteTable("profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  fullName: text("full_name"),
  baseCurrency: text("base_currency").default("USD").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;

/**
 * Currency definitions
 */
export const currencies = sqliteTable("currencies", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type Currency = typeof currencies.$inferSelect;
export type InsertCurrency = typeof currencies.$inferInsert;

/**
 * Financial accounts (bank, credit card, wallet, broker)
 */
export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type", { enum: ["bank", "credit_card", "wallet", "broker", "savings"] }).notNull(),
  currencyCode: text("currency_code").notNull().references(() => currencies.code),
  initialBalance: integer("initial_balance").default(0).notNull(),
  isHidden: integer("is_hidden", { mode: "boolean" }).default(false).notNull(),
  color: text("color"),
  icon: text("icon"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

/**
 * Transaction categories
 */
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type", { enum: ["expense", "income", "transfer", "investment"] }).notNull(),
  color: text("color"),
  icon: text("icon"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Companies/Businesses for tracking business expenses
 */
export const companies = sqliteTable("companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

/**
 * Financial transactions
 */
export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  categoryId: integer("category_id").references(() => categories.id),
  type: text("type", { enum: ["expense", "income", "transfer", "investment"] }).notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  currencyCode: text("currency_code").notNull().references(() => currencies.code),
  direction: text("direction", { enum: ["debit", "credit"] }).notNull(),
  date: text("date").notNull(),
  relatedAccountId: integer("related_account_id").references(() => accounts.id),
  companyId: integer("company_id").references(() => companies.id), // Link to company for business expenses
  notes: text("notes"), // Additional comments/notes
  tags: text("tags", { mode: "json" }).$type<string[]>(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Investment positions - tracks current holdings
 */
export const investmentPositions = sqliteTable("investment_positions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  accountId: integer("account_id").references(() => accounts.id),
  type: text("type", { enum: ["stock", "fii", "etf", "crypto", "cdb", "other"] }).notNull(),
  market: text("market", { enum: ["ASX", "B3", "US", "CRYPTO", "OTHER"] }).notNull(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull(), // Store as cents/smallest unit
  avgBuyPrice: integer("avg_buy_price").notNull(), // Store as cents
  currentPrice: integer("current_price"), // Store as cents, updated from API
  currencyCode: text("currency_code").notNull().references(() => currencies.code),
  lastPriceUpdate: integer("last_price_update", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type InvestmentPosition = typeof investmentPositions.$inferSelect;
export type InsertInvestmentPosition = typeof investmentPositions.$inferInsert;

/**
 * Investment transactions (buy/sell/dividend/interest)
 */
export const investmentTransactions = sqliteTable("investment_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  positionId: integer("position_id").notNull().references(() => investmentPositions.id),
  accountId: integer("account_id").references(() => accounts.id),
  type: text("type", { enum: ["buy", "sell", "dividend", "interest"] }).notNull(),
  quantity: integer("quantity").notNull(), // Store as cents for prices
  price: integer("price").notNull(), // Price per unit in cents
  total: integer("total").notNull(), // Total in cents
  fee: integer("fee").default(0).notNull(), // Fee in cents
  currencyCode: text("currency_code").notNull().references(() => currencies.code),
  date: text("date").notNull(), // YYYY-MM-DD format
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

/**
 * Price cache for external API calls
 * Stores the last fetched price for each symbol to avoid excessive API calls
 */
export const priceCache = sqliteTable("price_cache", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  symbol: text("symbol").notNull(),
  market: text("market").notNull(),
  price: integer("price").notNull(), // Price in cents
  currency: text("currency").notNull(),
  lastUpdated: integer("last_updated", { mode: "timestamp" }).notNull(),
});

export type InvestmentTransaction = typeof investmentTransactions.$inferSelect;
export type InsertInvestmentTransaction = typeof investmentTransactions.$inferInsert;

/**
 * Currency exchange rates
 */
export const currencyRates = sqliteTable("currency_rates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fromCurrency: text("from_currency").notNull().references(() => currencies.code),
  toCurrency: text("to_currency").notNull().references(() => currencies.code),
  rate: integer("rate").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type CurrencyRate = typeof currencyRates.$inferSelect;
export type InsertCurrencyRate = typeof currencyRates.$inferInsert;

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  accounts: many(accounts),
  categories: many(categories),
  companies: many(companies),
  transactions: many(transactions),
  investmentPositions: many(investmentPositions),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
  currency: one(currencies, {
    fields: [accounts.currencyCode],
    references: [currencies.code],
  }),
  transactions: many(transactions),
  investmentPositions: many(investmentPositions),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  user: one(users, {
    fields: [companies.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  company: one(companies, {
    fields: [transactions.companyId],
    references: [companies.id],
  }),
  currency: one(currencies, {
    fields: [transactions.currencyCode],
    references: [currencies.code],
  }),
  relatedAccount: one(accounts, {
    fields: [transactions.relatedAccountId],
    references: [accounts.id],
  }),
}));

export const investmentPositionsRelations = relations(investmentPositions, ({ one, many }) => ({
  user: one(users, {
    fields: [investmentPositions.userId],
    references: [users.id],
  }),
  account: one(accounts, {
    fields: [investmentPositions.accountId],
    references: [accounts.id],
  }),
  currency: one(currencies, {
    fields: [investmentPositions.currencyCode],
    references: [currencies.code],
  }),
  investmentTransactions: many(investmentTransactions),
}));

export const investmentTransactionsRelations = relations(investmentTransactions, ({ one }) => ({
  user: one(users, {
    fields: [investmentTransactions.userId],
    references: [users.id],
  }),
  position: one(investmentPositions, {
    fields: [investmentTransactions.positionId],
    references: [investmentPositions.id],
  }),
  account: one(accounts, {
    fields: [investmentTransactions.accountId],
    references: [accounts.id],
  }),
}));
