import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import EventDetails from './pages/EventDetails';
import CreateEvent from './pages/CreateEvent';
import Payment from './pages/Payment';
import NotFound from './pages/NotFound';
import PrivateRoute from './components/routes/PrivateRoute';
import AdminRoute from './components/routes/AdminRoute';
import OrganizerRoute from './components/routes/OrganizerRoute';

import DashboardLayout from './components/layout/DashboardLayout';
import UserManagement from './pages/Dashboard/UserManagement';
import EventManagement from './pages/Dashboard/EventManagement';
import ProfilePage from './pages/Dashboard/ProfilePage';

function App() {
  const { theme } = useSelector((state) => state.theme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className={theme === 'dark' ? 'dark' : 'light'}>
      <Routes>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard/profile" replace />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="events" element={<EventManagement />} />
          <Route path="users" element={<UserManagement />} />
        </Route>
        
        <Route path="/" element={
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow container-custom py-6">
              <Home />
            </main>
            <Footer />
          </div>
        } />
        
        <Route path="/login" element={
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow container-custom py-6">
              <Login />
            </main>
            <Footer />
          </div>
        } />
        
        <Route path="/register" element={
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow container-custom py-6">
              <Register />
            </main>
            <Footer />
          </div>
        } />
        
        <Route path="/events/:id" element={
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow container-custom py-6">
              <EventDetails />
            </main>
            <Footer />
          </div>
        } />
        
        <Route path="/payment/process/:paymentId" element={
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow container-custom py-6">
              <PrivateRoute>
                <Payment />
              </PrivateRoute>
            </main>
            <Footer />
          </div>
        } />
        
        <Route path="/events/create" element={
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow container-custom py-6">
              <OrganizerRoute>
                <CreateEvent />
              </OrganizerRoute>
            </main>
            <Footer />
          </div>
        } />
        
        <Route path="/events/edit/:id" element={
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow container-custom py-6">
              <OrganizerRoute>
                <CreateEvent />
              </OrganizerRoute>
            </main>
            <Footer />
          </div>
        } />
        
        <Route path="*" element={
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow container-custom py-6">
              <NotFound />
            </main>
            <Footer />
          </div>
        } />
      </Routes>
    </div>
  );
}

export default App;
