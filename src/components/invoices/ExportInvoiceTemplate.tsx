import React from 'react';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
    <div style={{
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      background: 'white',
      padding: '20px'
    }}>
      <div id="invoice-wrapper" style={{
        width: '210mm',
        background: 'white',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        border: '1px solid #000'
      }}>
        
        {/* Header Section with Grey Background */}
        <div style={{
          background: '#d3d3d3',
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '3px solid #000'
        }}>
          {/* Logo Section */}
          <div>
            <img 
              src="/logo.jpeg" 
              alt="Company Logo" 
              style={{
                height: '120px',
                width: 'auto',
                mixBlendMode: 'multiply'
              }}
            />
          </div>

          {/* Company Name */}
          <div style={{
            flex: 1,
            textAlign: 'center',
            color: 'black',
            marginLeft: '20px'
          }}>
            <h1 style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: 'bold',
              letterSpacing: '1px'
            }}>
              HAJI ABDUL HADI & HAJI SHER ALI
            </h1>
            <p style={{
              margin: '5px 0 0 0',
              fontSize: '16px',
              letterSpacing: '3px',
              fontWeight: '500'
            }}>
              TRADING COMPANY
            </p>
          </div>

          {/* Contact Info */}
          <div style={{
            color: 'black',
            textAlign: 'right',
            fontSize: '13px',
            lineHeight: '1.6',
            minWidth: '180px'
          }}>
            <div>sher_ali333@yahoo.com</div>
            <div>+92-081-2826518</div>
            <div>+92-081-2837919</div>
            <div>+92-081-2835099</div>
          </div>
        </div>

        <hr style={{
          border: 'none',
          borderTop: '2px solid #000',
          margin: 0
        }}/>

        {/* Print and Export PDF Buttons */}
        <div style={{
          textAlign: 'center',
          padding: '20px 0',
          display: 'flex',
          justifyContent: 'center',
          gap: '15px'
        }} className="no-print">
          <button onClick={() => window.print()} style={{
            background: '#d3d3d3',
            color: 'black',
            border: '2px solid #999',
            borderRadius: '8px',
            padding: '10px 40px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            Print
          </button>
          <button onClick={exportPDF} style={{
            background: '#d3d3d3',
            color: 'black',
            border: '2px solid #999',
            borderRadius: '8px',
            padding: '10px 40px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            Export PDF
          </button>
        </div>

        {/* Invoice Info Section */}
        <div style={{
          padding: '0 20px',
          marginBottom: '15px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '10px',
            fontSize: '15px',
            fontWeight: 'bold'
          }}>
            <div>Invoice No: {entry.invoice_no?.replace('IMP-', '').replace('EXP-', '')}</div>
            <div>{entry.grn_no ? `GRN No: ${entry.grn_no}` : `GD No: ${entry.gd_no}`}</div>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '15px',
            fontWeight: 'bold'
          }}>
            <div>M/S. {entry.account_name || entry.account}</div>
            <div>Date: {entry.entry_date}</div>
          </div>
        </div>

        {/* Product Table */}
        <div style={{ padding: '0 20px 20px 20px' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid #000'
          }}>
            <thead>
              <tr style={{
                background: '#d3d3d3',
                color: 'black'
              }}>
                <th style={{ border: '1px solid #000', padding: '10px', fontWeight: 'bold' }}>S.No</th>
                <th style={{ border: '1px solid #000', padding: '10px', fontWeight: 'bold' }}>
                  {entry.type === "import" ? "Products" : "Products"}
                </th>
                <th style={{ border: '1px solid #000', padding: '10px', fontWeight: 'bold' }}>Bags Qty</th>
                <th style={{ border: '1px solid #000', padding: '10px', fontWeight: 'bold' }}>Weight<br/>Per Bag</th>
                <th style={{ border: '1px solid #000', padding: '10px', fontWeight: 'bold' }}>Total<br/>Weight</th>
                <th style={{ border: '1px solid #000', padding: '10px', fontWeight: 'bold' }}>Rate Per<br/>KG</th>
                <th style={{ border: '1px solid #000', padding: '10px', fontWeight: 'bold' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', verticalAlign: 'top', height: '150px' }}>01.</td>
                <td style={{ border: '1px solid #000', padding: '10px', verticalAlign: 'top', height: '150px' }}>
                  {entry.type === "import" ? entry.supplier : entry.product}
                </td>
                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', verticalAlign: 'top', height: '150px' }}>{entry.bags_qty}</td>
                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', verticalAlign: 'top', height: '150px' }}>{entry.weight_per_bag}</td>
                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', verticalAlign: 'top', height: '150px' }}>{entry.total_weight}</td>
                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', verticalAlign: 'top', height: '150px' }}>{entry.rate_per_kg}</td>
                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', verticalAlign: 'top', height: '150px' }}>{entry.amount}</td>
              </tr>
              
              {/* Adjustments Row - NEW */}
              <tr style={{ background: '#f5f5f5' }}>
                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}><strong>Bardana:</strong> {entry.bardana || 0}</td>
                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}><strong>Mazdoori:</strong> {entry.mazdoori || 0}</td>
                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}><strong>Munshiana:</strong> {entry.munshiana || 0}</td>
                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}><strong>Charsadna:</strong> {entry.charsadna || 0}</td>  
                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}><strong>Walai:</strong> {entry.walai || 0}</td>
                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}><strong>Tol:</strong> {entry.tol || 0}</td>
                
                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                  {(Number(entry.bardana || 0) + Number(entry.mazdoori || 0) + Number(entry.munshiana || 0) + 
                    Number(entry.charsadna || 0) + Number(entry.walai || 0) + Number(entry.tol || 0)).toFixed(2)}
                </td>
              </tr>

              {/* Vehicle Numbers Row */}
              <tr>
                <td style={{ border: '1px solid #000', padding: '10px' }}></td>
                <td colSpan={6} style={{ border: '1px solid #000', padding: '10px', textAlign: 'left', minHeight: '100px' }}>
                  <strong>Vehicle Numbers:-</strong><br/>
                  {entry.vehicle_numbers || 'N/A'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer with Customer Address and Totals */}
        <div style={{
          padding: '0 20px 20px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '20px'
        }}>
          {/* Left side - Customer Address and Phone */}
          <div style={{
            flex: 1,
            border: '1px solid #000',
            padding: '10px',
            fontSize: '13px',
            lineHeight: '1.6'
          }}>
            Office No.15 Third Floor, Muslim Plaz, Jamaluddin<br/>
            Afghani Road Quetta.<br/>
            Cell No. {entry.phone_number || entry.contact || '0092-331-8377293'}
          </div>

          {/* Right side - Totals */}
          <div style={{
            width: '250px',
            border: '1px solid #000'
          }}>
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #000'
            }}>
              <div style={{
                flex: 1,
                padding: '10px',
                borderRight: '1px solid #000',
                fontWeight: 'bold'
              }}>
                Total:
              </div>
              <div style={{
                flex: 1,
                padding: '10px',
                textAlign: 'right',
                fontWeight: 'bold'
              }}>
                {entry.amount}
              </div>
            </div>
            <div style={{
              display: 'flex'
            }}>
              <div style={{
                flex: 1,
                padding: '10px',
                borderRight: '1px solid #000',
                fontWeight: 'bold'
              }}>
                Net Pay:
              </div>
              <div style={{
                flex: 1,
                padding: '10px',
                textAlign: 'right',
                fontWeight: 'bold'
              }}>
                {entry.amount}
              </div>
            </div>
          </div>
        </div>

        {/* Page Number */}
        <div style={{
          padding: '0 20px 10px 20px',
          fontSize: '12px',
          textAlign: 'center'
        }}>
          Total Page No.: 1
        </div>
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
}