import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Settings as SettingsIcon, Users, Building2, Wallet, ChevronRight, ArrowLeft, LogOut, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export function Settings() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuthStore();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
        return;
      }

      setIsSuperAdmin(true);
    };

    checkSuperAdminAccess();
  }, [profile, navigate]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <SettingsIcon className="h-8 w-8 text-indigo-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-200">
            {/* User Management */}
            <Link
              to="/settings/users"
              className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex items-center">
                <Users className="h-6 w-6 text-indigo-600" />
                <div className="ml-4">
                  <h2 className="text-lg font-medium text-gray-900">User Management</h2>
                  <p className="text-sm text-gray-500">Manage user roles and permissions</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Link>

            {/* Facility Management */}
            <Link
              to="/settings/facilities"
              className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex items-center">
                <Building2 className="h-6 w-6 text-indigo-600" />
                <div className="ml-4">
                  <h2 className="text-lg font-medium text-gray-900">Manage Facilities</h2>
                  <p className="text-sm text-gray-500">Add, edit, and manage sports facilities</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Link>

            {/* Operating Hours */}
            <Link
              to="/settings/operating-hours"
              className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex items-center">
                <Clock className="h-6 w-6 text-indigo-600" />
                <div className="ml-4">
                  <h2 className="text-lg font-medium text-gray-900">Operating Hours</h2>
                  <p className="text-sm text-gray-500">Set facility operating hours and availability</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Link>

            {/* Bank Account Management */}
            <Link
              to="/bank-accounts"
              className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex items-center">
                <Wallet className="h-6 w-6 text-indigo-600" />
                <div className="ml-4">
                  <h2 className="text-lg font-medium text-gray-900">Manage Bank Accounts</h2>
                  <p className="text-sm text-gray-500">Configure and manage payment accounts</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Link>

            {/* Logout */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center p-6 hover:bg-red-50 transition-colors duration-200 text-left"
            >
              <LogOut className="h-6 w-6 text-red-600" />
              <div className="ml-4">
                <h2 className="text-lg font-medium text-red-600">Logout</h2>
                <p className="text-sm text-red-500">Sign out of your account</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Logout</h3>
            <p className="text-gray-500 mb-6">Are you sure you want to log out? You will need to sign in again to access your account.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}