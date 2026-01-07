import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Accounts', path: '/accounts' },
  { label: 'Cashbook', path: '/cashbook' },
  { label: 'Goods Received', path: '/goods-received' },
  { label: 'Export', path: '/export' },
  { label: 'Invoice', path: '/invoice' },
];

const reportItems = [
  { label: 'Ledger Report', path: '/reports/ledger' },
  { label: 'Accounts Balance', path: '/reports/accounts-balance' },
  { label: 'Sub Head Balance', path: '/reports/sub-head-balance' },
  { label: 'Invoice Search', path: '/reports/invoice-search' },
  { label: 'Goods Received Report', path: '/reports/goods-received' },
  { label: 'Cashbook Report', path: '/reports/cashbook' },
  { label: 'Credit/Debit Report', path: '/reports/credit-debit' },
  { label: 'Vehicle Wise Report', path: '/reports/vehicle-wise' },
  { label: 'GD No Search', path: '/reports/gd-search' },
  { label: 'Product Report', path: '/reports/product' },
];

const utilityItems = [
  { label: 'Products', path: '/utility/products' },
  { label: 'Vehicles', path: '/utility/vehicles' },
  { label: 'Data Import', path: '/utility/import' },
];

export default function TopMenuBar() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <header className="bg-card border-b border-border">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-1">
          <Link 
            to="/" 
            className="font-bold text-lg text-primary mr-4"
          >
            Katha Book
          </Link>
          
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                location.pathname === item.path
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'
              )}
            >
              {item.label}
            </Link>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={location.pathname.startsWith('/reports') ? 'default' : 'ghost'} 
                size="sm"
                className="gap-1"
              >
                Reports <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {reportItems.map((item) => (
                <DropdownMenuItem key={item.path} asChild>
                  <Link to={item.path} className="w-full cursor-pointer">
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={location.pathname.startsWith('/utility') ? 'default' : 'ghost'} 
                size="sm"
                className="gap-1"
              >
                Utility <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {utilityItems.map((item) => (
                <DropdownMenuItem key={item.path} asChild>
                  <Link to={item.path} className="w-full cursor-pointer">
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <User className="h-4 w-4" />
            {user?.email}
          </span>
          <Button variant="outline" size="sm" onClick={signOut} className="gap-1">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
