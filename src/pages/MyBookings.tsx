import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen,
  ArrowLeft,
  User,
  Phone,
  Mail,
  CreditCard,
  CalendarDays,
  Clock,
  Tag,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

interface Booking {
  id: string;
  facility_id: string;
  start_time: string;
  end_time: string;
  status: string;
  total_price: number;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  payment_method: {
    bank_name: string;
    account_number: string;
    account_holder: string;
  } | null;
  facility: {
    name: string;
  };
}

export function MyBookings() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadBookings();
  }, [user, navigate]);

  const loadBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          facility_id,
          start_time,
          end_time,
          status,
          total_price,
          customer_name,
          customer_phone,
          customer_email,
          payment_method:bank_accounts!bookings_payment_method_id_fkey (
            bank_name,
            account_number,
            account_holder
          ),
          facility:sports_facilities!bookings_facility_id_fkey (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (err: any) {
      console.error('Error loading bookings:', err);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (startTime: string, endTime: string): number => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatIDR = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
            <BookOpen className="h-8 w-8 text-indigo-600 mr-3" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Bookings</h1>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Found</h3>
            <p className="text-gray-500 mb-4">You haven't made any bookings yet.</p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
            >
              Browse Facilities
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {booking.facility.name}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <CalendarDays className="h-5 w-5 text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm text-gray-500">Schedule</p>
                          <p className="font-medium">{formatDateTime(booking.start_time)}</p>
                          <p className="font-medium">{formatDateTime(booking.end_time)}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Clock className="h-5 w-5 text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm text-gray-500">Duration</p>
                          <p className="font-medium">
                            {calculateDuration(booking.start_time, booking.end_time)} hours
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Tag className="h-5 w-5 text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm text-gray-500">Total Price</p>
                          <p className="font-medium text-indigo-600">
                            {formatIDR(booking.total_price)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {booking.payment_method && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                            <CreditCard className="h-5 w-5 mr-2" />
                            Payment Method
                          </h4>
                          <div className="space-y-2">
                            <p className="text-sm">
                              <span className="text-gray-500">Bank:</span>{' '}
                              <span className="font-medium">{booking.payment_method.bank_name}</span>
                            </p>
                            <p className="text-sm">
                              <span className="text-gray-500">Account:</span>{' '}
                              <span className="font-medium">{booking.payment_method.account_number}</span>
                            </p>
                            <p className="text-sm">
                              <span className="text-gray-500">Account Holder:</span>{' '}
                              <span className="font-medium">{booking.payment_method.account_holder}</span>
                            </p>
                          </div>
                        </div>
                      )}

                      {booking.customer_name && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                            <User className="h-5 w-5 mr-2" />
                            Customer Details
                          </h4>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <User className="h-4 w-4 text-gray-400 mr-2" />
                              <p className="text-sm">
                                <span className="text-gray-500">Name:</span>{' '}
                                <span className="font-medium">{booking.customer_name}</span>
                              </p>
                            </div>
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 text-gray-400 mr-2" />
                              <p className="text-sm">
                                <span className="text-gray-500">Phone:</span>{' '}
                                <span className="font-medium">{booking.customer_phone}</span>
                              </p>
                            </div>
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 text-gray-400 mr-2" />
                              <p className="text-sm">
                                <span className="text-gray-500">Email:</span>{' '}
                                <span className="font-medium">{booking.customer_email}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}