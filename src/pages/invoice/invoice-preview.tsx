import ExportInvoiceTemplate from "@/components/invoices/ExportInvoiceTemplate";

export default function InvoicePreview() {
  const stored = localStorage.getItem("invoiceData");
  const entry = stored ? JSON.parse(stored) : null;

  if (!entry) return <div>No invoice data found</div>;

  // Convert Firestore Timestamp → readable date
  if (entry.entry_date && typeof entry.entry_date === "object" && entry.entry_date.seconds) {
    entry.entry_date = new Date(entry.entry_date.seconds * 1000).toISOString().split("T")[0];
  }

  return <ExportInvoiceTemplate entry={entry} />;
}
