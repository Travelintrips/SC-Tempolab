import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LogOut, 
  User, 
  Calendar, 
  Clock, 
  Settings as SettingsIcon,
  ChevronRight, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  LayoutDashboard,
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
  Mail,
  Shield,
  ArrowRight,
  ArrowLeft,
  X,
  BookOpen,
  Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

interface Facility {
  id: string;
  name: string;
  description: string;
  price_per_hour: number;
  image_url: string;
}

interface BookingModalProps {
  facility: Facility;
  onClose: () => void;
  onBook: (startTime: string, duration: number, guestInfo?: GuestInfo) => Promise<void>;
}

interface OperatingHours {
  id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_open: boolean;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface ExistingBooking {
  start_time: string;
  end_time: string;
}

interface GuestInfo {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

function BookingModal({ facility, onClose, onBook }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [loading, setLoading] = useState(false);
  const [operatingHours, setOperatingHours] = useState<OperatingHours | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [existingBookings, setExistingBookings] = useState<ExistingBooking[]>([]);
  const [availableDurations, setAvailableDurations] = useState<number[]>([]);
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    customerName: '',
    customerEmail: '',
    customerPhone: ''
  });
  const [isGuestBooking, setIsGuestBooking] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    loadOperatingHours();
  }, [selectedDate]);

  useEffect(() => {
    if (selectedTime) {
      calculateAvailableDurations();
    }
  }, [selectedTime, existingBookings, operatingHours]);

  const loadOperatingHours = async () => {
    try {
      const dayOfWeek = selectedDate.getDay();
      
      const { data: hoursData, error: hoursError } = await supabase
        .from('operating_hours')
        .select('*')
        .eq('day_of_week', dayOfWeek)
        .limit(1);

      if (hoursError) throw hoursError;

      if (hoursData && hoursData.length > 0) {
        setOperatingHours(hoursData[0]);
        
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('start_time, end_time')
          .eq('facility_id', facility.id)
          .gte('start_time', startOfDay.toISOString())
          .lte('end_time', endOfDay.toISOString())
          .neq('status', 'cancelled');

        if (bookingsError) throw bookingsError;

        setExistingBookings(bookingsData || []);
        generateTimeSlots(hoursData[0], bookingsData || []);
      } else {
        setOperatingHours(null);
        setTimeSlots([]);
        setError('No operating hours found for this day');
      }
    } catch (err: any) {
      console.error('Error loading operating hours:', err);
      setError('Failed to load operating hours');
    }
  };

  const generateTimeSlots = (hours: OperatingHours, bookings: ExistingBooking[]) => {
    if (!hours.is_open) {
        setTimeSlots([]);
        setSelectedTime('');
        return;
    }

    const slots: TimeSlot[] = [];
    const [openHour] = hours.open_time.split(':');
    const [closeHour] = hours.close_time.split(':');
    const startHour = parseInt(openHour);
    const endHour = parseInt(closeHour);

    const bookedRanges = bookings.map(booking => ({
        start: new Date(booking.start_time),
        end: new Date(booking.end_time)
    }));

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
   // const isToday = selectedDate.getTime() === today.getTime();
const selectedDateNoTime = new Date(selectedDate);
    selectedDateNoTime.setHours(0, 0, 0, 0);
    const isToday = selectedDateNoTime.getTime() === today.getTime(); 
  //  console.log("Current Time:", now.toLocaleString()); // Debugging
  //  console.log("Selected Date:", selectedDate.toLocaleString()); 

const nowRounded = new Date();
nowRounded.setMinutes(0, 0, 0);
    
    for (let hour = startHour; hour < endHour; hour++) {
        const slotTime = `${hour.toString().padStart(2, '0')}:00`;
        const slotDate = new Date(selectedDate);
        slotDate.setHours(hour, 0, 0, 0);      
      // Skip past times for today
      if (isToday && slotDate < new Date(nowRounded.getTime() + 60 * 60 * 1000)) {
       //     console.log(`Slot ${slotTime} diblokir karena kurang dari 1 jam dari sekarang.`);
            continue;
        }
      
      const isAvailable = !bookedRanges.some(range => {
            return slotDate >= range.start && slotDate < range.end;
        });

      slots.push({
            time: slotTime,
            available: isAvailable
        });
    }

    setTimeSlots(slots);

    if (selectedTime) {
      const isCurrentTimeAvailable = slots.find(
        slot => slot.time === selectedTime && slot.available
      );
      if (!isCurrentTimeAvailable) {
        setSelectedTime('');
      }
    }
  };

  const calculateAvailableDurations = () => {
    if (!selectedTime || !operatingHours) return;

    const [selectedHour] = selectedTime.split(':');
    const startHour = parseInt(selectedHour);
    const [closeHour] = operatingHours.close_time.split(':');
    const endHour = parseInt(closeHour);

    const maxPossibleDuration = endHour - startHour;

    const selectedDateTime = new Date(selectedDate);
    selectedDateTime.setHours(startHour, 0, 0, 0);

    const availableDurs: number[] = [];
    for (let dur = 1; dur <= Math.min(5, maxPossibleDuration); dur++) {
      const endDateTime = new Date(selectedDateTime);
      endDateTime.setHours(endDateTime.getHours() + dur);

      const hasOverlap = existingBookings.some(booking => {
        const bookingStart = new Date(booking.start_time);
        const bookingEnd = new Date(booking.end_time);
        return (
          (selectedDateTime < bookingEnd && endDateTime > bookingStart) ||
          endDateTime > new Date(selectedDate.setHours(parseInt(closeHour), 0, 0, 0))
        );
      });

      if (!hasOverlap) {
        availableDurs.push(dur);
      }
    }

    setAvailableDurations(availableDurs);
    
    if (!availableDurs.includes(duration)) {
      setDuration(availableDurs[0] || 1);
    }
  };

  const validateGuestInfo = () => {
    if (!guestInfo.customerName.trim()) {
      throw new Error('Please enter your full name');
    }
    if (!guestInfo.customerEmail.trim()) {
      throw new Error('Please enter your email');
    }
    if (!guestInfo.customerPhone.trim()) {
      throw new Error('Please enter your phone number');
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestInfo.customerEmail)) {
      throw new Error('Please enter a valid email address');
    }
  };

  const handleSubmit = async () => {
    if (!selectedTime || !operatingHours) return;
    
    setLoading(true);
    try {
      const startDateTime = new Date(selectedDate);
      const [hours] = selectedTime.split(':');
      startDateTime.setHours(parseInt(hours), 0, 0, 0);

      const bookingEndTime = new Date(startDateTime);
      bookingEndTime.setHours(bookingEndTime.getHours() + duration);

      const [closeHour] = operatingHours.close_time.split(':');
      const closingTime = new Date(selectedDate);
      closingTime.setHours(parseInt(closeHour), 0, 0, 0);

      if (bookingEndTime > closingTime) {
        throw new Error('Booking extends beyond operating hours');
      }

      const hasOverlap = existingBookings.some(booking => {
        const bookingStart = new Date(booking.start_time);
        const bookingEnd = new Date(booking.end_time);
        return startDateTime < bookingEnd && bookingEndTime > bookingStart;
      });

      if (hasOverlap) {
        throw new Error('This time slot is no longer available');
      }

      if (!user && !isGuestBooking) {
        setIsGuestBooking(true);
        return;
      }

      if (isGuestBooking) {
        validateGuestInfo();
      }

      await onBook(startDateTime.toISOString(), duration, isGuestBooking ? guestInfo : undefined);
      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const isDateValid = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  const formatTimeRange = (startTime: string, durationHours: number) => {
    const [hour] = startTime.split(':');
    const start = parseInt(hour);
    const end = start + durationHours;
    return `${startTime} - ${end.toString().padStart(2, '0')}:00`;
  };

  const formatIDR = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{facility.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                if (isDateValid(newDate)) {
                  setSelectedDate(newDate);
                  setSelectedTime('');
                }
              }}
              className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Time
            </label>
            {operatingHours?.is_open ? (
              timeSlots.length > 0 ? (
                <select
                  value={selectedTime}
                  onChange={(e) => {
                    setSelectedTime(e.target.value);
                    setDuration(1);
                  }}
                  className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Choose a time</option>
                  {timeSlots
                    .filter(slot => slot.available)
                    .map((slot) => (
                      <option key={slot.time} value={slot.time}>
                        {slot.time}
                      </option>
                    ))}
                </select>
              ) : (
                <p className="text-sm text-gray-500">No available time slots for this date</p>
              )
            ) : (
              <p className="text-sm text-red-500">Facility is closed on this day</p>
            )}
          </div>

          {selectedTime && availableDurations.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              >
                {availableDurations.map((hours) => (
                  <option key={hours} value={hours}>
                    {formatTimeRange(selectedTime, hours)} ({hours} hour{hours > 1 ? 's' : ''})
                  </option>
                ))}
              </select>
            </div>
          )}

          {!user && isGuestBooking && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={guestInfo.customerName}
                  onChange={(e) => setGuestInfo({ ...guestInfo, customerName: e.target.value })}
                  className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={guestInfo.customerEmail}
                  onChange={(e) => setGuestInfo({ ...guestInfo, customerEmail: e.target.value })}
                  className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={guestInfo.customerPhone}
                  onChange={(e) => setGuestInfo({ ...guestInfo, customerPhone: e.target.value })}
                  className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Price per hour</span>
              <span>{formatIDR(facility.price_per_hour)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold text-gray-900">
              <span>Total price</span>
              <span>{formatIDR(facility.price_per_hour * duration)}</span>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!selectedTime || loading || !operatingHours?.is_open || availableDurations.length === 0}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium ${
              !selectedTime || !operatingHours?.is_open || availableDurations.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Processing...
              </span>
            ) : !user && !isGuestBooking ? (
              'Continue as Guest'
            ) : (
              'Continue to Payment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Home() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuthStore();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  useEffect(() => {
    loadFacilities();
  }, []);

  const loadFacilities = async () => {
    try {
      const { data, error } = await supabase
        .from('sports_facilities')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error loading facilities:', error);
        return;
      }
      
      if (data) {
        setFacilities(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowProfileMenu(false);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
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

  const handleBook = async (startTime: string, duration: number, guestInfo?: GuestInfo) => {
    if (!selectedFacility) return;

    const endDateTime = new Date(new Date(startTime).getTime() + duration * 60 * 60 * 1000);
    const totalPrice = selectedFacility.price_per_hour * duration;

    // Navigate to payment page with booking details
    navigate('/payment', {
      state: {
        facilityId: selectedFacility.id,
        facilityName: selectedFacility.name,
        startTime: startTime,
        endTime: endDateTime.toISOString(),
        totalPrice: totalPrice,
        userId: user?.id,
        isGuestBooking: !user,
        guestInfo: guestInfo
      }
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div 
        className="relative bg-cover bg-center h-[600px]"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80")',
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="absolute inset-0">
          <nav className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-white" />
                <span className="ml-2 text-2xl font-bold text-white">Sports Center</span>
              </div>
              <div className="flex items-center space-x-4">
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="flex items-center space-x-3 text-white hover:text-gray-200 transition-colors duration-200"
                    >
                      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                      <span className="font-medium">{profile?.full_name || 'Profile'}</span>
                      <ChevronRight className={`h-5 w-5 transition-transform duration-200 ${showProfileMenu ? 'rotate-90' : ''}`} />
                    </button>
                    
                    {showProfileMenu && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-10">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm text-gray-500">Signed in as</p>
                          <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
                        </div>
                        
                        {profile?.role?.name === 'user' && (
                          <Link
                            to="/my-bookings"
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setShowProfileMenu(false)}
                          >
                            <BookOpen className="h-5 w-5 mr-3 text-gray-400" />
                            My Bookings
                          </Link>
                        )}
                        
                        {(profile?.role?.name === 'admin' || profile?.role?.name === 'super_admin') && (
                          <Link
                            to="/dashboard"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setShowProfileMenu(false)}
                          >
                            <LayoutDashboard className="h-5 w-5 mr-3 text-gray-400" />
                            Dashboard
                          </Link>
                        )}
                        
                        <button
                          onClick={handleSignOut}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="h-5 w-5 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="px-6 py-2 text-white hover:text-gray-200 font-medium"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="px-6 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 font-medium"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </nav>
          <div className="container mx-auto px-6 h-full flex items-center">
            <div className="max-w-2xl">
              <h1 className="text-5xl font-bold text-white mb-6">
                Book Your Sports Facility with Ease
              </h1>
              <p className="text-xl text-gray-200 mb-8">
                Experience seamless booking for your favorite sports facilities. Join us and elevate your game today.
              </p>
              {!user && (
                <Link
                  to="/register"
                  className="inline-flex items-center px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
            Why Choose Our Platform?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-white rounded-full p-6 w-20 h-20 mx-auto mb-6 shadow-lg">
                <Clock className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Real-time Booking</h3>
              <p className="text-gray-600">
                Book your preferred facility instantly with our real-time availability system.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-full p-6 w-20 h-20 mx-auto mb-6 shadow-lg">
                <Users className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">User-Friendly</h3>
              <p className="text-gray-600">
                Simple and intuitive interface designed for the best booking experience.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-full p-6 w-20 h-20 mx-auto mb-6 shadow-lg">
                <Shield className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Secure Platform</h3>
              <p className="text-gray-600">
                Your bookings and personal information are protected with top-tier security.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Facilities Section */}
      <div className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">
            Our Sports Facilities
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Discover our world-class sports facilities. From indoor courts to outdoor fields, we have everything you need for your sporting activities.
          </p>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : facilities.length === 0 ? (
            <div className="text-center text-gray-600">
              <p>No facilities available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {facilities.map((facility) => (
                <div key={facility.id} className="bg-white rounded-lg shadow-lg overflow-hidden transform transition hover:scale-105">
                  <div className="relative h-48">
                    <img
                      src={facility.image_url || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80'}
                      alt={facility.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                      <h3 className="text-white text-xl font-semibold">{facility.name}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-600 mb-4">{facility.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-indigo-600">
                        {formatIDR(facility.price_per_hour)}/hour
                      </span>
                      <button
                        onClick={() => setSelectedFacility(facility)}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                      >
                        Book Now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      {!user && (
        <div className="py-20 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="bg-indigo-600 rounded-2xl p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-6">
                Ready to Start Booking?
              </h2>
              <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
                Join thousands of satisfied users who trust our platform for their sports facility bookings.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center px-8 py-3 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 font-medium transition-colors"
              >
                Create Your Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <Calendar className="h-8 w-8" />
              <span className="ml-2 text-xl font-bold">Sports Center</span>
            </div>
            <div className="flex space-x-6">
              {!user && (
                <>
                  <Link to="/login" className="hover:text-gray-300">Sign In</Link>
                  <Link to="/register" className="hover:text-gray-300">Sign Up</Link>
                </>
              )}
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Sports Center. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Booking Modal */}
      {selectedFacility && (
        <BookingModal
          facility={selectedFacility}
          onClose={() => setSelectedFacility(null)}
          onBook={handleBook}
        />
      )}
    </div>
  );
}
