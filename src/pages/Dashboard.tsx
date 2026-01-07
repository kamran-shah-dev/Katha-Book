import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  BookOpen, 
  Package, 
  FileText, 
  Truck,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface DashboardStats {
  totalAccounts: number;
  totalProducts: number;
  totalGoodsReceived: number;
  totalExports: number;
  totalInvoices: number;
  cashInHand: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAccounts: 0,
    totalProducts: 0,
    totalGoodsReceived: 0,
    totalExports: 0,
    totalInvoices: 0,
    cashInHand: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [
          accountsResult,
          productsResult,
          goodsResult,
          exportsResult,
          invoicesResult,
          cashbookResult,
        ] = await Promise.all([
          supabase.from('accounts').select('id', { count: 'exact', head: true }),
          supabase.from('products').select('id', { count: 'exact', head: true }),
          supabase.from('goods_received').select('id', { count: 'exact', head: true }).eq('is_deleted', false),
          supabase.from('export_entries').select('id', { count: 'exact', head: true }).eq('is_deleted', false),
          supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('is_deleted', false),
          supabase.from('cashbook_entries').select('pay_status, amount').eq('is_deleted', false),
        ]);

        let cashInHand = 0;
        if (cashbookResult.data) {
          cashbookResult.data.forEach((entry) => {
            if (entry.pay_status === 'CREDIT') {
              cashInHand += Number(entry.amount);
            } else {
              cashInHand -= Number(entry.amount);
            }
          });
        }

        setStats({
          totalAccounts: accountsResult.count || 0,
          totalProducts: productsResult.count || 0,
          totalGoodsReceived: goodsResult.count || 0,
          totalExports: exportsResult.count || 0,
          totalInvoices: invoicesResult.count || 0,
          cashInHand,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your Import/Export Accounting System</p>
      </div>

      {/* Cash In Hand Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Cash In Hand
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {stats.cashInHand >= 0 ? (
              <ArrowUpRight className="h-6 w-6 text-green-600" />
            ) : (
              <ArrowDownRight className="h-6 w-6 text-destructive" />
            )}
            <span className={`text-3xl font-bold ${stats.cashInHand >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              Rs. {Math.abs(stats.cashInHand).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <Link to="/cashbook" className="text-sm text-primary hover:underline mt-2 inline-block">
            View Cashbook →
          </Link>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card) => (
          <Link key={card.title} to={card.link}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div> */}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-6">
            <Link 
              to="/accounts" 
              className="p-3 text-center rounded-md border border-border hover:bg-muted transition-colors"
            >
              <Users className="h-6 w-6 mx-auto mb-1 text-blue-600" />
              <span className="text-sm font-medium">New Account</span>
            </Link>
            <Link 
              to="/cashbook" 
              className="p-3 text-center rounded-md border border-border hover:bg-muted transition-colors"
            >
              <BookOpen className="h-6 w-6 mx-auto mb-1 text-green-600" />
              <span className="text-sm font-medium">Cashbook Entry</span>
            </Link>
            <Link 
              to="/goods-received" 
              className="p-3 text-center rounded-md border border-border hover:bg-muted transition-colors"
            >
              <Truck className="h-6 w-6 mx-auto mb-1 text-orange-600" />
              <span className="text-sm font-medium">Goods Received</span>
            </Link>
            <Link 
              to="/export" 
              className="p-3 text-center rounded-md border border-border hover:bg-muted transition-colors"
            >
              <ArrowUpRight className="h-6 w-6 mx-auto mb-1 text-purple-600" />
              <span className="text-sm font-medium">Export Entry</span>
            </Link>
            <Link 
              to="/invoice" 
              className="p-3 text-center rounded-md border border-border hover:bg-muted transition-colors"
            >
              <FileText className="h-6 w-6 mx-auto mb-1 text-pink-600" />
              <span className="text-sm font-medium">New Invoice</span>
            </Link>
            <Link 
              to="/reports/ledger" 
              className="p-3 text-center rounded-md border border-border hover:bg-muted transition-colors"
            >
              <BookOpen className="h-6 w-6 mx-auto mb-1 text-cyan-600" />
              <span className="text-sm font-medium">Ledger Report</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
