import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { UserManagement } from './pages/UserManagement';
import { Facilities } from './pages/Facilities';
import { Home } from './pages/Home';
import { BankAccounts } from './pages/BankAccounts';
import { OperatingHours } from './pages/OperatingHours';
import { PaymentBooking } from './pages/PaymentBooking';
import { MyBookings } from './pages/MyBookings';
import { GuestBooking } from './pages/GuestBooking';
import { AuthGuard } from './components/AuthGuard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/payment" element={<PaymentBooking />} />
        <Route path="/guest-booking" element={<GuestBooking />} />
        <Route
          path="/my-bookings"
          element={
            <AuthGuard>
              <MyBookings />
            </AuthGuard>
          }
        />
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          }
        />
        <Route
          path="/settings"
          element={
            <AuthGuard>
              <Settings />
            </AuthGuard>
          }
        />
        <Route
          path="/settings/users"
          element={
            <AuthGuard>
              <UserManagement />
            </AuthGuard>
          }
        />
        <Route
          path="/settings/facilities"
          element={
            <AuthGuard>
              <Facilities />
            </AuthGuard>
          }
        />
        <Route
          path="/settings/operating-hours"
          element={
            <AuthGuard>
              <OperatingHours />
            </AuthGuard>
          }
        />
        <Route
          path="/bank-accounts"
          element={
            <AuthGuard>
              <BankAccounts />
            </AuthGuard>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;