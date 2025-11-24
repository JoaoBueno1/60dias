import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard, 
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Loader2,
  Briefcase
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function formatCurrency(amount: number, currency: string = 'AUD') {
  const symbols: Record<string, string> = {
    'AUD': '$',
    'BRL': 'R$',
    'USD': '$',
    'EUR': '€',
  };
  
  return `${symbols[currency] || '$'}${(amount / 100).toLocaleString('en-US', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  })}`;
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue,
  color = "text-primary"
}: { 
  title: string; 
  value: string; 
  icon: any; 
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: string;
}) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {trend && trendValue && (
          <div className={`flex items-center gap-1 text-sm mt-2 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            <span>{trendValue}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  
  const initMutation = trpc.finance.initDemoData.useMutation({
    onSuccess: () => {
      utils.finance.getDashboard.invalidate();
      utils.finance.getDashboardByCurrency.invalidate();
      toast.success("Demo data initialized!");
    },
  });

  const { data: dashboardData, isLoading } = trpc.finance.getDashboard.useQuery();
  const { data: currencyData } = trpc.finance.getDashboardByCurrency.useQuery();
  const { data: investmentSummary } = trpc.investments.getSummary.useQuery();

  useEffect(() => {
    if (user && !isLoading && dashboardData) {
      // Check if we have no data at all (empty stats)
      const hasNoData = !dashboardData.stats || 
        (dashboardData.stats.totalNetWorth === 0 && 
         dashboardData.recentTransactions.length === 0);
      
      if (hasNoData && !initMutation.isPending) {
        console.log('Initializing demo data...');
        initMutation.mutate();
      }
    }
  }, [user, isLoading, dashboardData]);

  if (isLoading || initMutation.isPending) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = dashboardData?.stats;
  const recentTransactions = dashboardData?.recentTransactions || [];
  const expensesByCategory = dashboardData?.expensesByCategory || [];

  // Get data by currency
  const currentCurrencyData = selectedCurrency === 'all' 
    ? { 
        totalBalance: stats?.totalNetWorth || 0,
        monthlyIncome: stats?.monthlyIncome || 0, 
        monthlyExpenses: stats?.monthlyExpenses || 0,
        totalSavings: stats?.totalSavings || 0,
        currencyCode: 'AUD'
      }
    : currencyData?.find(d => d.currencyCode === selectedCurrency) || {
        totalBalance: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        totalSavings: 0,
        currencyCode: selectedCurrency
      };

  const currencies = ['all', 'USD', 'AUD', 'BRL', 'EUR'];

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {user?.name || 'User'}! Here's your financial overview.
        </p>
      </div>

      <Tabs value={selectedCurrency} onValueChange={setSelectedCurrency} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-5">
          <TabsTrigger value="all">ALL</TabsTrigger>
          <TabsTrigger value="USD">USD</TabsTrigger>
          <TabsTrigger value="AUD">AUD</TabsTrigger>
          <TabsTrigger value="BRL">BRL</TabsTrigger>
          <TabsTrigger value="EUR">EUR</TabsTrigger>
        </TabsList>

        {currencies.map(currency => (
          <TabsContent key={currency} value={currency} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
              <StatCard
                title={selectedCurrency === 'all' ? "Total Net Worth" : `Net Worth (${selectedCurrency})`}
                value={formatCurrency(
                  selectedCurrency === 'all' 
                    ? (stats?.totalNetWorth || 0) + (investmentSummary?.currentValue || 0)
                    : currentCurrencyData.totalBalance,
                  selectedCurrency === 'all' ? 'AUD' : selectedCurrency
                )}
                icon={Wallet}
                color="text-green-500"
                trend="up"
                trendValue="+12.5%"
              />
              <StatCard
                title="Monthly Income"
                value={formatCurrency(
                  currentCurrencyData.monthlyIncome,
                  selectedCurrency === 'all' ? 'AUD' : selectedCurrency
                )}
                icon={TrendingUp}
                color="text-blue-500"
                trend="up"
                trendValue="+5.2%"
              />
              <StatCard
                title="Monthly Expenses"
                value={formatCurrency(
                  currentCurrencyData.monthlyExpenses,
                  selectedCurrency === 'all' ? 'AUD' : selectedCurrency
                )}
                icon={TrendingDown}
                color="text-orange-500"
                trend="down"
                trendValue="-3.1%"
              />
              <StatCard
                title="Total Savings"
                value={formatCurrency(
                  currentCurrencyData.totalSavings,
                  selectedCurrency === 'all' ? 'AUD' : selectedCurrency
                )}
                icon={PiggyBank}
                color="text-purple-500"
                trend="up"
                trendValue="+8.7%"
              />
              {selectedCurrency === 'all' && (
                <StatCard
                  title="Investments"
                  value={formatCurrency(investmentSummary?.currentValue || 0)}
                  icon={Briefcase}
                  color="text-indigo-500"
                  trend={investmentSummary && investmentSummary.totalPL >= 0 ? 'up' : 'down'}
                  trendValue={investmentSummary ? `${investmentSummary.totalPL >= 0 ? '+' : ''}${investmentSummary.totalPLPercent.toFixed(2)}%` : '0.00%'}
                />
              )}
            </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {expensesByCategory.length > 0 ? (
              <div className="space-y-4">
                {expensesByCategory.map((item, index) => {
                  const total = expensesByCategory.reduce((sum, i) => sum + Number(i.total), 0);
                  const percentage = ((Number(item.total) / total) * 100).toFixed(1);
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: item.categoryColor || '#888' }}
                          />
                          <span className="font-medium">{item.categoryName}</span>
                        </div>
                        <span className="text-muted-foreground">{percentage}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full transition-all duration-500 rounded-full"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: item.categoryColor || '#888'
                          }}
                        />
                      </div>
                      <div className="text-right text-sm font-semibold">
                        {formatCurrency(Number(item.total))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No expense data for this month
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.slice(0, 8).map((t) => {
                  const isExpense = t.type === 'expense';
                  
                  return (
                    <div key={t.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isExpense ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                          <CreditCard className={`h-4 w-4 ${isExpense ? 'text-red-500' : 'text-green-500'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{t.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Account #{t.accountId} • Category #{t.categoryId}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${isExpense ? 'text-red-500' : 'text-green-500'}`}>
                          {isExpense ? '-' : '+'}{formatCurrency(t.amount, t.currencyCode)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(t.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No recent transactions
              </div>
            )}
          </CardContent>
        </Card>
      </div>
          </TabsContent>
        ))}
      </Tabs>

      <Card className="bg-linear-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Quick Actions</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your finances efficiently
              </p>
            </div>
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Add Transaction
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
