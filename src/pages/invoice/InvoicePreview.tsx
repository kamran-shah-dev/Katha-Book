import ExportInvoiceTemplate from "@/components/invoices/ExportInvoiceTemplate";

export default function InvoicePreviewPage() {
  const storedData = localStorage.getItem("invoiceData");
  const entry = storedData ? JSON.parse(storedData) : null;

  if (!entry) return <p>No invoice data found.</p>;

  return <ExportInvoiceTemplate entry={entry} />;
}
