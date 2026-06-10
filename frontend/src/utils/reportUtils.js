import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Generates a professional PDF Inventory Report
 * @param {Array} products 
 */
export const generateInventoryReport = (products) => {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.text('Inventory Status Report', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${date}`, 14, 30);
  doc.text('Smart Inventory Management System', 14, 35);

  // Stats Summary
  const totalItems = products.length;
  const totalStock = products.reduce((acc, p) => acc + (p.quantity || 0), 0);
  const totalValue = products.reduce((acc, p) => acc + ((p.price || 0) * (p.quantity || 0)), 0);

  doc.setFontSize(12);
  doc.setTextColor(40);
  doc.text('Summary Statistics:', 14, 48);
  doc.setFontSize(10);
  doc.text(`Total Active Products: ${totalItems}`, 14, 55);
  doc.text(`Total Stock Quantity: ${totalStock} units`, 14, 60);
  doc.text(`Estimated Catalog Valuation: $${totalValue.toLocaleString()}`, 14, 65);

  // Table
  const tableColumn = ["Name", "SKU", "Category", "Price", "Qty", "Status"];
  const tableRows = products.map(p => [
    p.name,
    p.sku,
    p.category || 'N/A',
    `$${p.price.toFixed(2)}`,
    p.quantity,
    p.quantity <= (p.minLimit || 5) ? 'LOW STOCK' : 'Healthy'
  ]);

  doc.autoTable({
    startY: 75,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] }, // accentBlue
    styles: { fontSize: 8 },
  });

  doc.save(`Inventory_Report_${date.replace(/\//g, '-')}.pdf`);
};

/**
 * Generates a professional PDF Transaction Ledger Report
 * @param {Array} transactions 
 */
export const generateTransactionReport = (transactions) => {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.text('Transaction Audit Ledger', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${date}`, 14, 30);
  doc.text('Smart Inventory Management System', 14, 35);

  // Stats
  const purchases = transactions.filter(t => t.type === 'purchase');
  const sales = transactions.filter(t => t.type === 'sale');
  const purchaseVal = purchases.reduce((acc, t) => acc + (t.price * t.quantity), 0);
  const salesVal = sales.reduce((acc, t) => acc + (t.price * t.quantity), 0);

  doc.setFontSize(12);
  doc.setTextColor(40);
  doc.text('Audit Summary:', 14, 48);
  doc.setFontSize(10);
  doc.text(`Total Transactions Scoped: ${transactions.length}`, 14, 55);
  doc.text(`Net Purchase Outflow: $${purchaseVal.toLocaleString()}`, 14, 60);
  doc.text(`Net Sales Inflow: $${salesVal.toLocaleString()}`, 14, 65);

  // Table
  const tableColumn = ["Type", "Product", "Qty", "Price", "Total", "Date"];
  const tableRows = transactions.map(t => [
    t.type.toUpperCase(),
    t.productName,
    t.quantity,
    `$${t.price.toFixed(2)}`,
    `$${(t.price * t.quantity).toFixed(2)}`,
    new Date(t.date || t.createdAt).toLocaleDateString()
  ]);

  doc.autoTable({
    startY: 75,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [40, 40, 40] },
    styles: { fontSize: 8 },
  });

  doc.save(`Transaction_Ledger_${date.replace(/\//g, '-')}.pdf`);
};
