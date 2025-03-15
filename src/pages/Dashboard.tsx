import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LogOut, 
  User, 
  Calendar, 
  Clock, 
  Settings as SettingsIcon,
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  LayoutDashboard,
  BookOpen,
  Building2,
  Menu,
  Timer,
  Wallet,
  Search,
  Filter,
  Download,
  AlertCircle,
  Users,
  CalendarDays,
  DollarSign,
  Tag,
  Clock3,
  CalendarRange,
  CreditCard,
  Phone,
  Mail
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';

interface Booking {
  id: string;
  user_id: string | null;
  facility_id: string;
  start_time: string;
  end_time: string;
  status: string;
  total_price: number;
  created_at: string;
  is_guest_booking: boolean;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  payment_method: {
    bank_name: string;
  } | null;
  profiles: {
    id: string;
    full_name: string;
  } | null;
  sports_facilities: {
    id: string;
    name: string;
    price_per_hour: number;
  } | null;
}

interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  revenue: number;
  totalUsers: number;
}

interface DateFilter {
  type: 'all' | 'custom' | 'today' | 'week' | 'month';
  startDate: string;
  endDate: string;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    type: 'all',
    startDate: '',
    endDate: ''
  });
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [bookingStats, setBookingStats] = useState<BookingStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    revenue: 0,
    totalUsers: 0
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');

  useEffect(() => {
    checkAccess();
  }, [profile]);

  const checkAccess = async () => {
    if (!profile?.role_id) {
      navigate('/');
      return;
    }

    const { data: roleData } = await supabase
      .from('roles')
      .select('name')
      .eq('id', profile.role_id)
      .single();

    const hasAccess = roleData?.name === 'super_admin' || roleData?.name === 'admin';
    setIsAdmin(hasAccess);
    setIsSuperAdmin(roleData?.name === 'super_admin');

    if (!hasAccess) {
      navigate('/');
      return;
    }

    loadBookings();
  };

  const loadBookings = async () => {
    try {
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          user_id,
          facility_id,
          start_time,
          end_time,
          status,
          total_price,
          created_at,
          is_guest_booking,
          customer_name,
          customer_phone,
          customer_email,
          payment_method:bank_accounts!bookings_payment_method_id_fkey (
            bank_name
          ),
          profiles!bookings_user_id_fkey (
            id,
            full_name
          ),
          sports_facilities!bookings_facility_id_fkey (
            id,
            name,
            price_per_hour
          )
        `)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      const { count: userCount, error: userCountError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' });

      if (userCountError) throw userCountError;

      const allBookings = bookingsData || [];
      setBookings(allBookings);

      const stats: BookingStats = {
        total: allBookings.length,
        pending: allBookings.filter(b => b.status === 'pending').length,
        confirmed: allBookings.filter(b => b.status === 'confirmed').length,
        cancelled: allBookings.filter(b => b.status === 'cancelled').length,
        revenue: allBookings
          .filter(b => b.status === 'confirmed')
          .reduce((sum, b) => sum + b.total_price, 0),
        totalUsers: userCount || 0
      };

      setBookingStats(stats);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilterChange = (type: DateFilter['type'], startDate?: string, endDate?: string) => {
    const today = new Date();
    let newStartDate = '';
    let newEndDate = '';

    switch (type) {
      case 'today':
        newStartDate = today.toISOString().split('T')[0];
        newEndDate = today.toISOString().split('T')[0];
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        newStartDate = weekAgo.toISOString().split('T')[0];
        newEndDate = today.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        newStartDate = monthAgo.toISOString().split('T')[0];
        newEndDate = today.toISOString().split('T')[0];
        break;
      case 'custom':
        newStartDate = startDate || '';
        newEndDate = endDate || '';
        break;
      default:
        newStartDate = '';
        newEndDate = '';
    }

    setDateFilter({
      type,
      startDate: newStartDate,
      endDate: newEndDate
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
  };

  const formatIDR = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      setError(null);

      if (!isAdmin) {
        setError('You do not have permission to update booking status.');
        return;
      }

      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      const { data: updatedBooking, error: verifyError } = await supabase
        .from('bookings')
        .select('status')
        .eq('id', bookingId)
        .single();

      if (verifyError) throw verifyError;

      if (updatedBooking.status !== newStatus) {
        throw new Error('Failed to update booking status. Please try again.');
      }

      await loadBookings();
      setSelectedBookings([]);
    } catch (error: any) {
      console.error('Error updating booking status:', error);
      setError(error.message || 'Failed to update booking status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      setActionLoading(true);
      setError(null);

      if (!isAdmin) {
        setError('You do not have permission to delete bookings.');
        return;
      }

      const { error: deleteError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (deleteError) throw deleteError;

      setShowDeleteConfirm(null);
      await loadBookings();
      setSelectedBookings([]);
    } catch (error: any) {
      console.error('Error deleting booking:', error);
      setError(error.message || 'Failed to delete booking. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedBookings.length === 0) return;

    try {
      setActionLoading(true);
      setError(null);

      if (bulkAction === 'delete') {
        const { error } = await supabase
          .from('bookings')
          .delete()
          .in('id', selectedBookings);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('bookings')
          .update({ status: bulkAction })
          .in('id', selectedBookings);

        if (error) throw error;
      }

      await loadBookings();
      setSelectedBookings([]);
      setBulkAction('');
    } catch (error: any) {
      console.error('Error performing bulk action:', error);
      setError(error.message || 'Failed to perform bulk action. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getFilteredBookings = () => {
    return bookings.filter(booking => {
      if (!booking.sports_facilities) return false;

      const searchMatch = 
        (booking.is_guest_booking 
          ? booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
          : booking.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        booking.sports_facilities.name.toLowerCase().includes(searchTerm.toLowerCase());

      const statusMatch = statusFilter === 'all' || booking.status === statusFilter;

      let dateMatch = true;
      if (dateFilter.type !== 'all' && dateFilter.startDate && dateFilter.endDate) {
        const bookingDate = new Date(booking.start_time).toISOString().split('T')[0];
        dateMatch = bookingDate >= dateFilter.startDate && bookingDate <= dateFilter.endDate;
      }

      return searchMatch && statusMatch && dateMatch;
    });
  };

  const exportToExcel = () => {
    const filteredBookings = getFilteredBookings();
    const exportData = filteredBookings.map(booking => ({
      'User Name': booking.is_guest_booking ? `${booking.customer_name} (Guest)` : booking.profiles?.full_name || 'N/A',
      'Facility': booking.sports_facilities?.name || 'N/A',
      'Start Time': formatDate(booking.start_time),
      'End Time': formatDate(booking.end_time),
      'Duration (hours)': calculateDuration(booking.start_time, booking.end_time),
      'Payment Method': booking.payment_method?.bank_name || 'Not selected',
      'Total Price': formatIDR(booking.total_price),
      'Status': booking.status.charAt(0).toUpperCase() + booking.status.slice(1),
      'Booking Date': formatDate(booking.created_at)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bookings');
    XLSX.writeFile(wb, `bookings_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedBookings(getFilteredBookings().map(b => b.id));
    } else {
      setSelectedBookings([]);
    }
  };

  const toggleSelectBooking = (bookingId: string) => {
    setSelectedBookings(prev => 
      prev.includes(bookingId)
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const filteredBookings = getFilteredBookings();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <LayoutDashboard className="h-8 w-8 text-indigo-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">
              {isSuperAdmin ? 'Super Admin' : 'Administrator'} Dashboard
            </h1>
          </div>
          <Link
            to="/settings"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <SettingsIcon className="h-5 w-5 mr-2" />
            Settings
          </Link>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <h3 className="text-2xl font-bold text-indigo-600">{formatIDR(bookingStats.revenue)}</h3>
              </div>
              <div className="bg-indigo-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Bookings</p>
                <h3 className="text-2xl font-bold text-gray-900">{bookingStats.total}</h3>
                <div className="mt-1 flex items-center space-x-2 text-sm">
                  <span className="text-green-600">{bookingStats.confirmed} confirmed</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-yellow-600">{bookingStats.pending} pending</span>
                </div>
              </div>
              <div className="bg-gray-100 p-3 rounded-full">
                <BookOpen className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Users</p>
                <h3 className="text-2xl font-bold text-gray-900">{bookingStats.totalUsers}</h3>
                <p className="mt-1 text-sm text-gray-500">Total registered users</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Cancellation Rate</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {bookingStats.total > 0
                    ? Math.round((bookingStats.cancelled / bookingStats.total) * 100)
                    : 0}%
                </h3>
                <p className="mt-1 text-sm text-gray-500">{bookingStats.cancelled} cancelled</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-full">
                <XCircle className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex-1 w-full">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
              <div className="flex gap-4 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <div className="relative">
                  <button
                    onClick={() => setShowDateFilter(!showDateFilter)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <CalendarRange className="h-5 w-5 mr-2" />
                    {dateFilter.type === 'custom' ? 'Custom Date' : dateFilter.type.charAt(0).toUpperCase() + dateFilter.type.slice(1)}
                  </button>
                  
                  {showDateFilter && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-10 p-4">
                      <div className="space-y-4">
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => {
                              handleDateFilterChange('all');
                              setShowDateFilter(false);
                            }}
                            className={`text-left px-4 py-2 rounded-lg ${dateFilter.type === 'all' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'}`}
                          >
                            All Time
                          </button>
                          <button
                            onClick={() => {
                              handleDateFilterChange('today');
                              setShowDateFilter(false);
                            }}
                            className={`text-left px-4 py-2 rounded-lg ${dateFilter.type === 'today' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'}`}
                          >
                            Today
                          </button>
                          <button
                            onClick={() => {
                              handleDateFilterChange('week');
                              setShowDateFilter(false);
                            }}
                            className={`text-left px-4 py-2 rounded-lg ${dateFilter.type === 'week' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'}`}
                          >
                            Last 7 Days
                          </button>
                          <button
                            onClick={() => {
                              handleDateFilterChange('month');
                              setShowDateFilter(false);
                            }}
                            className={`text-left px-4 py-2 rounded-lg ${dateFilter.type === 'month' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'}`}
                          >
                            Last 30 Days
                          </button>
                        </div>
                        <div className="border-t pt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Custom Range</p>
                          <div className="space-y-2">
                            <div>
                              <label className="block text-sm text-gray-600">Start Date</label>
                              <input
                                type="date"
                                value={dateFilter.startDate}
                                onChange={(e) => handleDateFilterChange('custom', e.target.value, dateFilter.endDate)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600">End Date</label>
                              <input
                                type="date"
                                value={dateFilter.endDate}
                                min={dateFilter.startDate}
                                onChange={(e) => handleDateFilterChange('custom', dateFilter.startDate, e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => setShowDateFilter(false)}
                            className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex items-center gap-2">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="block w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={selectedBookings.length === 0}
                >
                  <option value="">Bulk Actions</option>
                  <option value="confirmed">Confirm</option>
                  <option value="cancelled">Cancel</option>
                  <option value="delete">Delete</option>
                </select>
                <button
                  onClick={handleBulkAction}
                  disabled={!bulkAction || selectedBookings.length === 0 || actionLoading}
                  className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
              <div className="flex-1" />
              <button
                onClick={exportToExcel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-5 w-5 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center py-6">
                        <AlertCircle className="h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-lg font-medium">No bookings found</p>
                        <p className="text-sm text-gray-500">Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedBookings.includes(booking.id)}
                          onChange={() => toggleSelectBooking(booking.id)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          <User className="h-5 w-5 text-gray-400 mt-1" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {booking.is_guest_booking 
                                ? `${booking.customer_name} (Guest)`
                                : booking.profiles?.full_name || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.sports_facilities?.name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-400">
                              Booked {formatDate(booking.created_at)}
                            </div>
                            {booking.is_guest_booking && (
                              <div className="text-xs text-gray-400">
                                {booking.customer_email} • {booking.customer_phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        
                        <div className="flex items-start space-x-3">
                          <CalendarDays className="h-5 w-5 text-gray-400 mt-1" />
                          <div>
                            <div className="text-sm text-gray-900">
                              {formatDate(booking.start_time)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {calculateDuration(booking.start_time, booking.end_time)} hours
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-5 w-5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {booking.payment_method?.bank_name || 'Not selected'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Tag className="h-5 w-5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {formatIDR(booking.total_price)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          <span className="w-2 h-2 mr-1.5 rounded-full inline-block" style={{
                            backgroundColor: booking.status === 'confirmed' ? '#34D399' : booking.status === 'cancelled' ? '#F87171' : '#FBBF24'
                          }} />
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {booking.status === 'pending' && isAdmin && (
                            <>
                              <button
                                onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                                disabled={actionLoading}
                                className={`text-green-600 hover:text-green-900 transition-colors duration-200 ${
                                  actionLoading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                title="Confirm"
                              >
                                <CheckCircle className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                                disabled={actionLoading}
                                className={`text-red-600 hover:text-red-900 transition-colors duration-200 ${
                                  actionLoading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                title="Cancel"
                              >
                                <XCircle className="h-5 w-5" />
                              </button>
                            </>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => setShowDeleteConfirm(booking.id)}
                              disabled={actionLoading}
                              className={`text-red-600 hover:text-red-900 transition-colors duration-200 ${
                                actionLoading ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              title="Delete"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to delete this booking? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={actionLoading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteBooking(showDeleteConfirm)}
                disabled={actionLoading}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 ${
                  actionLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}