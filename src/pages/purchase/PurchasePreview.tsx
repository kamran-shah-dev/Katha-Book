import ExportPurchaseTemplate from "@/components/invoices/ExportPurchaseTemplate";

export default function PurchasePreview() {
  const stored = localStorage.getItem("purchaseData");
  const entry = stored ? JSON.parse(stored) : null;

  if (!entry) return <div>No purchase data</div>;

  return <ExportPurchaseTemplate entry={entry} />;
}
