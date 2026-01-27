import { useEffect, useState } from 'react';
import api from '../api/api';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

interface Supplier {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  balance: number;
  active: boolean;
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      phone: formData.get('phone') || undefined,
      email: formData.get('email') || undefined,
      address: formData.get('address') || undefined,
      notes: formData.get('notes') || undefined,
    };

    try {
      if (editingSupplier) {
        await api.patch(`/suppliers/${editingSupplier._id}`, data);
      } else {
        await api.post('/suppliers', data);
      }
      setShowModal(false);
      setEditingSupplier(null);
      fetchSuppliers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Xəta baş verdi');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Təchizatçını silmək istədiyinizə əminsiniz?')) return;
    try {
      await api.delete(`/suppliers/${id}`);
      fetchSuppliers();
    } catch (error) {
      alert('Xəta baş verdi');
    }
  };

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary">Təchizatçılar</h1>
        <button
          onClick={() => {
            setEditingSupplier(null);
            setShowModal(true);
          }}
          className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-opacity-90"
        >
          <Plus className="w-5 h-5" />
          Yeni Təchizatçı
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Axtarış..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Yüklənir...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-secondary text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Ad</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Telefon</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Balans</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{supplier.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{supplier.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{supplier.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={supplier.balance < 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                      {supplier.balance.toFixed(2)} AZN
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => {
                        setEditingSupplier(supplier);
                        setShowModal(true);
                      }}
                      className="text-primary hover:text-opacity-80 mr-3"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(supplier._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-secondary mb-4">
              {editingSupplier ? 'Təchizatçını Redaktə Et' : 'Yeni Təchizatçı'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ad *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingSupplier?.name}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefon</label>
                  <input
                    type="text"
                    name="phone"
                    defaultValue={editingSupplier?.phone}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingSupplier?.email}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ünvan</label>
                  <input
                    type="text"
                    name="address"
                    defaultValue={editingSupplier?.address}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Qeydlər</label>
                  <textarea
                    name="notes"
                    rows={3}
                    defaultValue={editingSupplier?.notes}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
                >
                  Saxla
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSupplier(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Ləğv et
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

