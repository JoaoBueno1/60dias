-- Performance Indexes for Personal Finance Hub
-- Run this after migrations to improve query performance

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_currency ON transactions(user_id, currency_code);
CREATE INDEX IF NOT EXISTS idx_transactions_company ON transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);

-- Investment indexes
CREATE INDEX IF NOT EXISTS idx_investments_user_currency ON investment_positions(user_id, currency_code);
CREATE INDEX IF NOT EXISTS idx_investments_user_type ON investment_positions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_investments_user_market ON investment_positions(user_id, market);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_position ON investment_transactions(position_id);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_user_date ON investment_transactions(user_id, date);

-- Companies index
CREATE INDEX IF NOT EXISTS idx_companies_user ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_user_name ON companies(user_id, name);

-- Accounts index
CREATE INDEX IF NOT EXISTS idx_accounts_user_currency ON accounts(user_id, currency_code);

-- Categories index
CREATE INDEX IF NOT EXISTS idx_categories_user_type ON categories(user_id, type);

-- Price cache index
CREATE INDEX IF NOT EXISTS idx_price_cache_symbol_market ON price_cache(symbol, market);
CREATE INDEX IF NOT EXISTS idx_price_cache_updated ON price_cache(last_updated);

-- Query optimization hints
ANALYZE;
