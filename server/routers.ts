import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  seedMockData, 
  getDashboardStats, 
  getRecentTransactions, 
  getMonthlyExpensesByCategory,
  getAccounts,
  getCategories,
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  getDashboardByCurrency,
  getInvestmentPositions,
  getInvestmentSummary,
  processBuyTransaction,
  processSellTransaction,
  getInvestmentPositionById,
  getInvestmentTransactionsByPosition,
  getAllInvestmentTransactions,
  getPortfolioEvolution,
  deleteInvestmentPosition,
  updateInvestmentPosition,
} from "./db";
import { registerUser, loginUser, createSessionToken } from "./_core/auth";
import { getQuote, batchUpdatePrices } from "./_core/marketData";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const user = await registerUser(input.email, input.password, input.name);
          
          // Create session token
          const sessionToken = await createSessionToken(
            user.id,
            user.email,
            user.name || user.email,
            { expiresInMs: ONE_YEAR_MS }
          );
          
          // Set cookie
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { 
            ...cookieOptions, 
            maxAge: ONE_YEAR_MS 
          });
          
          return { success: true, user: { id: user.id, email: user.email, name: user.name } };
        } catch (error) {
          throw new Error(error instanceof Error ? error.message : 'Registration failed');
        }
      }),
    
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const user = await loginUser(input.email, input.password);
          
          // Create session token
          const sessionToken = await createSessionToken(
            user.id,
            user.email,
            user.name || user.email,
            { expiresInMs: ONE_YEAR_MS }
          );
          
          // Set cookie
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { 
            ...cookieOptions, 
            maxAge: ONE_YEAR_MS 
          });
          
          return { success: true, user: { id: user.id, email: user.email, name: user.name } };
        } catch (error) {
          throw new Error('Invalid credentials');
        }
      }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  finance: router({
    // Initialize demo data for new users
    initDemoData: protectedProcedure.mutation(async ({ ctx }) => {
      await seedMockData(ctx.user.id);
      return { success: true };
    }),

    // Dashboard data
    getDashboard: protectedProcedure.query(async ({ ctx }) => {
      const stats = await getDashboardStats(ctx.user.id);
      const recentTransactions = await getRecentTransactions(ctx.user.id, 10);
      const expensesByCategory = await getMonthlyExpensesByCategory(ctx.user.id);

      return {
        stats,
        recentTransactions,
        expensesByCategory,
      };
    }),

    // Accounts
    getAccounts: protectedProcedure.query(async ({ ctx }) => {
      return await getAccounts(ctx.user.id);
    }),

    // Categories
    getCategories: protectedProcedure.query(async ({ ctx }) => {
      return await getCategories(ctx.user.id);
    }),

    // Companies
    getCompanies: protectedProcedure.query(async ({ ctx }) => {
      return await getCompanies(ctx.user.id);
    }),

    createCompany: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await createCompany(ctx.user.id, input);
      }),

    updateCompany: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateCompany(id, ctx.user.id, data);
        return { success: true };
      }),

    deleteCompany: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteCompany(input.id, ctx.user.id);
        return { success: true };
      }),

    // Dashboard by currency
    getDashboardByCurrency: protectedProcedure.query(async ({ ctx }) => {
      return await getDashboardByCurrency(ctx.user.id);
    }),

    // Investments
    getInvestments: protectedProcedure.query(async ({ ctx }) => {
      return await getInvestmentPositions(ctx.user.id);
    }),

    // Transactions
    getTransactions: protectedProcedure.query(async ({ ctx }) => {
      return await getRecentTransactions(ctx.user.id, 100);
    }),
  }),

  investments: router({
    // Get investment summary (portfolio overview)
    getSummary: protectedProcedure.query(async ({ ctx }) => {
      return await getInvestmentSummary(ctx.user.id);
    }),

    // Get all positions
    getPositions: protectedProcedure.query(async ({ ctx }) => {
      return await getInvestmentPositions(ctx.user.id);
    }),

    // Get single position
    getPosition: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getInvestmentPositionById(input.id, ctx.user.id);
      }),

    // Get transactions for a position
    getPositionTransactions: protectedProcedure
      .input(z.object({ positionId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getInvestmentTransactionsByPosition(input.positionId, ctx.user.id);
      }),

    // Get all transactions history (for timeline/graphs)
    getAllTransactions: protectedProcedure
      .input(z.object({
        limit: z.number().optional(),
        type: z.enum(['buy', 'sell', 'dividend', 'interest']).optional(),
      }))
      .query(async ({ ctx, input }) => {
        return await getAllInvestmentTransactions(ctx.user.id, input);
      }),

    // Get portfolio evolution over time (for charts)
    getPortfolioEvolution: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(), // YYYY-MM-DD
        endDate: z.string().optional(),   // YYYY-MM-DD
        interval: z.enum(['daily', 'weekly', 'monthly']).default('monthly'),
      }))
      .query(async ({ ctx, input }) => {
        return await getPortfolioEvolution(ctx.user.id, input);
      }),

    // Buy investment
    buy: protectedProcedure
      .input(z.object({
        symbol: z.string(),
        name: z.string(),
        type: z.enum(['stock', 'fii', 'etf', 'crypto', 'cdb', 'other']),
        market: z.enum(['ASX', 'B3', 'US', 'CRYPTO', 'OTHER']),
        quantity: z.number().positive(),
        price: z.number().positive(),
        fee: z.number().nonnegative().optional(),
        currencyCode: z.string(),
        date: z.string(),
        accountId: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await processBuyTransaction(ctx.user.id, input);
      }),

    // Sell investment
    sell: protectedProcedure
      .input(z.object({
        positionId: z.number(),
        quantity: z.number().positive(),
        price: z.number().positive(),
        fee: z.number().nonnegative().optional(),
        date: z.string(),
        accountId: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await processSellTransaction(ctx.user.id, input.positionId, input);
      }),

    // Update position (manual edit)
    updatePosition: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        currentPrice: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await updateInvestmentPosition(id, ctx.user.id, updates);
        return { success: true };
      }),

    // Delete position
    deletePosition: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteInvestmentPosition(input.id, ctx.user.id);
        return { success: true };
      }),

    // Get real-time quote
    getQuote: protectedProcedure
      .input(z.object({
        symbol: z.string(),
        market: z.string(),
      }))
      .query(async ({ input }) => {
        return await getQuote(input.symbol, input.market);
      }),

    // Update all positions with latest prices
    updatePrices: protectedProcedure.mutation(async ({ ctx }) => {
      const positions = await getInvestmentPositions(ctx.user.id);
      
      if (positions.length === 0) {
        return { updated: 0 };
      }

      const positionsToUpdate = positions.map(p => ({
        symbol: p.symbol,
        market: p.market,
      }));

      const quotes = await batchUpdatePrices(positionsToUpdate);
      let updated = 0;

      for (const position of positions) {
        const key = `${position.symbol}-${position.market}`;
        const quote = quotes.get(key);
        
        if (quote) {
          await updateInvestmentPosition(position.id, ctx.user.id, {
            currentPrice: quote.price,
            lastPriceUpdate: quote.lastUpdated,
          });
          updated++;
        }
      }

      return { updated };
    }),
  }),
});

export type AppRouter = typeof appRouter;
