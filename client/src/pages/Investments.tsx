import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Loader2,
  RefreshCw,
  Briefcase,
  DollarSign,
  PieChart as PieChartIcon,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend, Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";

function formatCurrency(amount: number, currency: string = 'USD') {
  const symbols: Record<string, string> = {
    'AUD': 'A$',
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

function AddInvestmentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    type: 'stock' as 'stock' | 'fii' | 'etf' | 'crypto' | 'cdb' | 'other',
    market: 'ASX' as 'ASX' | 'B3' | 'US' | 'CRYPTO' | 'OTHER',
    quantity: '',
    price: '',
    fee: '',
    currencyCode: 'USD',
    date: new Date().toISOString().split('T')[0],
  });

  const utils = trpc.useUtils();
  
  const buyMutation = trpc.investments.buy.useMutation({
    onSuccess: () => {
      toast.success('Investment added successfully!');
      utils.investments.getSummary.invalidate();
      utils.investments.getPositions.invalidate();
      onOpenChange(false);
      setFormData({
        symbol: '',
        name: '',
        type: 'stock',
        market: 'ASX',
        quantity: '',
        price: '',
        fee: '',
        currencyCode: 'USD',
        date: new Date().toISOString().split('T')[0],
      });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add investment');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    buyMutation.mutate({
      symbol: formData.symbol.toUpperCase(),
      name: formData.name,
      type: formData.type,
      market: formData.market,
      quantity: Math.round(parseFloat(formData.quantity) * 100), // Convert to cents
      price: Math.round(parseFloat(formData.price) * 100), // Convert to cents
      fee: formData.fee ? Math.round(parseFloat(formData.fee) * 100) : 0,
      currencyCode: formData.currencyCode,
      date: formData.date,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Investment</DialogTitle>
          <DialogDescription>
            Register a new investment purchase
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Asset Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="fii">FII (Brazil)</SelectItem>
                  <SelectItem value="etf">ETF</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                  <SelectItem value="cdb">CDB/Fixed Income</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="market">Market</Label>
              <Select
                value={formData.market}
                onValueChange={(value: any) => {
                  const currencyMap: Record<string, string> = {
                    'ASX': 'AUD',
                    'B3': 'BRL',
                    'US': 'USD',
                    'CRYPTO': 'USD',
                    'OTHER': 'USD',
                  };
                  setFormData({ 
                    ...formData, 
                    market: value,
                    currencyCode: currencyMap[value] || 'USD'
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASX">ASX (Australia)</SelectItem>
                  <SelectItem value="B3">B3 (Brazil)</SelectItem>
                  <SelectItem value="US">US Market</SelectItem>
                  <SelectItem value="CRYPTO">Cryptocurrency</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">
                Symbol / Ticker *
                <span className="text-xs text-muted-foreground ml-2">
                  (e.g., BHP.AX, PETR4.SA, BTC)
                </span>
              </Label>
              <Input
                id="symbol"
                placeholder="BHP"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Asset Name *</Label>
              <Input
                id="name"
                placeholder="BHP Group Limited"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.00001"
                placeholder="100"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price per Unit *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="45.50"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fee">Fee (optional)</Label>
              <Input
                id="fee"
                type="number"
                step="0.01"
                placeholder="9.95"
                value={formData.fee}
                onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currencyCode}
                onValueChange={(value) => setFormData({ ...formData, currencyCode: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="AUD">AUD (A$)</SelectItem>
                  <SelectItem value="BRL">BRL (R$)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Purchase Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>

          {formData.quantity && formData.price && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Cost:</span>
                  <span className="font-semibold">
                    {formatCurrency(
                      Math.round((parseFloat(formData.quantity) * parseFloat(formData.price) + (parseFloat(formData.fee) || 0)) * 100),
                      formData.currencyCode
                    )}
                  </span>
                </div>
                {formData.fee && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Including fee:</span>
                    <span>{formatCurrency(Math.round(parseFloat(formData.fee) * 100), formData.currencyCode)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={buyMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={buyMutation.isPending}>
              {buyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Investment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InvestmentsContent() {
  const { user } = useAuth();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMarket, setFilterMarket] = useState<string>('all');

  const { data: summary, isLoading } = trpc.investments.getSummary.useQuery();
  const { data: positions } = trpc.investments.getPositions.useQuery();
  const { data: allTransactions } = trpc.investments.getAllTransactions.useQuery({ limit: 100 });
  const { data: portfolioEvolution } = trpc.investments.getPortfolioEvolution.useQuery({
    interval: 'monthly',
  });
  const utils = trpc.useUtils();

  const updatePricesMutation = trpc.investments.updatePrices.useMutation({
    onSuccess: (data) => {
      toast.success(`Updated ${data.updated} positions`);
      utils.investments.getSummary.invalidate();
      utils.investments.getPositions.invalidate();
    },
    onError: () => {
      toast.error('Failed to update prices');
    },
  });

  const deletePositionMutation = trpc.investments.deletePosition.useMutation({
    onSuccess: () => {
      toast.success('Position deleted');
      utils.investments.getSummary.invalidate();
      utils.investments.getPositions.invalidate();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredPositions = positions?.filter(pos => {
    const matchesSearch = pos.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pos.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || pos.type === filterType;
    const matchesMarket = filterMarket === 'all' || pos.market === filterMarket;
    return matchesSearch && matchesType && matchesMarket;
  }) || [];

  // Prepare chart data
  const chartDataByType = positions?.reduce((acc: any[], pos) => {
    const currentValue = pos.quantity * (pos.currentPrice || pos.avgBuyPrice);
    const existing = acc.find(item => item.name === pos.type);
    if (existing) {
      existing.value += currentValue;
    } else {
      acc.push({ name: pos.type, value: currentValue });
    }
    return acc;
  }, []) || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Investments</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage your investment portfolio
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => updatePricesMutation.mutate()}
            disabled={updatePricesMutation.isPending}
          >
            {updatePricesMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Update Prices
          </Button>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Investment
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <StatCard
          title="Total Invested"
          value={formatCurrency(summary?.totalInvested || 0)}
          icon={DollarSign}
          color="text-blue-500"
        />
        <StatCard
          title="Current Value"
          value={formatCurrency(summary?.currentValue || 0)}
          icon={Briefcase}
          color="text-green-500"
        />
        <StatCard
          title="Total P/L"
          value={formatCurrency(summary?.totalPL || 0)}
          icon={summary && summary.totalPL >= 0 ? TrendingUp : TrendingDown}
          trend={summary && summary.totalPL >= 0 ? 'up' : 'down'}
          trendValue={`${summary?.totalPLPercent.toFixed(2) || '0.00'}%`}
          color={summary && summary.totalPL >= 0 ? 'text-green-500' : 'text-red-500'}
        />
        <StatCard
          title="Positions"
          value={summary?.positionsCount.toString() || '0'}
          icon={PieChartIcon}
          color="text-purple-500"
        />
      </div>

      {/* Portfolio Evolution Chart */}
      {portfolioEvolution && portfolioEvolution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Evolution</CardTitle>
            <CardDescription>Total invested over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={portfolioEvolution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getFullYear()}`;
                  }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 100).toFixed(0)}`}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => {
                    const date = new Date(label);
                    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="invested" 
                  stroke="#0088FE" 
                  strokeWidth={2}
                  name="Total Invested"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      {chartDataByType.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Distribution by Type</CardTitle>
              <CardDescription>Value distribution across asset types</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartDataByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartDataByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Quick stats about your portfolio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Average Return</span>
                  <span className={`font-semibold ${summary && summary.totalPLPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {summary && summary.totalPLPercent >= 0 ? '+' : ''}{summary?.totalPLPercent.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Assets</span>
                  <span className="font-semibold">{positions?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Best Performer</span>
                  <span className="font-semibold text-green-500">
                    {positions && positions.length > 0
                      ? positions.reduce((best, pos) => {
                          const pl = ((pos.currentPrice || pos.avgBuyPrice) - pos.avgBuyPrice) / pos.avgBuyPrice * 100;
                          const bestPl = ((best.currentPrice || best.avgBuyPrice) - best.avgBuyPrice) / best.avgBuyPrice * 100;
                          return pl > bestPl ? pos : best;
                        }).symbol
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Worst Performer</span>
                  <span className="font-semibold text-red-500">
                    {positions && positions.length > 0
                      ? positions.reduce((worst, pos) => {
                          const pl = ((pos.currentPrice || pos.avgBuyPrice) - pos.avgBuyPrice) / pos.avgBuyPrice * 100;
                          const worstPl = ((worst.currentPrice || worst.avgBuyPrice) - worst.avgBuyPrice) / worst.avgBuyPrice * 100;
                          return pl < worstPl ? pos : worst;
                        }).symbol
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Positions</CardTitle>
          <CardDescription>All your investment positions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by symbol or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="stock">Stock</SelectItem>
                <SelectItem value="fii">FII</SelectItem>
                <SelectItem value="etf">ETF</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
                <SelectItem value="cdb">CDB</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterMarket} onValueChange={setFilterMarket}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by market" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Markets</SelectItem>
                <SelectItem value="ASX">ASX</SelectItem>
                <SelectItem value="B3">B3</SelectItem>
                <SelectItem value="US">US</SelectItem>
                <SelectItem value="CRYPTO">Crypto</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Positions Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Avg Price</TableHead>
                  <TableHead className="text-right">Current Price</TableHead>
                  <TableHead className="text-right">Invested</TableHead>
                  <TableHead className="text-right">Current Value</TableHead>
                  <TableHead className="text-right">P/L</TableHead>
                  <TableHead className="text-right">P/L %</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPositions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                      No positions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPositions.map((pos) => {
                    const invested = pos.quantity * pos.avgBuyPrice;
                    const current = pos.quantity * (pos.currentPrice || pos.avgBuyPrice);
                    const pl = current - invested;
                    const plPercent = invested > 0 ? (pl / invested) * 100 : 0;

                    return (
                      <TableRow key={pos.id}>
                        <TableCell className="font-medium">{pos.symbol}</TableCell>
                        <TableCell>{pos.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{pos.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{pos.market}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{(pos.quantity / 100).toFixed(4)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(pos.avgBuyPrice, pos.currencyCode)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(pos.currentPrice || pos.avgBuyPrice, pos.currencyCode)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(invested, pos.currencyCode)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(current, pos.currencyCode)}</TableCell>
                        <TableCell className={`text-right font-semibold ${pl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {pl >= 0 ? '+' : ''}{formatCurrency(pl, pos.currencyCode)}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${plPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {plPercent >= 0 ? '+' : ''}{plPercent.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Delete position ${pos.symbol}?`)) {
                                deletePositionMutation.mutate({ id: pos.id });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      {allTransactions && allTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest investment activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allTransactions.slice(0, 10).map((item) => {
                const tx = item.transaction;
                const pos = item.position;
                const isBuy = tx.type === 'buy';
                
                return (
                  <div key={tx.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isBuy ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        {isBuy ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {tx.type.toUpperCase()} {pos?.symbol || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {pos?.name} • {(tx.quantity / 100).toFixed(4)} units @ {formatCurrency(tx.price, tx.currencyCode)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${isBuy ? 'text-green-500' : 'text-red-500'}`}>
                        {isBuy ? '+' : '-'}{formatCurrency(tx.total, tx.currencyCode)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <AddInvestmentDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
}

export default function Investments() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <InvestmentsContent />
    </DashboardLayout>
  );
}
