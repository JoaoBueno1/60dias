import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { users, profiles, currencies, accounts, categories, companies, transactions, investmentPositions } from "../drizzle/schema";
import { ENV } from './_core/env';
import fs from 'fs';
import path from 'path';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db) {
    try {
      const dbPath = process.env.DATABASE_URL || './data/database.db';
      const dbDir = path.dirname(dbPath);
      
      // Ensure data directory exists
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      
      const sqlite = new Database(dbPath);
      sqlite.pragma('journal_mode = WAL');
      _db = drizzle(sqlite);
      console.log(`[Database] Connected to SQLite at ${dbPath}`);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export type InsertUser = {
  email: string;
  passwordHash: string;
  name?: string | null;
  role?: "user" | "admin";
  lastSignedIn?: Date;
};

export async function createUser(user: InsertUser) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(users).values({
    email: user.email,
    passwordHash: user.passwordHash,
    name: user.name || null,
    role: user.role || "user",
    lastSignedIn: user.lastSignedIn || new Date(),
  }).returning();

  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserLastSignIn(userId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, userId));
}

// Simplified mock data for prototype
export async function seedMockData(userId: number) {
  const db = await getDb();
  if (!db) {
    console.log("[Seed] Database not available");
    return;
  }

  try {
    console.log(`[Seed] Starting seed for user ${userId}`);
    
    // Check if already seeded
    const existingAccounts = await db.select().from(accounts).where(eq(accounts.userId, userId)).limit(1);
    if (existingAccounts.length > 0) {
      console.log("[Seed] User already has data, skipping");
      return;
    }

    // Insert currencies first
    console.log("[Seed] Inserting currencies...");
    await db.insert(currencies).values([
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
    ]).onConflictDoNothing();

    // Create simple accounts
    console.log("[Seed] Creating accounts...");
    await db.insert(accounts).values([
      { 
        userId, 
        name: 'Main Checking', 
        type: 'bank', 
        currencyCode: 'USD', 
        initialBalance: 500000,
        color: '#4CAF50',
        icon: 'building-columns'
      },
      { 
        userId, 
        name: 'Savings Account', 
        type: 'savings', 
        currencyCode: 'USD', 
        initialBalance: 1000000,
        color: '#FFD700',
        icon: 'piggy-bank'
      },
    ]);

    // Create categories
    console.log("[Seed] Creating categories...");
    await db.insert(categories).values([
      { userId, name: 'Salary', type: 'income', color: '#10B981', icon: 'dollar-sign' },
      { userId, name: 'Groceries', type: 'expense', color: '#EF4444', icon: 'shopping-cart' },
      { userId, name: 'Rent', type: 'expense', color: '#F59E0B', icon: 'home' },
    ]);

    // Get the created accounts and categories
    const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, userId));
    const userCategories = await db.select().from(categories).where(eq(categories.userId, userId));

    const checkingAccount = userAccounts.find(a => a.type === 'bank');
    const salaryCategory = userCategories.find(c => c.name === 'Salary');
    const groceriesCategory = userCategories.find(c => c.name === 'Groceries');

    // Create some transactions
    if (checkingAccount && salaryCategory && groceriesCategory) {
      console.log("[Seed] Creating transactions...");
      const today = new Date();
      
      await db.insert(transactions).values([
        {
          userId,
          accountId: checkingAccount.id,
          categoryId: salaryCategory.id,
          type: 'income' as const,
          description: 'Monthly Salary',
          amount: 500000,
          currencyCode: 'USD',
          direction: 'credit' as const,
          date: new Date(today.getFullYear(), today.getMonth(), 1),
        },
        {
          userId,
          accountId: checkingAccount.id,
          categoryId: groceriesCategory.id,
          type: 'expense' as const,
          description: 'Supermarket',
          amount: 15000,
          currencyCode: 'USD',
          direction: 'debit' as const,
          date: new Date(today.getFullYear(), today.getMonth(), 5),
        },
        {
          userId,
          accountId: checkingAccount.id,
          categoryId: groceriesCategory.id,
          type: 'expense' as const,
          description: 'Grocery Store',
          amount: 12000,
          currencyCode: 'USD',
          direction: 'debit' as const,
          date: new Date(today.getFullYear(), today.getMonth(), 12),
        },
      ]);
    }

    console.log("[Seed] Seed completed successfully!");
  } catch (error) {
    console.error("[Seed] Error seeding data:", error);
    throw error;
  }
}

// Dashboard statistics
export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    console.log(`[Dashboard] Getting stats for user ${userId}`);
    const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, userId));
    const userTransactions = await db.select().from(transactions).where(eq(transactions.userId, userId));

    console.log(`[Dashboard] Found ${userAccounts.length} accounts and ${userTransactions.length} transactions`);

    let totalNetWorth = 0;
    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    // Calculate net worth from accounts
    for (const account of userAccounts) {
      totalNetWorth += account.initialBalance;
    }

    // Calculate ALL income/expenses (not just this month for demo purposes)
    for (const tx of userTransactions) {
      console.log(`[Dashboard] Processing tx: ${tx.type} - $${tx.amount}`);
      if (tx.type === 'income') {
        monthlyIncome += tx.amount;
      } else if (tx.type === 'expense') {
        monthlyExpenses += tx.amount;
      }
    }

    const totalSavings = monthlyIncome - monthlyExpenses;

    console.log(`[Dashboard] Stats: Net Worth=$${totalNetWorth}, Income=$${monthlyIncome}, Expenses=$${monthlyExpenses}`);

    return {
      totalNetWorth,
      monthlyIncome,
      monthlyExpenses,
      totalSavings,
    };
  } catch (error) {
    console.error("[Dashboard] Error getting stats:", error);
    return null;
  }
}

export async function getRecentTransactions(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date))
      .limit(limit);
    
    return result;
  } catch (error) {
    console.error("[Transactions] Error getting transactions:", error);
    return [];
  }
}

export async function getMonthlyExpensesByCategory(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayStr = firstDayOfMonth.toISOString().split('T')[0];

    const result = await db
      .select({
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        total: sql<number>`SUM(${transactions.amount})`,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          sql`${transactions.date} >= ${firstDayStr}`
        )
      )
      .groupBy(transactions.categoryId, categories.name);

    return result;
  } catch (error) {
    console.error("[Expenses] Error getting expenses by category:", error);
    return [];
  }
}

export async function getAccounts(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(accounts).where(eq(accounts.userId, userId));
  } catch (error) {
    console.error("[Accounts] Error getting accounts:", error);
    return [];
  }
}

export async function getCategories(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(categories).where(eq(categories.userId, userId));
  } catch (error) {
    console.error("[Categories] Error getting categories:", error);
    return [];
  }
}

// ========================================
// COMPANIES MANAGEMENT
// ========================================

export async function getCompanies(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(companies).where(eq(companies.userId, userId));
  } catch (error) {
    console.error("[Companies] Error getting companies:", error);
    return [];
  }
}

export async function createCompany(userId: number, data: { name: string; description?: string; color?: string }) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    // Check if company with same name already exists
    const existing = await db
      .select()
      .from(companies)
      .where(and(eq(companies.userId, userId), eq(companies.name, data.name)))
      .limit(1);
    
    if (existing.length > 0) {
      throw new Error(`Company "${data.name}" already exists`);
    }

    const result = await db.insert(companies).values({
      userId,
      name: data.name,
      description: data.description,
      color: data.color,
    }).returning();
    
    return result[0];
  } catch (error) {
    console.error("[Companies] Error creating company:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to create company: ${error.message}`);
    }
    throw new Error('Failed to create company');
  }
}

export async function updateCompany(id: number, userId: number, data: { name?: string; description?: string; color?: string }) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    // Check if company exists and belongs to user
    const existing = await db
      .select()
      .from(companies)
      .where(and(eq(companies.id, id), eq(companies.userId, userId)))
      .limit(1);
    
    if (existing.length === 0) {
      throw new Error('Company not found or access denied');
    }

    // Check if new name conflicts with another company
    if (data.name) {
      const nameConflict = await db
        .select()
        .from(companies)
        .where(
          and(
            eq(companies.userId, userId),
            eq(companies.name, data.name),
            sql`${companies.id} != ${id}`
          )
        )
        .limit(1);
      
      if (nameConflict.length > 0) {
        throw new Error(`Company name "${data.name}" already exists`);
      }
    }

    await db.update(companies)
      .set(data)
      .where(and(eq(companies.id, id), eq(companies.userId, userId)));
  } catch (error) {
    console.error("[Companies] Error updating company:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to update company: ${error.message}`);
    }
    throw new Error('Failed to update company');
  }
}

export async function deleteCompany(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    // Check if company exists and belongs to user
    const existing = await db
      .select()
      .from(companies)
      .where(and(eq(companies.id, id), eq(companies.userId, userId)))
      .limit(1);
    
    if (existing.length === 0) {
      throw new Error('Company not found or access denied');
    }

    // Check if company is used in transactions
    const usedInTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.companyId, id))
      .limit(1);
    
    if (usedInTransactions.length > 0) {
      throw new Error('Cannot delete company that has transactions. Please remove or reassign transactions first.');
    }

    await db.delete(companies).where(and(eq(companies.id, id), eq(companies.userId, userId)));
  } catch (error) {
    console.error("[Companies] Error deleting company:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to delete company: ${error.message}`);
    }
    throw new Error('Failed to delete company');
  }
}

// Helper function to get company by ID
export async function getCompanyById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(companies)
      .where(and(eq(companies.id, id), eq(companies.userId, userId)))
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Companies] Error getting company:", error);
    return null;
  }
}

// ========================================
// DASHBOARD BY CURRENCY
// ========================================

export async function getDashboardByCurrency(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    // Get all accounts grouped by currency
    const accountsByCurrency = await db
      .select({
        currency: accounts.currencyCode,
        totalBalance: sql<number>`SUM(${accounts.initialBalance})`,
      })
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .groupBy(accounts.currencyCode);

    // Get all transactions grouped by currency
    const transactionsByCurrency = await db
      .select({
        currency: transactions.currencyCode,
        totalIncome: sql<number>`SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END)`,
        totalExpenses: sql<number>`SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END)`,
      })
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .groupBy(transactions.currencyCode);

    // Get investments grouped by currency
    const investmentsByCurrency = await db
      .select({
        currency: investmentPositions.currencyCode,
        totalInvested: sql<number>`SUM(${investmentPositions.quantity} * ${investmentPositions.avgBuyPrice})`,
        totalCurrent: sql<number>`SUM(${investmentPositions.quantity} * COALESCE(${investmentPositions.currentPrice}, ${investmentPositions.avgBuyPrice}))`,
      })
      .from(investmentPositions)
      .where(eq(investmentPositions.userId, userId))
      .groupBy(investmentPositions.currencyCode);

    // Merge all data by currency
    const currencyMap = new Map<string, any>();

    for (const acc of accountsByCurrency) {
      currencyMap.set(acc.currency, {
        currency: acc.currency,
        accountsBalance: Number(acc.totalBalance) || 0,
        income: 0,
        expenses: 0,
        invested: 0,
        investmentValue: 0,
      });
    }

    for (const tx of transactionsByCurrency) {
      const existing = currencyMap.get(tx.currency) || {
        currency: tx.currency,
        accountsBalance: 0,
        income: 0,
        expenses: 0,
        invested: 0,
        investmentValue: 0,
      };
      existing.income = Number(tx.totalIncome) || 0;
      existing.expenses = Number(tx.totalExpenses) || 0;
      currencyMap.set(tx.currency, existing);
    }

    for (const inv of investmentsByCurrency) {
      const existing = currencyMap.get(inv.currency) || {
        currency: inv.currency,
        accountsBalance: 0,
        income: 0,
        expenses: 0,
        invested: 0,
        investmentValue: 0,
      };
      existing.invested = Number(inv.totalInvested) || 0;
      existing.investmentValue = Number(inv.totalCurrent) || 0;
      currencyMap.set(inv.currency, existing);
    }

    return Array.from(currencyMap.values());
  } catch (error) {
    console.error("[Dashboard] Error getting stats by currency:", error);
    return [];
  }
}

export async function getInvestmentPositions(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(investmentPositions).where(eq(investmentPositions.userId, userId));
  } catch (error) {
    console.error("[Investments] Error getting positions:", error);
    return [];
  }
}

// ========================================
// INVESTMENT MANAGEMENT FUNCTIONS
// ========================================

export type InsertInvestmentPosition = {
  userId: number;
  accountId?: number | null;
  type: 'stock' | 'fii' | 'etf' | 'crypto' | 'cdb' | 'other';
  market: 'ASX' | 'B3' | 'US' | 'CRYPTO' | 'OTHER';
  symbol: string;
  name: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice?: number | null;
  currencyCode: string;
};

export type InsertInvestmentTransaction = {
  userId: number;
  positionId: number;
  accountId?: number | null;
  type: 'buy' | 'sell' | 'dividend' | 'interest';
  quantity: number;
  price: number;
  total: number;
  fee?: number;
  currencyCode: string;
  date: string;
  notes?: string | null;
};

/**
 * Create a new investment position
 */
export async function createInvestmentPosition(position: InsertInvestmentPosition) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(investmentPositions).values(position).returning();
  return result[0];
}

/**
 * Get investment position by ID
 */
export async function getInvestmentPositionById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(investmentPositions)
    .where(and(eq(investmentPositions.id, id), eq(investmentPositions.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Get investment position by symbol and market
 */
export async function getInvestmentPositionBySymbol(
  userId: number,
  symbol: string,
  market: string
) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(investmentPositions)
    .where(
      and(
        eq(investmentPositions.userId, userId),
        eq(investmentPositions.symbol, symbol),
        eq(investmentPositions.market, market)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Update investment position
 */
export async function updateInvestmentPosition(
  id: number,
  userId: number,
  updates: Partial<InsertInvestmentPosition>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(investmentPositions)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(investmentPositions.id, id), eq(investmentPositions.userId, userId)));
}

/**
 * Delete investment position
 */
export async function deleteInvestmentPosition(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete all transactions for this position first
  await db
    .delete(investmentTransactions)
    .where(
      and(
        eq(investmentTransactions.positionId, id),
        eq(investmentTransactions.userId, userId)
      )
    );

  // Delete the position
  await db
    .delete(investmentPositions)
    .where(and(eq(investmentPositions.id, id), eq(investmentPositions.userId, userId)));
}

/**
 * Create investment transaction
 */
export async function createInvestmentTransaction(transaction: InsertInvestmentTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(investmentTransactions).values(transaction).returning();
  return result[0];
}

/**
 * Get investment transactions for a position
 */
export async function getInvestmentTransactionsByPosition(positionId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(investmentTransactions)
    .where(
      and(
        eq(investmentTransactions.positionId, positionId),
        eq(investmentTransactions.userId, userId)
      )
    )
    .orderBy(desc(investmentTransactions.date));

  return result;
}

/**
 * Get all investment transactions for a user
 */
export async function getInvestmentTransactions(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(investmentTransactions)
    .where(eq(investmentTransactions.userId, userId))
    .orderBy(desc(investmentTransactions.date));

  return result;
}

/**
 * Get all investment transactions with filters (for history/timeline)
 */
export async function getAllInvestmentTransactions(
  userId: number,
  filters?: { limit?: number; type?: 'buy' | 'sell' | 'dividend' | 'interest' }
) {
  const db = await getDb();
  if (!db) return [];

  let query = db
    .select({
      transaction: investmentTransactions,
      position: {
        symbol: investmentPositions.symbol,
        name: investmentPositions.name,
        type: investmentPositions.type,
        market: investmentPositions.market,
      },
    })
    .from(investmentTransactions)
    .leftJoin(
      investmentPositions,
      eq(investmentTransactions.positionId, investmentPositions.id)
    )
    .where(eq(investmentTransactions.userId, userId))
    .$dynamic();

  if (filters?.type) {
    query = query.where(eq(investmentTransactions.type, filters.type));
  }

  query = query.orderBy(desc(investmentTransactions.date));

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  return await query;
}

/**
 * Get portfolio evolution over time for charts
 * Returns snapshots of total invested and current value at different points
 */
export async function getPortfolioEvolution(
  userId: number,
  options?: {
    startDate?: string;
    endDate?: string;
    interval?: 'daily' | 'weekly' | 'monthly';
  }
) {
  const db = await getDb();
  if (!db) return [];

  const interval = options?.interval || 'monthly';
  const endDate = options?.endDate || new Date().toISOString().split('T')[0];
  const startDate = options?.startDate || (() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1); // Default: 1 year ago
    return date.toISOString().split('T')[0];
  })();

  // Get all transactions within the date range
  const transactions = await db
    .select()
    .from(investmentTransactions)
    .where(
      and(
        eq(investmentTransactions.userId, userId),
        sql`${investmentTransactions.date} >= ${startDate}`,
        sql`${investmentTransactions.date} <= ${endDate}`
      )
    )
    .orderBy(investmentTransactions.date);

  // Group transactions by interval and calculate cumulative values
  const evolutionMap = new Map<string, { date: string; invested: number; transactions: number }>();

  let cumulativeInvested = 0;

  for (const tx of transactions) {
    // Get the period key based on interval
    let periodKey: string;
    const txDate = new Date(tx.date);
    
    if (interval === 'daily') {
      periodKey = tx.date;
    } else if (interval === 'weekly') {
      const weekStart = new Date(txDate);
      weekStart.setDate(txDate.getDate() - txDate.getDay());
      periodKey = weekStart.toISOString().split('T')[0];
    } else { // monthly
      periodKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}-01`;
    }

    // Update cumulative invested
    if (tx.type === 'buy') {
      cumulativeInvested += tx.total;
    } else if (tx.type === 'sell') {
      cumulativeInvested -= tx.total;
    }

    // Store or update the period
    const existing = evolutionMap.get(periodKey);
    if (existing) {
      existing.invested = cumulativeInvested;
      existing.transactions += 1;
    } else {
      evolutionMap.set(periodKey, {
        date: periodKey,
        invested: cumulativeInvested,
        transactions: 1,
      });
    }
  }

  // Convert map to sorted array
  const evolution = Array.from(evolutionMap.values()).sort((a, b) => 
    a.date.localeCompare(b.date)
  );

  return evolution;
}

/**
 * Calculate average buy price after a transaction
 */
export function calculateNewAverageBuyPrice(
  currentQuantity: number,
  currentAvgPrice: number,
  newQuantity: number,
  newPrice: number
): number {
  const totalCost = currentQuantity * currentAvgPrice + newQuantity * newPrice;
  const totalQuantity = currentQuantity + newQuantity;
  return totalQuantity > 0 ? Math.round(totalCost / totalQuantity) : 0;
}

/**
 * Process a buy transaction
 * Creates the transaction and updates the position
 */
export async function processBuyTransaction(
  userId: number,
  data: {
    symbol: string;
    name: string;
    type: 'stock' | 'fii' | 'etf' | 'crypto' | 'cdb' | 'other';
    market: 'ASX' | 'B3' | 'US' | 'CRYPTO' | 'OTHER';
    quantity: number;
    price: number;
    fee?: number;
    currencyCode: string;
    date: string;
    accountId?: number | null;
    notes?: string | null;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const fee = data.fee || 0;
  const total = data.quantity * data.price + fee;

  // Check if position exists
  let position = await getInvestmentPositionBySymbol(userId, data.symbol, data.market);

  if (position) {
    // Update existing position
    const newQuantity = position.quantity + data.quantity;
    const newAvgBuyPrice = calculateNewAverageBuyPrice(
      position.quantity,
      position.avgBuyPrice,
      data.quantity,
      data.price
    );

    await updateInvestmentPosition(position.id, userId, {
      quantity: newQuantity,
      avgBuyPrice: newAvgBuyPrice,
    });
  } else {
    // Create new position
    position = await createInvestmentPosition({
      userId,
      accountId: data.accountId,
      type: data.type,
      market: data.market,
      symbol: data.symbol,
      name: data.name,
      quantity: data.quantity,
      avgBuyPrice: data.price,
      currencyCode: data.currencyCode,
    });
  }

  // Create transaction
  const transaction = await createInvestmentTransaction({
    userId,
    positionId: position.id,
    accountId: data.accountId,
    type: 'buy',
    quantity: data.quantity,
    price: data.price,
    total,
    fee,
    currencyCode: data.currencyCode,
    date: data.date,
    notes: data.notes,
  });

  return { position, transaction };
}

/**
 * Process a sell transaction
 */
export async function processSellTransaction(
  userId: number,
  positionId: number,
  data: {
    quantity: number;
    price: number;
    fee?: number;
    date: string;
    accountId?: number | null;
    notes?: string | null;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const position = await getInvestmentPositionById(positionId, userId);
  if (!position) {
    throw new Error("Position not found");
  }

  if (data.quantity > position.quantity) {
    throw new Error("Cannot sell more than you own");
  }

  const fee = data.fee || 0;
  const total = data.quantity * data.price - fee;

  // Update position quantity
  const newQuantity = position.quantity - data.quantity;
  
  if (newQuantity === 0) {
    // Position fully sold, delete it
    await deleteInvestmentPosition(positionId, userId);
  } else {
    await updateInvestmentPosition(positionId, userId, {
      quantity: newQuantity,
    });
  }

  // Create transaction
  const transaction = await createInvestmentTransaction({
    userId,
    positionId,
    accountId: data.accountId,
    type: 'sell',
    quantity: data.quantity,
    price: data.price,
    total,
    fee,
    currencyCode: position.currencyCode,
    date: data.date,
    notes: data.notes,
  });

  return transaction;
}

/**
 * Get investment portfolio summary
 */
export async function getInvestmentSummary(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const positions = await getInvestmentPositions(userId);
  
  if (positions.length === 0) {
    return {
      totalInvested: 0,
      currentValue: 0,
      totalPL: 0,
      totalPLPercent: 0,
      positionsCount: 0,
      positions: [],
    };
  }

  let totalInvested = 0;
  let currentValue = 0;

  const enrichedPositions = positions.map(pos => {
    const invested = pos.quantity * pos.avgBuyPrice;
    const current = pos.quantity * (pos.currentPrice || pos.avgBuyPrice);
    const pl = current - invested;
    const plPercent = invested > 0 ? (pl / invested) * 100 : 0;

    totalInvested += invested;
    currentValue += current;

    return {
      ...pos,
      invested,
      currentValue: current,
      pl,
      plPercent,
    };
  });

  const totalPL = currentValue - totalInvested;
  const totalPLPercent = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

  return {
    totalInvested,
    currentValue,
    totalPL,
    totalPLPercent,
    positionsCount: positions.length,
    positions: enrichedPositions,
  };
}
