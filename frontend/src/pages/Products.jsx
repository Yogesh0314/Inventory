import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  AlertTriangle,
  Package,
  ArrowUpDown,
  FileSpreadsheet,
  FileDown,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { exportToExcel } from '../utils/exportUtils';
import { generateInventoryReport } from '../utils/reportUtils';
import SkeletonRow from '../components/SkeletonRow';
import Pagination from '../components/Pagination';

const Products = () => {
  const { token, user, API_URL } = useAuth();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);
  
  // Search & Filter State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  
  // Stock Adjust Modal State
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState('add');

  // Import Modal State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  // Form Fields State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    price: '',
    quantity: '',
    minLimit: '',
    supplierId: '',
    imageUrl: ''
  });

  const [formError, setFormError] = useState('');

  const headers = { 'Authorization': `Bearer ${token}` };

  // Fetch Products
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['products', search, categoryFilter, page],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/products?search=${search}&category=${categoryFilter}&page=${page}&limit=${limit}`,
        { headers }
      );
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    },
    keepPreviousData: true,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/suppliers`, { headers });
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    }
  });

  const products = data?.products || [];
  const totalPages = data?.totalPages || 0;

  const handleExportExcel = () => {
    const exportData = products.map(p => {
      const sup = suppliers.find(s => s._id === p.supplierId);
      return {
        name: p.name,
        sku: p.sku,
        category: p.category,
        price: p.price,
        quantity: p.quantity,
        minLimit: p.minLimit,
        supplier: sup ? sup.name : 'N/A'
      };
    });
    exportToExcel(exportData, 'Inventory_Catalog');
  };

  const handleExportPDF = () => generateInventoryReport(products);

  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    const formDataImport = new FormData();
    formDataImport.append('file', file);

    try {
      const response = await fetch(`${API_URL}/products/import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataImport
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || 'Import failed');

      addToast(resData.message, 'success');
      if (resData.errors) {
        console.warn('Import warnings:', resData.errors);
        addToast(`Imported with ${resData.errors.length} warnings. Check console.`, 'warning');
      }
      setImportModalOpen(false);
      refetch();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setImporting(false);
      e.target.value = null;
    }
  };

  const handleOpenAddModal = () => {
    setEditMode(false);
    setFormError('');
    setFormData({
      name: '',
      sku: '',
      description: '',
      category: '',
      price: '',
      quantity: '0',
      minLimit: '5',
      supplierId: suppliers[0]?._id || '',
      imageUrl: ''
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditMode(true);
    setFormError('');
    setSelectedProductId(product._id);
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      category: product.category || '',
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      minLimit: product.minLimit.toString(),
      supplierId: product.supplierId || '',
      imageUrl: product.imageUrl || ''
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const url = editMode ? `${API_URL}/products/${selectedProductId}` : `${API_URL}/products`;
      const method = editMode ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          quantity: Number(formData.quantity) || 0,
          minLimit: Number(formData.minLimit) || 5
        })
      });
      const resData = await response.json();
      if (!response.ok) {
        if (resData.errors) setFormError(resData.errors.map(e => e.message).join(', '));
        else throw new Error(resData.message || 'Operation failed');
        return;
      }
      setModalOpen(false);
      refetch();
      addToast(editMode ? 'Product updated' : 'Product registered', 'success');
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    const finalAmount = adjustType === 'add' ? Number(adjustAmount) : -Number(adjustAmount);
    try {
      const response = await fetch(`${API_URL}/products/${selectedProductId}/adjust-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ amount: finalAmount })
      });
      if (!response.ok) throw new Error('Adjustment failed');
      addToast('Stock adjusted', 'success');
      setAdjustModalOpen(false);
      refetch();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Permanently delete this product?')) {
      try {
        const response = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE', headers });
        if (!response.ok) throw new Error('Delete failed');
        addToast('Product removed', 'success');
        refetch();
      } catch (err) {
        addToast(err.message, 'error');
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in p-8 max-w-7xl mx-auto pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-primaryText">Product Catalog Management</h3>
          <p className="text-sm text-secondaryText">Manage physical inventory assets and visual catalog entries.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setImportModalOpen(true)}
            className="glass-btn-secondary flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm"
          >
            <Upload className="h-4 w-4" />
            Bulk Import
          </button>
          <button onClick={handleExportPDF} className="glass-btn-secondary flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm"><FileDown className="h-4 w-4" />PDF</button>
          <button onClick={handleExportExcel} className="glass-btn-secondary flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm border-emerald-500/20 text-emerald-400"><FileSpreadsheet className="h-4 w-4" />Excel</button>
          <button onClick={handleOpenAddModal} className="glass-btn-primary flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm"><Plus className="h-5 w-5" />New Product</button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-glassBorder flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-secondaryText"><Search className="h-4.5 w-4.5" /></span>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl glass-input text-sm"
            placeholder="Search catalog..."
          />
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-glassBorder overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-glassBorder bg-white/3">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-secondaryText w-16">Preview</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-secondaryText">Name & SKU</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-secondaryText">Price</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-secondaryText">Stock Level</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-secondaryText text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glassBorder">
              {isLoading ? (
                <SkeletonRow columns={5} />
              ) : products.length === 0 ? (
                <tr><td colSpan="5" className="py-20 text-center"><Package className="h-10 w-10 mx-auto mb-4 opacity-20" /><p className="text-secondaryText">Catalog empty</p></td></tr>
              ) : (
                products.map((item) => (
                  <tr key={item._id} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4">
                      <div className="h-12 w-12 rounded-lg bg-white/5 border border-glassBorder overflow-hidden flex items-center justify-center">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" onError={(e) => e.target.style.display='none'} />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-secondaryText opacity-30" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm text-primaryText">{item.name}</div>
                      <div className="text-[10px] text-accentBlue font-bold uppercase tracking-wider">{item.sku}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-extrabold text-primaryText">${item.price.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-black ${item.quantity <= (item.minLimit || 5) ? 'text-accentRose' : 'text-emerald-400'}`}>
                        {item.quantity} units
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setSelectedProductId(item._id); setAdjustAmount(''); setAdjustModalOpen(true); }} className="p-2 rounded-lg bg-white/5 border border-glassBorder hover:bg-white/10 text-secondaryText transition-all"><ArrowUpDown className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleOpenEditModal(item)} className="p-2 rounded-lg bg-accentBlue/10 border border-accentBlue/20 text-accentBlue hover:bg-accentBlue/20 transition-all"><Edit2 className="h-3.5 w-3.5" /></button>
                        {user.role === 'admin' && <button onClick={() => handleDeleteProduct(item._id)} className="p-2 rounded-lg bg-accentRose/10 border border-accentRose/20 text-accentRose hover:bg-accentRose/20 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* CRUD Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-xl rounded-3xl border border-glassBorder p-6 shadow-2xl relative animate-slide-up">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-secondaryText hover:text-primaryText"><X className="h-5 w-5" /></button>
            <h4 className="text-xl font-bold mb-6">{editMode ? 'Edit Product' : 'New Product'}</h4>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-secondaryText uppercase mb-1 block">Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" required />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-secondaryText uppercase mb-1 block">SKU</label>
                  <input type="text" value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" disabled={editMode} required />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-secondaryText uppercase mb-1 block">Price</label>
                  <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-secondaryText uppercase mb-1 block">Image URL (Optional)</label>
                  <input type="text" value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" placeholder="https://example.com/image.jpg" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-secondaryText uppercase mb-1 block">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2.5 rounded-xl glass-input text-sm h-20" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl glass-btn-secondary text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-xl glass-btn-primary text-sm font-bold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-sm rounded-3xl border border-glassBorder p-8 text-center shadow-2xl relative animate-slide-up">
            <button onClick={() => setImportModalOpen(false)} className="absolute top-4 right-4 text-secondaryText hover:text-primaryText"><X className="h-5 w-5" /></button>
            <div className="h-16 w-16 bg-accentBlue/10 text-accentBlue rounded-full flex items-center justify-center mx-auto mb-4 border border-accentBlue/20">
              <Upload className="h-8 w-8" />
            </div>
            <h4 className="text-xl font-bold mb-2">Bulk CSV Import</h4>
            <p className="text-xs text-secondaryText mb-6">Upload a CSV file with columns: name, sku, price, category, description, quantity, minLimit, imageUrl.</p>
            
            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImportCSV} className="hidden" />
            
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={importing}
              className="w-full py-4 rounded-2xl glass-btn-primary font-bold flex items-center justify-center gap-2"
            >
              {importing ? <div className="h-5 w-5 animate-spin border-2 border-white border-t-transparent rounded-full" /> : <FileSpreadsheet className="h-5 w-5" />}
              {importing ? 'Processing...' : 'Choose CSV File'}
            </button>
          </div>
        </div>
      )}

      {/* Stock Adjust Modal (Omitted but functional as before) */}
      {adjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-sm rounded-3xl border border-glassBorder p-6 shadow-2xl animate-slide-up relative">
             <button onClick={() => setAdjustModalOpen(false)} className="absolute top-4 right-4 text-secondaryText hover:text-primaryText"><X className="h-5 w-5" /></button>
             <h4 className="text-lg font-bold mb-4">Adjust Stock</h4>
             <div className="flex p-1 rounded-xl bg-darkBg/60 border border-glassBorder mb-4">
                <button onClick={() => setAdjustType('add')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${adjustType === 'add' ? 'bg-emerald-500/25 text-emerald-400' : 'text-secondaryText'}`}>Restock</button>
                <button onClick={() => setAdjustType('subtract')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${adjustType === 'subtract' ? 'bg-rose-500/25 text-rose-400' : 'text-secondaryText'}`}>Sale</button>
             </div>
             <input type="number" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} className="w-full px-4 py-3 rounded-xl glass-input text-center text-lg font-black mb-4" placeholder="Qty" />
             <button onClick={handleAdjustSubmit} className={`w-full py-3 rounded-xl font-bold text-white ${adjustType === 'add' ? 'bg-emerald-600' : 'bg-rose-600'}`}>Confirm</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
