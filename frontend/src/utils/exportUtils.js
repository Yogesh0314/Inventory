import * as XLSX from 'xlsx';

/**
 * Utility to convert an array of objects to Excel format and trigger a browser download.
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Desired filename (without extension)
 */
export const exportToExcel = (data, filename) => {
  if (!data || data.length === 0) {
    console.error('No data available to export');
    return;
  }

  // Create worksheet from JSON data
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Create a new workbook and append the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Data");

  // Generate date string for filename
  const dateStr = new Date().toISOString().split('T')[0];
  
  // Trigger download
  XLSX.writeFile(workbook, `${filename}_${dateStr}.xlsx`);
};
