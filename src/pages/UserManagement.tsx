import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, ArrowLeft, Plus, Trash2, AlertCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

interface User {
  id: string;
  full_name: string;
  role: {
    id: string;
    name: string;
  };
}

interface Role {
  id: string;
  name: string;
}

interface NewUser {
  email: string;
  password: string;
  full_name: string;
  role_id: string;
}

interface GroupedUsers {
  superAdmin: User[];
  admin: User[];
  user: User[];
}

export function UserManagement() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    password: '',
    full_name: '',
    role_id: ''
  });

  useEffect(() => {
    const checkSuperAdminAccess = async () => {
      if (!profile?.role_id) {
        navigate('/dashboard');
        return;
      }

      const { data: roleData } = await supabase
        .from('roles')
        .select('name')
        .eq('id', profile.role_id)
        .single();

      if (roleData?.name !== 'super_admin') {
        navigate('/dashboard');
      }
    };

    checkSuperAdminAccess();
    loadUsers();
    loadRoles();
  }, [profile, navigate]);

  const loadUsers = async () => {
    try {
      const { data, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          role:roles (
            id,
            name
          )
        `);

      if (usersError) throw usersError;
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) throw error;
      setRoles(data || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateUserRole = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role_id: selectedRole })
        .eq('id', selectedUser);

      if (error) throw error;

      loadUsers();
      setSelectedUser(null);
      setSelectedRole(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Sign up the user
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
      });

      if (signUpError) throw signUpError;
      if (!user) throw new Error('No user returned after signup');

      // Create profile with selected role
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          role_id: newUser.role_id,
          full_name: newUser.full_name,
        });

      if (profileError) throw profileError;

      // Reset form and close modal
      setNewUser({
        email: '',
        password: '',
        full_name: '',
        role_id: ''
      });
      setShowCreateModal(false);
      loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const groupUsersByRole = (): GroupedUsers => {
    return users.reduce((acc: GroupedUsers, user) => {
      const roleName = user.role?.name || 'user';
      switch (roleName) {
        case 'super_admin':
          acc.superAdmin.push(user);
          break;
        case 'admin':
          acc.admin.push(user);
          break;
        default:
          acc.user.push(user);
      }
      return acc;
    }, { superAdmin: [], admin: [], user: [] });
  };

  const UserTable = ({ users, title }: { users: User[], title: string }) => (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.full_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                    {user.role?.name || 'No Role'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => setSelectedUser(user.id)}
                    className="text-indigo-600 hover:text-indigo-900 transition-colors duration-200"
                  >
                    Change Role
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  No users found in this category
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const groupedUsers = groupUsersByRole();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/settings')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
            <Users className="h-8 w-8 text-indigo-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create User
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        <UserTable users={groupedUsers.superAdmin} title="Super Administrators" />
        <UserTable users={groupedUsers.admin} title="Administrators" />
        <UserTable users={groupedUsers.user} title="Regular Users" />
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Shield className="h-6 w-6 text-indigo-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Create New User</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={createUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  required
                  value={newUser.role_id}
                  onChange={(e) => setNewUser({ ...newUser, role_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-indigo-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Change User Role</h3>
            </div>
            
            <select
              value={selectedRole || ''}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>

            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={updateUserRole}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}