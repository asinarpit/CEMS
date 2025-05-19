import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaUsers, FaCalendarAlt, FaMoneyBillWave, FaTicketAlt, FaCheck, FaTimes, FaChartLine } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import Spinner from '../../components/ui/Spinner';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}`;

const DashboardOverview = () => {
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalUsers: 0,
    totalRegistrations: 0,
    totalRevenue: 0,
    recentEvents: [],
    recentRegistrations: [],
    upcomingEvents: 0,
    pastEvents: 0,
    activeEvents: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user && user.role === 'admin';
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        const response = await axios.get(`${API_URL}/dashboard/stats`, config);
        
        if (response.data.success) {
          setStats(response.data.data);
        }
      } catch (error) {
        toast.error('Error fetching dashboard data');
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (isLoading) {
    return <Spinner />;
  }
  
  // Mock data for visualization - replace with real data from API
  const mockChartData = {
    eventsPerMonth: [4, 7, 2, 5, 9, 12, 8, 3, 6, 10, 11, 7],
    registrationsPerDay: [15, 12, 8, 20, 25, 18, 30],
    revenueBreakdown: {
      paid: 75,
      free: 25
    }
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Dashboard Overview</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-dark-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center mb-3">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mr-4">
              <FaCalendarAlt className="text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Events</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalEvents}</h3>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Active: {stats.activeEvents}</span>
            <span>Upcoming: {stats.upcomingEvents}</span>
            <span>Past: {stats.pastEvents}</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-dark-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center mb-3">
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full mr-4">
              <FaUsers className="text-green-600 dark:text-green-300" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalUsers}</h3>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <Link to="/dashboard/users" className="text-primary hover:underline">
              View details →
            </Link>
          </div>
        </div>
        
        <div className="bg-white dark:bg-dark-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center mb-3">
            <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full mr-4">
              <FaTicketAlt className="text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Registrations</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalRegistrations}</h3>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <Link to="/dashboard/participants" className="text-primary hover:underline">
              View all participants →
            </Link>
          </div>
        </div>
        
        <div className="bg-white dark:bg-dark-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center mb-3">
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full mr-4">
              <FaMoneyBillWave className="text-yellow-600 dark:text-yellow-300" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">₹{stats.totalRevenue.toLocaleString()}</h3>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <Link to="/dashboard/transactions" className="text-primary hover:underline">
              View transactions →
            </Link>
          </div>
        </div>
      </div>
      
      {/* Visualization Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-dark-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center">
            <FaChartLine className="mr-2 text-primary" /> Registration Trends
          </h3>
          
          <div className="h-64 flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p>Visualization chart would be here</p>
              <p className="text-sm">Monthly registrations data</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-dark-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center">
            <FaChartLine className="mr-2 text-primary" /> Event Distribution
          </h3>
          
          <div className="h-64 flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p>Visualization chart would be here</p>
              <p className="text-sm">Events by category</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-dark-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Recent Events</h3>
          
          {stats.recentEvents.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-6">No recent events</p>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {stats.recentEvents.map((event) => (
                <div key={event._id} className="py-3">
                  <div className="flex items-center justify-between">
                    <Link 
                      to={`/events/${event._id}`}
                      className="font-medium text-gray-800 dark:text-white hover:text-primary"
                    >
                      {event.title}
                    </Link>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(event.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {event.category} · {event.isPaid ? `₹${event.price}` : 'Free'}
                    </div>
                    <div className="flex items-center">
                      <div className={`h-2 w-2 rounded-full mr-1 ${
                        event.isActive ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {event.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-4 text-right">
            <Link to="/dashboard/events" className="text-primary hover:underline text-sm">
              View all events →
            </Link>
          </div>
        </div>
        
        <div className="bg-white dark:bg-dark-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Recent Registrations</h3>
          
          {stats.recentRegistrations.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-6">No recent registrations</p>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {stats.recentRegistrations.map((registration) => (
                <div key={registration._id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 mr-3 flex items-center justify-center text-xs uppercase font-medium">
                        {registration.user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800 dark:text-white">
                          {registration.user.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {registration.user.email}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(registration.date)}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1 ml-11">
                    <Link 
                      to={`/events/${registration.event._id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {registration.event.title}
                    </Link>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {registration.isPaid ? (
                        <span className="text-green-600 dark:text-green-400">Paid</span>
                      ) : (
                        <span>Free</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-4 text-right">
            <Link to="/dashboard/participants" className="text-primary hover:underline text-sm">
              View all registrations →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview; 