import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Plus, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit2, 
  Trash2, 
  X, 
  AlertTriangle,
  Building,
  PackageCheck
} from 'lucide-react';

const Suppliers = () => {
  const { token, user, API_URL } = useAuth();
  const { addToast } = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: ''
  });

  const [formError, setFormError] = useState('');

  const headers = { 'Authorization': `Bearer ${token}` };

  const loadSuppliersAndProducts = async () => {
    try {
      const [supRes, prodRes] = await Promise.all([
        fetch(`${API_URL}/suppliers`, { headers }),
        fetch(`${API_URL}/products`, { headers })
      ]);

      const sups = await supRes.json();
      const prods = await prodRes.json();

      setSuppliers(sups);
      setProducts(prods);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadSuppliersAndProducts();
    }
  }, [token, API_URL]);

  const handleOpenAddModal = () => {
    setEditMode(false);
    setFormError('');
    setFormData({
      name: '',
      contactName: '',
      email: '',
      phone: '',
      address: ''
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (supplier) => {
    setEditMode(true);
    setFormError('');
    setSelectedSupplierId(supplier._id);
    setFormData({
      name: supplier.name,
      contactName: supplier.contactName || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || ''
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name) {
      setFormError('Please provide a supplier name.');
      return;
    }

    try {
      const url = editMode 
        ? `${API_URL}/suppliers/${selectedSupplierId}` 
        : `${API_URL}/suppliers`;

      const method = editMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Operation failed');
      }

      setModalOpen(false);
      loadSuppliersAndProducts();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDeleteSupplier = async (id) => {
    if (user.role !== 'admin') {
      addToast('Access Denied: Only administrators can delete supplier profiles.', 'error');
      return;
    }

    if (window.confirm('Are you sure you want to permanently delete this supplier? All catalog products linked to this supplier will be updated to "Not Linked".')) {
      try {
        const response = await fetch(`${API_URL}/suppliers/${id}`, {
          method: 'DELETE',
          headers
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Operation failed');
        }

        addToast('Supplier profile removed.', 'success');
        loadSuppliersAndProducts();
      } catch (err) {
        addToast(err.message, 'error');
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in p-8 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-primaryText">Distributor Directory</h3>
          <p className="text-sm text-secondaryText">Manage supplier contact details, locate addresses, and inspect link catalogs.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="glass-btn-primary flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm cursor-pointer shrink-0"
        >
          <Plus className="h-5 w-5" />
          Add Supplier Profile
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-accentBlue border-t-transparent mb-4"></div>
          <p className="font-semibold text-secondaryText animate-pulse-subtle">Syncing distributor database...</p>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="glass-panel rounded-3xl p-20 text-center border border-glassBorder max-w-xl mx-auto">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-secondaryText mb-4 border border-glassBorder mx-auto">
            <Building className="h-6 w-6" />
          </div>
          <h5 className="font-semibold text-sm text-primaryText">No Suppliers Registered</h5>
          <p className="text-xs text-secondaryText mt-1 mb-6">Create supplier directories to connect them to catalog products and simplify historical order audits.</p>
          <button
            onClick={handleOpenAddModal}
            className="glass-btn-primary px-5 py-2.5 rounded-xl text-xs cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add First Supplier
          </button>
        </div>
      ) : (
        /* Supplier Grid */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((supplier) => {
            const linkedProductsCount = products.filter(p => p.supplierId === supplier._id).length;

            return (
              <div 
                key={supplier._id} 
                className="glass-panel glass-panel-hover rounded-3xl p-6 border border-glassBorder flex flex-col justify-between h-72 relative"
              >
                {/* Header title */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-extrabold text-lg text-primaryText truncate">{supplier.name}</h4>
                    <span className="shrink-0 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-accentTeal/15 text-accentTeal px-2 py-0.5 rounded border border-accentTeal/20">
                      <PackageCheck className="h-3 w-3 shrink-0" />
                      {linkedProductsCount} SKUs
                    </span>
                  </div>
                  {supplier.contactName && (
                    <p className="text-xs text-secondaryText font-medium flex items-center gap-1.5 pt-0.5">
                      <User className="h-3.5 w-3.5 text-accentPurple shrink-0" />
                      Rep: {supplier.contactName}
                    </p>
                  )}
                </div>

                {/* Details Section */}
                <div className="space-y-2 py-4 border-t border-b border-glassBorder/50 my-4 text-xs font-semibold text-secondaryText">
                  {supplier.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="h-4 w-4 text-accentBlue shrink-0" />
                      <span className="truncate hover:text-primaryText transition-colors">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-accentTeal shrink-0" />
                      <span className="hover:text-primaryText transition-colors">{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="h-4 w-4 text-accentAmber shrink-0" />
                      <span className="truncate hover:text-primaryText transition-colors">{supplier.address}</span>
                    </div>
                  )}
                </div>

                {/* Actions drawer */}
                <div className="flex gap-3 justify-end pt-1">
                  <button
                    onClick={() => handleOpenEditModal(supplier)}
                    className="flex-1 py-2 text-xs font-bold rounded-xl bg-accentBlue/10 hover:bg-accentBlue/25 border border-accentBlue/20 text-accentBlue flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Modify Details
                  </button>
                  {user.role === 'admin' && (
                    <button
                      onClick={() => handleDeleteSupplier(supplier._id)}
                      className="px-3 py-2 rounded-xl bg-accentRose/10 hover:bg-accentRose/25 border border-accentRose/20 text-accentRose transition-colors cursor-pointer"
                      title="Remove Profile"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CRUD Supplier Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-glassBorder p-6 shadow-2xl relative animate-slide-up">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-glassBorder text-secondaryText hover:text-primaryText transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <h4 className="text-xl font-bold tracking-tight text-primaryText mb-1">
              {editMode ? 'Edit Supplier Profile' : 'Register New Supplier'}
            </h4>
            <p className="text-xs text-secondaryText mb-5">Create active logistics distributor points for catalog entries.</p>

            {formError && (
              <div className="flex items-center gap-3 rounded-xl bg-rose-950/20 border border-rose-900/30 p-4 mb-6 text-xs text-rose-400">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Supplier Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-secondaryText tracking-wider uppercase">Supplier / Brand Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                  placeholder="Global Tech Distributor Ltd"
                  required
                />
              </div>

              {/* Rep Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-secondaryText tracking-wider uppercase">Contact Representative</label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                  placeholder="Jane Smith"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-secondaryText tracking-wider uppercase">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                  placeholder="orders@globaltech.com"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-secondaryText tracking-wider uppercase">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                  placeholder="+1 (555) 019-2834"
                />
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-secondaryText tracking-wider uppercase">Warehouse / Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                  placeholder="Building 4, Sector 12, Industrial Area"
                />
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 rounded-xl glass-btn-secondary text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl glass-btn-primary text-sm font-bold cursor-pointer"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
