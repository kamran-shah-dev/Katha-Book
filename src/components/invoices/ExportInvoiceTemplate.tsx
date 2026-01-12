export default function ExportInvoiceTemplate({ entry }) {
  return (
    <div className="invoice-wrapper">

      <div className="header">
        <img src="/company_banner.jpeg" className="banner" />
      </div>

      <table className="info-table">
        <tr>
          <td>Invoice No: {entry.invoice_no}</td>
          <td>Export Invoice</td>
          <td>GD No: {entry.gd_no}</td>
        </tr>
        <tr>
          <td>M/S: {entry.account}</td>
          <td></td>
          <td>Date: {entry.entry_date}</td>
        </tr>
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

          {/* Vehicle row */}
          <tr>
            <td></td>
            <td colSpan={6}>
              <b>Vehicle Numbers:</b><br />
              {entry.vehicle_numbers}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="footer">
        <div className="address">
          Office No.15 Third Floor, Muslim Plaza, Jamaluddin Afghani Road Quetta<br/>
          Cell No.0092-331-8377-2293
        </div>
        <div className="totals">
          <p>Total: {entry.amount}</p>
          <p>Net Pay: {entry.amount}</p>
        </div>
      </div>

      <div className="actions">
        <button onClick={() => window.print()}>Print</button>
        <button onClick={exportPDF}>Export PDF</button>
      </div>
    </div>
  );
}
