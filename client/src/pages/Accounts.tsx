import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { 
  Wallet,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Building,
  Loader2
} from "lucide-react";

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

function AccountCard({ account }: any) {
  const typeIcons = {
    bank: Building,
    credit_card: CreditCard,
    wallet: Wallet,
    broker: TrendingUp,
    savings: PiggyBank,
  };

  const Icon = typeIcons[account.type as keyof typeof typeIcons] || Wallet;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{account.name}</CardTitle>
              <Badge variant="outline" className="mt-1 text-xs">
                {account.type.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">Balance</span>
            <span className="text-2xl font-bold">
              {formatCurrency(account.initialBalance, account.currencyCode)}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Currency</span>
            <span className="font-medium">{account.currencyCode}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AccountsContent() {
  const { data: accounts, isLoading } = trpc.finance.getAccounts.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const visibleAccounts = accounts?.filter(a => !a.isHidden) || [];
  const totalBalance = visibleAccounts.reduce((sum, acc) => sum + acc.initialBalance, 0);

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Accounts</h1>
        <p className="text-muted-foreground mt-2">
          Manage your financial accounts and balances
        </p>
      </div>

      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
              <p className="text-4xl font-bold">{formatCurrency(totalBalance)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Accounts</p>
              <p className="text-2xl font-semibold">{visibleAccounts.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visibleAccounts.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}
      </div>

      {visibleAccounts.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          <p>No accounts found</p>
        </div>
      )}
    </div>
  );
}

export default function Accounts() {
  return (
    <DashboardLayout>
      <AccountsContent />
    </DashboardLayout>
  );
}
