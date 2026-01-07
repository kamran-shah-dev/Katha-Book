import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AccountsEntry from "./pages/accounts/AccountsEntry";
import CashbookEntry from "./pages/cashbook/CashbookEntry";
import GoodsReceivedEntry from "./pages/goods-received/GoodsReceivedEntry";
import ExportEntry from "./pages/export/ExportEntry";
import InvoiceEntry from "./pages/invoice/InvoiceEntry";
import ProductsPage from "./pages/utility/ProductsPage";
import VehiclesPage from "./pages/utility/VehiclesPage";
import DataImport from "./pages/utility/DataImport";
import LedgerReport from "./pages/reports/LedgerReport";
import AccountsBalanceReport from "./pages/reports/AccountsBalanceReport";
import SubHeadBalanceReport from "./pages/reports/SubHeadBalanceReport";
import CashbookReport from "./pages/reports/CashbookReport";
import GoodsReceivedReport from "./pages/reports/GoodsReceivedReport";
import InvoiceSearch from "./pages/reports/InvoiceSearch";
import VehicleWiseReport from "./pages/reports/VehicleWiseReport";
import GDSearch from "./pages/reports/GDSearch";
import ProductReport from "./pages/reports/ProductReport";
import CreditDebitReport from "./pages/reports/CreditDebitReport";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedPage = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute><MainLayout>{children}</MainLayout></ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
            <Route path="/accounts" element={<ProtectedPage><AccountsEntry /></ProtectedPage>} />
            <Route path="/cashbook" element={<ProtectedPage><CashbookEntry /></ProtectedPage>} />
            <Route path="/goods-received" element={<ProtectedPage><GoodsReceivedEntry /></ProtectedPage>} />
            <Route path="/export" element={<ProtectedPage><ExportEntry /></ProtectedPage>} />
            <Route path="/invoice" element={<ProtectedPage><InvoiceEntry /></ProtectedPage>} />
            <Route path="/utility/products" element={<ProtectedPage><ProductsPage /></ProtectedPage>} />
            <Route path="/utility/vehicles" element={<ProtectedPage><VehiclesPage /></ProtectedPage>} />
            <Route path="/utility/import" element={<ProtectedPage><DataImport /></ProtectedPage>} />
            <Route path="/reports/ledger" element={<ProtectedPage><LedgerReport /></ProtectedPage>} />
            <Route path="/reports/accounts-balance" element={<ProtectedPage><AccountsBalanceReport /></ProtectedPage>} />
            <Route path="/reports/sub-head-balance" element={<ProtectedPage><SubHeadBalanceReport /></ProtectedPage>} />
            <Route path="/reports/cashbook" element={<ProtectedPage><CashbookReport /></ProtectedPage>} />
            <Route path="/reports/goods-received" element={<ProtectedPage><GoodsReceivedReport /></ProtectedPage>} />
            <Route path="/reports/invoice-search" element={<ProtectedPage><InvoiceSearch /></ProtectedPage>} />
            <Route path="/reports/vehicle-wise" element={<ProtectedPage><VehicleWiseReport /></ProtectedPage>} />
            <Route path="/reports/gd-search" element={<ProtectedPage><GDSearch /></ProtectedPage>} />
            <Route path="/reports/product" element={<ProtectedPage><ProductReport /></ProtectedPage>} />
            <Route path="/reports/credit-debit" element={<ProtectedPage><CreditDebitReport /></ProtectedPage>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
