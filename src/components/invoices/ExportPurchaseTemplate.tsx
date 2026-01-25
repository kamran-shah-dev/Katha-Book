import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function ExportPurchaseTemplate({ entry }) {
  const exportPDF = async () => {
    const el = document.getElementById("purchase-wrapper");
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 3 });
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
    pdf.save(`purchase_${entry.purchase_no}.pdf`);
  };

  return (
    <div id="purchase-wrapper" style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>Purchase Invoice</h2>
      <p><strong>No:</strong> {entry.purchase_no}</p>
      <p><strong>Account:</strong> {entry.account_name}</p>
      <p><strong>Product:</strong> {entry.product}</p>

      <table border={1} width="100%" cellPadding={8}>
        <thead>
          <tr>
            <th>Qty</th>
            <th>Weight</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{entry.bags_qty}</td>
            <td>{entry.total_weight}</td>
            <td>{entry.rate_per_kg}</td>
            <td>{entry.amount}</td>
          </tr>
        </tbody>
      </table>

      <h3 style={{ textAlign: "right" }}>Total: Rs. {entry.amount}</h3>

      <button onClick={() => window.print()}>Print</button>
      <button onClick={exportPDF}>Export PDF</button>
    </div>
  );
}
