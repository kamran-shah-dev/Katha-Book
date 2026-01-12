import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./invoice.css"


export default function ExportInvoiceTemplate({ entry }) {

  const exportPDF = async () => {
    const invoiceElement = document.getElementById("invoice-wrapper");
    if (!invoiceElement) return;

    const canvas = await html2canvas(invoiceElement, {
      scale: 3,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`invoice_${entry.invoice_no}.pdf`);
  };

  return (
    <div className="invoice-container">

      <div id="invoice-wrapper" className="invoice-wrapper">

        <img src="/company_banner.jpeg" className="banner" />

         <div className="actions">
        <button onClick={() => window.print()}>Print</button>
        <button onClick={exportPDF}>Export PDF</button>
      </div>

        <table className="info-table">
          <tbody>
            <tr>
              <td>Invoice No: {entry.invoice_no}</td>
              <td style={{ textAlign: "center" }}><b>Export Invoice</b></td>
              <td>GD No: {entry.gd_no}</td>
            </tr>
            <tr>
              <td>M/S: {entry.account}</td>
              <td></td>
              <td>Date: {entry.entry_date}</td>
            </tr>
          </tbody>
        </table>

        <table className="product-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Products</th>
              <th>Bags Qty</th>
              <th>Weight Per Bag</th>
              <th>Total Weight</th>
              <th>Rate Per Kg</th>
              <th>Amount</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>01</td>
              <td>{entry.product}</td>
              <td>{entry.bags_qty}</td>
              <td>{entry.weight_per_bag}</td>
              <td>{entry.total_weight}</td>
              <td>{entry.rate_per_kg}</td>
              <td>{entry.amount}</td>
            </tr>

            <tr>
              <td></td>
              <td colSpan={6} style={{ textAlign: "left" }}>
                <b>Vehicle Numbers:</b><br />
                {entry.vehicle_numbers}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="footer">
          <div className="address">
            Office No.15 Third Floor, Muslim Plaza, Jamaluddin Afghani Road Quetta<br />
            Cell No.0092-331-8377-2293
          </div>

          <div className="totals">
            <p>Total: {entry.amount}</p>
            <p>Net Pay: {entry.amount}</p>
          </div>
        </div>

      </div>

     
    </div>
  );
}

