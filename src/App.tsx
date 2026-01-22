import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import InvoicePreview from "@/pages/import/invoice-preview";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AccountsEntry from "./pages/accounts/AccountsEntry";
import CashbookEntry from "./pages/cashbook/CashbookEntry";
import GoodsReceivedEntry from "./pages/import/Invoices";
// import ExportEntry from "./pages/export/ExportEntry";
// import DataImport from "./pages/utility/DataImport";
import LedgerReport from "./pages/reports/LedgerReport";
import CashbookReport  from "./pages/reports/CashbookReport";
import CreditDebitReport from "./pages/reports/CreditDebitReport";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedPage = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <MainLayout>{children}</MainLayout>
  </ProtectedRoute>
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

            {/* dashboard available at /dashboard */}
            <Route path="/dashboard" element={<ProtectedPage><Dashboard /></ProtectedPage>} />

            {/* existing home route also shows dashboard */}
            <Route path="/" element={<ProtectedPage><Dashboard /></ProtectedPage>} />

            <Route path="/accounts" element={<ProtectedPage><AccountsEntry /></ProtectedPage>} />
            <Route path="/cashbook" element={<ProtectedPage><CashbookEntry /></ProtectedPage>} />
            <Route path="/goods-received" element={<ProtectedPage><GoodsReceivedEntry /></ProtectedPage>} />
            {/* <Route path="/export" element={<ProtectedPage><ExportEntry /></ProtectedPage>} /> */}
            <Route path="/reports/cashbook" element={<ProtectedPage><CashbookReport /></ProtectedPage>} />
            <Route path="/invoice-preview" element={<InvoicePreview />} />
            {/* <Route path="/utility/import" element={<ProtectedPage><DataImport /></ProtectedPage>} /> */}
            <Route path="/reports/ledger" element={<ProtectedPage><LedgerReport /></ProtectedPage>} />
            <Route path="/reports/credit-debit" element={<ProtectedPage><CreditDebitReport /></ProtectedPage>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);


export default App;
