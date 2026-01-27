import { useEffect, useState } from 'react';
import api from '../api/api';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface User {
  _id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'manager' | 'cashier' | 'warehouse';
  active: boolean;
  phone?: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = {
      username: formData.get('username'),
      fullName: formData.get('fullName'),
      role: formData.get('role'),
      phone: formData.get('phone') || undefined,
    };

    const password = formData.get('password');
    if (password) {
      data.password = password;
    }

    try {
      if (editingUser) {
        await api.patch(`/users/${editingUser._id}`, data);
      } else {
        await api.post('/users', data);
      }
      setShowModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Xəta baş verdi');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('İstifadəçini silmək istədiyinizə əminsiniz?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (error) {
      alert('Xəta baş verdi');
    }
  };

  const roleLabels: Record<string, string> = {
    admin: 'Admin',
    manager: 'Menecer',
    cashier: 'Kassir',
    warehouse: 'Anbar',
  };

  const canEdit = currentUser?.role === 'admin';

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary">İstifadəçilər</h1>
        {canEdit && (
          <button
            onClick={() => {
              setEditingUser(null);
              setShowModal(true);
            }}
            className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-opacity-90"
          >
            <Plus className="w-5 h-5" />
            Yeni İstifadəçi
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">Yüklənir...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-secondary text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">İstifadəçi adı</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Ad Soyad</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Telefon</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Status</th>
                {canEdit && (
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Əməliyyatlar</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.fullName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-primary text-white">
                      {roleLabels[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        user.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.active ? 'Aktiv' : 'Deaktiv'}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setShowModal(true);
                        }}
                        className="text-primary hover:text-opacity-80 mr-3"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && canEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-secondary mb-4">
              {editingUser ? 'İstifadəçini Redaktə Et' : 'Yeni İstifadəçi'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">İstifadəçi adı *</label>
                  <input
                    type="text"
                    name="username"
                    required
                    defaultValue={editingUser?.username}
                    disabled={!!editingUser}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ad Soyad *</label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    defaultValue={editingUser?.fullName}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rol *</label>
                  <select
                    name="role"
                    required
                    defaultValue={editingUser?.role}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="cashier">Kassir</option>
                    <option value="warehouse">Anbar</option>
                    <option value="manager">Menecer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefon</label>
                  <input
                    type="text"
                    name="phone"
                    defaultValue={editingUser?.phone}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {editingUser ? 'Yeni Şifrə (boş buraxın dəyişməmək üçün)' : 'Şifrə *'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    required={!editingUser}
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
                    setEditingUser(null);
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


