import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  X, 
  AlertTriangle,
  History,
  TrendingDown,
  TrendingUp,
  FileText,
  FileSpreadsheet,
  FileDown
} from 'lucide-react';
import { exportToExcel } from '../utils/exportUtils';
import { generateTransactionReport } from '../utils/reportUtils';
import SkeletonRow from '../components/SkeletonRow';
import Pagination from '../components/Pagination';

const Transactions = () => {
  const { token, API_URL } = useAuth();
  const { addToast } = useToast();
  
  // Filtering & Pagination State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modals State
  const [modalOpen, setModalOpen] = useState(false);
  const [txType, setTxType] = useState('purchase'); // 'purchase' or 'sale'

  // Form State
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    price: '',
    notes: ''
  });

  const [formError, setFormError] = useState('');

  const headers = { 'Authorization': `Bearer ${token}` };

  // Fetch Transactions with TanStack Query
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['transactions', startDate, endDate, page],
    queryFn: async () => {
      let url = `${API_URL}/transactions?page=${page}&limit=${limit}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    },
    keepPreviousData: true
  });

  // Fetch Products for the modal dropdown
  const { data: productsData } = useQuery({
    queryKey: ['products-minimal'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/products?limit=1000`, { headers });
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    }
  });

  const transactions = data?.transactions || [];
  const totalPages = data?.totalPages || 0;
  const products = productsData?.products || [];

  const handleExportExcel = () => {
    const exportData = transactions.map(tx => ({
      type: tx.type,
      product: tx.productName,
      quantity: tx.quantity,
      unitPrice: tx.price,
      totalPrice: tx.quantity * tx.price,
      notes: tx.notes,
      date: new Date(tx.date || tx.createdAt).toLocaleString()
    }));

    exportToExcel(exportData, 'Transaction_Ledger');
  };

  const handleExportPDF = () => {
    generateTransactionReport(transactions);
  };

  const handleOpenModal = (type) => {
    setTxType(type);
    setFormError('');
    setFormData({
      productId: products[0]?._id || '',
      quantity: '',
      price: products[0]?.price.toString() || '',
      notes: ''
    });
    setModalOpen(true);
  };

  const handleProductChange = (e) => {
    const productId = e.target.value;
    const selectedProd = products.find(p => p._id === productId);
    setFormData({
      ...formData,
      productId,
      price: selectedProd ? selectedProd.price.toString() : ''
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const selectedProd = products.find(p => p._id === formData.productId);
    const quantityNum = Number(formData.quantity);

    if (txType === 'sale' && selectedProd && selectedProd.quantity < quantityNum) {
      setFormError(`Insufficient stock! Sales quantity: ${quantityNum}, Available catalog stock: ${selectedProd.quantity}`);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          type: txType,
          productId: formData.productId,
          quantity: quantityNum,
          price: Number(formData.price),
          notes: formData.notes
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        if (resData.errors) {
            setFormError(resData.errors.map(e => e.message).join(', '));
        } else {
            throw new Error(resData.message || 'Transaction logging failed');
        }
        return;
      }

      addToast('Transaction recorded successfully!', 'success');
      setModalOpen(false);
      refetch();
    } catch (err) {
      setFormError(err.message);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in p-8 max-w-7xl mx-auto pb-16">
      {/* Header Visual Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-primaryText">Audit Transactions Ledger</h3>
          <p className="text-sm text-secondaryText">Inspect physical order logs and generate movement reports.</p>
        </div>
        
        <div className="flex gap-3 shrink-0">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 rounded-xl glass-btn-secondary px-5 py-3 text-sm font-bold cursor-pointer"
            title="Download PDF Ledger"
          >
            <FileDown className="h-4.5 w-4.5" />
            PDF Ledger
          </button>
          
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 rounded-xl glass-btn-secondary px-5 py-3 text-sm font-bold cursor-pointer border-emerald-500/20 text-emerald-400"
            title="Export to Excel"
          >
            <FileSpreadsheet className="h-4.5 w-4.5" />
            Excel
          </button>
          
          <button
            onClick={() => handleOpenModal('purchase')}
            className="flex items-center gap-2 rounded-xl border border-emerald-900/30 bg-emerald-950/20 px-5 py-3 text-sm font-bold text-emerald-400 hover:bg-emerald-900/30 transition-all cursor-pointer"
          >
            <ArrowDownLeft className="h-4.5 w-4.5" />
            Restock
          </button>
          
          <button
            onClick={() => handleOpenModal('sale')}
            className="flex items-center gap-2 rounded-xl border border-accentRose/20 bg-accentRose/10 px-5 py-3 text-sm font-bold text-accentRose hover:bg-accentRose/20 transition-all cursor-pointer shadow-lg shadow-accentRose/10"
          >
            <ArrowUpRight className="h-4.5 w-4.5" />
            New Order
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-glassBorder flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-2 flex-1 w-full">
          <label className="text-xs font-bold text-secondaryText uppercase tracking-wider whitespace-nowrap">Filter Dates:</label>
          <div className="flex items-center gap-2 flex-1">
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="flex-1 glass-input rounded-xl px-3 py-2 text-xs cursor-pointer"
            />
            <span className="text-secondaryText">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="flex-1 glass-input rounded-xl px-3 py-2 text-xs cursor-pointer"
            />
          </div>
        </div>
        
        {(startDate || endDate) && (
          <button
            onClick={() => { setStartDate(''); setEndDate(''); setPage(1); }}
            className="text-xs font-bold text-accentRose hover:underline cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Ledger Table Panel */}
      <div className="glass-panel rounded-3xl border border-glassBorder overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-glassBorder bg-white/3">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-secondaryText">Type</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-secondaryText">Item</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-secondaryText">Volume</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-secondaryText">Net Total</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-secondaryText">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glassBorder">
              {isLoading ? (
                <>
                  <SkeletonRow columns={5} />
                  <SkeletonRow columns={5} />
                  <SkeletonRow columns={5} />
                  <SkeletonRow columns={5} />
                  <SkeletonRow columns={5} />
                </>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-secondaryText mb-4 border border-glassBorder">
                        <History className="h-6 w-6" />
                      </div>
                      <h5 className="font-semibold text-sm text-primaryText">Transaction Ledger Empty</h5>
                      <p className="text-xs text-secondaryText mt-1 max-sm">No inventory transactions logged yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const netValue = Number(tx.price) * Number(tx.quantity);
                  
                  return (
                    <tr key={tx._id} className="hover:bg-white/2 transition-colors">
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                          tx.type === 'purchase'
                            ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/40'
                            : 'bg-accentRose/15 text-accentRose border border-accentRose/25'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="font-bold text-sm text-primaryText leading-none">{tx.productName || 'Unknown Product'}</div>
                        <span className="text-[10px] text-secondaryText">{tx.notes}</span>
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-sm font-semibold text-primaryText">
                        {tx.quantity} units
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-sm font-black text-primaryText">
                        ${netValue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-xs text-secondaryText font-medium">
                        {new Date(tx.date || tx.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination 
          currentPage={page} 
          totalPages={totalPages} 
          onPageChange={(newPage) => setPage(newPage)} 
        />
      </div>

      {/* CREATE TRANSACTION MODAL (Omitted for brevity, keeping existing logic) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-glassBorder p-6 shadow-2xl relative animate-slide-up">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-glassBorder text-secondaryText hover:text-primaryText transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <h4 className="text-xl font-bold tracking-tight text-primaryText mb-1 flex items-center gap-2">
              {txType === 'purchase' ? 'Record Supplier Restock' : 'Record Customer Order'}
            </h4>
            <p className="text-xs text-secondaryText mb-5">Create audit ledger records to update inventory quantity levels.</p>

            {formError && (
              <div className="flex items-center gap-3 rounded-xl bg-rose-950/20 border border-rose-900/30 p-4 mb-6 text-xs text-rose-400">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-secondaryText tracking-wider uppercase">Select Product</label>
                <select
                  value={formData.productId}
                  onChange={handleProductChange}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm cursor-pointer"
                >
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.name} (Qty: {p.quantity})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-secondaryText tracking-wider uppercase">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-center"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-secondaryText tracking-wider uppercase">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-center"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-secondaryText tracking-wider uppercase">Notes</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                  placeholder="Audit memo notes..."
                />
              </div>

              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl glass-btn-secondary text-sm">Cancel</button>
                <button type="submit" className={`flex-1 py-3 rounded-xl font-bold text-sm text-white ${txType === 'purchase' ? 'bg-emerald-600' : 'bg-rose-600'}`}>Record Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
