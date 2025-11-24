import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { 
  ArrowUpRight,
  ArrowDownRight,
  Repeat,
  TrendingUp,
  Filter,
  Search,
  Loader2,
  Building2,
  StickyNote
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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

function TransactionRow({ transaction, companies }: any) {
  const t = transaction;
  const typeConfig = {
    expense: { icon: ArrowDownRight, color: 'text-red-500', bg: 'bg-red-500/10', badge: 'destructive' },
    income: { icon: ArrowUpRight, color: 'text-green-500', bg: 'bg-green-500/10', badge: 'default' },
    transfer: { icon: Repeat, color: 'text-blue-500', bg: 'bg-blue-500/10', badge: 'secondary' },
    investment: { icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10', badge: 'outline' },
  };

  const config = typeConfig[t.type as keyof typeof typeConfig] || typeConfig.expense;
  const Icon = config.icon;
  const company = companies?.find((c: any) => c.id === t.companyId);

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <div className={`p-3 rounded-lg ${config.bg}`}>
          <Icon className={`h-5 w-5 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="font-semibold truncate">{t.description}</p>
            <Badge variant={config.badge as any} className="text-xs">
              {t.type}
            </Badge>
            {company && (
              <Badge variant="outline" className="text-xs gap-1">
                <Building2 className="h-3 w-3" />
                {company.name}
              </Badge>
            )}
            {t.notes && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-xs gap-1 cursor-help">
                    <StickyNote className="h-3 w-3" />
                    Note
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">{t.notes}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>Account #{t.accountId}</span>
            <span>•</span>
            <span>Category #{t.categoryId || 'None'}</span>
            <span>•</span>
            <span>{new Date(t.date).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-lg font-bold ${config.color}`}>
          {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount, t.currencyCode)}
        </p>
        <p className="text-xs text-muted-foreground">{t.currencyCode}</p>
      </div>
    </div>
  );
}

function TransactionsContent() {
  const { data: transactions, isLoading } = trpc.finance.getTransactions.useQuery();
  const { data: companies } = trpc.finance.getCompanies.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground mt-2">
          View and manage all your financial transactions
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Transactions</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search transactions..." 
                  className="pl-10 w-[300px]"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {transactions && transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <TransactionRow 
                  key={transaction.id}
                  transaction={transaction}
                  companies={companies}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <p>No transactions found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Transactions() {
  return (
    <DashboardLayout>
      <TransactionsContent />
    </DashboardLayout>
  );
}
