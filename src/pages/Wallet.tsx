import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet as WalletIcon, ArrowUpCircle, ArrowDownCircle, Loader2, Shield, AlertCircle, TrendingUp, Target, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { usePageSEO } from '@/hooks/usePageSEO';
import Navigation from '@/components/Navigation';

const Wallet = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, transactions, isLoading, deposit, withdraw, isDepositing, isWithdrawing } = useWallet();
  const { format: formatCurrency, symbol } = useCurrency();

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);

  usePageSEO({
    title: 'Wallet - Betcha',
    description: 'Manage your Betcha wallet, deposit funds, withdraw winnings, and view transaction history.',
    canonicalPath: '/wallet'
  });

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>You need to sign in to access your wallet</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/login')} className="w-full">
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }
    deposit({ amount });
    setDepositAmount('');
    setDepositDialogOpen(false);
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }
    withdraw({ amount });
    setWithdrawAmount('');
    setWithdrawDialogOpen(false);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownCircle className="w-4 h-4 text-green-500" />;
      case 'withdrawal':
        return <ArrowUpCircle className="w-4 h-4 text-blue-500" />;
      case 'bet_placed':
        return <Target className="w-4 h-4 text-orange-500" />;
      case 'bet_won':
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 'bet_lost':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'refund':
        return <ArrowDownCircle className="w-4 h-4 text-purple-500" />;
      case 'platform_fee':
        return <Shield className="w-4 h-4 text-gray-500" />;
      default:
        return <WalletIcon className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] md:min-h-[calc(100vh-9rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="p-4 md:p-8">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Wallet</h1>
          {profile?.kyc_status !== 'verified' && (
            <Button variant="outline" onClick={() => navigate('/kyc')}>
              Complete KYC
            </Button>
          )}
        </div>

        {/* KYC Warning */}
        {profile?.kyc_status !== 'verified' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Complete KYC verification to enable withdrawals. Your current status: <strong>{profile?.kyc_status}</strong>
            </AlertDescription>
          </Alert>
        )}

        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <WalletIcon className="w-5 h-5" />
                Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">
                {formatCurrency(profile?.wallet_balance || 0)}
              </div>
              <div className="flex gap-2 mt-4">
                <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="hero" className="flex-1">
                      <ArrowDownCircle className="w-4 h-4 mr-2" />
                      Deposit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Deposit Funds</DialogTitle>
                      <DialogDescription>
                        Add funds to your Betcha wallet
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="depositAmount">Amount (R)</Label>
                        <Input
                          id="depositAmount"
                          type="number"
                          min="1"
                          step="0.01"
                          placeholder="50.00"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="text-white"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setDepositAmount('10')}>R10</Button>
                        <Button variant="outline" size="sm" onClick={() => setDepositAmount('50')}>R50</Button>
                        <Button variant="outline" size="sm" onClick={() => setDepositAmount('100')}>R100</Button>
                        <Button variant="outline" size="sm" onClick={() => setDepositAmount('500')}>R500</Button>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDepositDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleDeposit} disabled={isDepositing}>
                        {isDepositing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Deposit
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1" disabled={profile?.kyc_status !== 'verified'}>
                      <ArrowUpCircle className="w-4 h-4 mr-2" />
                      Withdraw
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Withdraw Funds</DialogTitle>
                      <DialogDescription>
                        Withdraw funds from your Betcha wallet
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="withdrawAmount">Amount (R)</Label>
                        <Input
                          id="withdrawAmount"
                          type="number"
                          min="1"
                          step="0.01"
                          max={profile?.wallet_balance || 0}
                          placeholder="50.00"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          className="text-white"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Available: {formatCurrency(profile?.wallet_balance || 0)}
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleWithdraw} disabled={isWithdrawing}>
                        {isWithdrawing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Withdraw
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Bets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.total_bets || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Wins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{profile?.total_wins || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(profile?.total_earnings || 0)} earned
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Your recent wallet transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="deposits">Deposits</TabsTrigger>
                <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
                <TabsTrigger value="bets">Bets</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                {!transactions || transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No transactions yet</p>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getTransactionIcon(tx.type)}
                                <span className="capitalize">{tx.type.replace('_', ' ')}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(tx.created_at), 'MMM dd, yyyy HH:mm')}
                            </TableCell>
                            <TableCell>
                              <span className={tx.amount >= 0 ? 'text-green-500' : 'text-red-500'}>
                                {tx.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                              </span>
                            </TableCell>
                            <TableCell>{getStatusBadge(tx.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="deposits">
                {!transactions?.filter(tx => tx.type === 'deposit').length ? (
                  <p className="text-center text-muted-foreground py-8">No deposits yet</p>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.filter(tx => tx.type === 'deposit').map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell>{format(new Date(tx.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                            <TableCell className="text-green-500">+{formatCurrency(tx.amount)}</TableCell>
                            <TableCell>{getStatusBadge(tx.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="withdrawals">
                {!transactions?.filter(tx => tx.type === 'withdrawal').length ? (
                  <p className="text-center text-muted-foreground py-8">No withdrawals yet</p>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.filter(tx => tx.type === 'withdrawal').map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell>{format(new Date(tx.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                            <TableCell className="text-red-500">{formatCurrency(Math.abs(tx.amount))}</TableCell>
                            <TableCell>{getStatusBadge(tx.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="bets">
                {!transactions?.filter(tx => ['bet_placed', 'bet_won', 'bet_lost', 'refund'].includes(tx.type)).length ? (
                  <p className="text-center text-muted-foreground py-8">No bet transactions yet</p>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.filter(tx => ['bet_placed', 'bet_won', 'bet_lost', 'refund'].includes(tx.type)).map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getTransactionIcon(tx.type)}
                                <span className="capitalize">{tx.type.replace('_', ' ')}</span>
                              </div>
                            </TableCell>
                            <TableCell>{format(new Date(tx.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                            <TableCell>
                              <span className={tx.amount >= 0 ? 'text-green-500' : 'text-red-500'}>
                                {tx.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                              </span>
                            </TableCell>
                            <TableCell>{getStatusBadge(tx.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default Wallet;
