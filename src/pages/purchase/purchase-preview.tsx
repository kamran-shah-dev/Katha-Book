import ExportPurchaseTemplate from "@/components/invoices/ExportPurchaseTemplate";

export default function PurchasePreview() {
  const stored = localStorage.getItem("purchaseData");
  let entry = stored ? JSON.parse(stored) : null;

  if (!entry) return <div>No purchase data found</div>;

  // Convert Firestore Timestamp → readable date
  if (entry.entry_date && typeof entry.entry_date === "object" && entry.entry_date.seconds) {
    entry.entry_date = new Date(entry.entry_date.seconds * 1000).toISOString().split("T")[0];
  }

  return <ExportPurchaseTemplate entry={entry} />;
}