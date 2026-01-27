import { useEffect, useState } from 'react';
import api from '../api/api';
import { Plus, Edit, Trash2, Warehouse, Store } from 'lucide-react';

interface Location {
  _id: string;
  name: string;
  type: 'warehouse' | 'store';
  address: string;
  phone?: string;
  active: boolean;
}

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations');
      setLocations(response.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      type: formData.get('type'),
      address: formData.get('address'),
      phone: formData.get('phone') || undefined,
    };

    try {
      if (editingLocation) {
        await api.patch(`/locations/${editingLocation._id}`, data);
      } else {
        await api.post('/locations', data);
      }
      setShowModal(false);
      setEditingLocation(null);
      fetchLocations();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Xəta baş verdi');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Lokasiyanı silmək istədiyinizə əminsiniz?')) return;
    try {
      await api.delete(`/locations/${id}`);
      fetchLocations();
    } catch (error) {
      alert('Xəta baş verdi');
    }
  };

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary">Lokasiyalar</h1>
        <button
          onClick={() => {
            setEditingLocation(null);
            setShowModal(true);
          }}
          className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-opacity-90"
        >
          <Plus className="w-5 h-5" />
          Yeni Lokasiya
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Yüklənir...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location) => (
            <div key={location._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {location.type === 'warehouse' ? (
                    <Warehouse className="w-6 h-6 text-primary" />
                  ) : (
                    <Store className="w-6 h-6 text-primary" />
                  )}
                  <h3 className="text-xl font-semibold text-secondary">{location.name}</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingLocation(location);
                      setShowModal(true);
                    }}
                    className="text-primary hover:text-opacity-80"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(location._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-2">
                <span className="font-medium">Tip:</span>{' '}
                {location.type === 'warehouse' ? 'Anbar' : 'Mağaza'}
              </p>
              <p className="text-gray-600 text-sm mb-2">
                <span className="font-medium">Ünvan:</span> {location.address}
              </p>
              {location.phone && (
                <p className="text-gray-600 text-sm">
                  <span className="font-medium">Telefon:</span> {location.phone}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-secondary mb-4">
              {editingLocation ? 'Lokasiyanı Redaktə Et' : 'Yeni Lokasiya'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ad *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingLocation?.name}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tip *</label>
                  <select
                    name="type"
                    required
                    defaultValue={editingLocation?.type}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="warehouse">Anbar</option>
                    <option value="store">Mağaza</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ünvan *</label>
                  <input
                    type="text"
                    name="address"
                    required
                    defaultValue={editingLocation?.address}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefon</label>
                  <input
                    type="text"
                    name="phone"
                    defaultValue={editingLocation?.phone}
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
                    setEditingLocation(null);
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


