import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaCalendarCheck, FaUsers, FaUserCheck, FaChartLine } from 'react-icons/fa';
import { getEvents } from '../../features/events/eventSlice';
import Spinner from '../../components/ui/Spinner';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}`;

const DashboardHome = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { events, isLoading } = useSelector((state) => state.events);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    registeredUsers: 0,
    isLoading: true
  });
  
  const isAdmin = user && user.role === 'admin';
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        await dispatch(getEvents()).unwrap();
        
        if (isAdmin) {
          const token = localStorage.getItem('token');
          const config = {
            headers: {
              Authorization: `Bearer ${token}`
            }
          };
          
          const response = await axios.get(`${API_URL}/users`, config);
          setStats({
            totalUsers: response.data.count || 0,
            totalEvents: events?.length || 0,
            registeredUsers: calculateRegisteredUsers(events),
            isLoading: false
          });
        } else {
          setStats({
            totalEvents: events?.length || 0,
            myEvents: events?.filter(event => event.organizer?._id === user?.id)?.length || a,
            registeredUsers: calculateRegisteredUsers(events),
            isLoading: false
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    fetchStats();
  }, [dispatch, isAdmin, user?.id]);
  
  const calculateRegisteredUsers = (events) => {
    if (!events || !Array.isArray(events)) return 0;
    
    if (user.role === 'organizer') {
      const myEvents = events.filter(event => event.organizer?._id === user.id);
      return myEvents.reduce((total, event) => total + (event.registeredUsers?.length || 0), 0);
    }
    
    return events.reduce((total, event) => total + (event.registeredUsers?.length || 0), 0);
  };
  
  if (isLoading || stats.isLoading) {
    return <Spinner />;
  }
  
  const statCards = [
    {
      title: 'Total Events',
      value: stats.totalEvents,
      icon: <FaCalendarCheck className="text-blue-500" />,
      color: 'bg-blue-100 dark:bg-blue-900'
    },
    {
      title: isAdmin ? 'Total Users' : 'My Events',
      value: isAdmin ? stats.totalUsers : stats.myEvents,
      icon: isAdmin ? <FaUsers className="text-green-500" /> : <FaCalendarCheck className="text-green-500" />,
      color: 'bg-green-100 dark:bg-green-900'
    },
    {
      title: 'Total Registrations',
      value: stats.registeredUsers,
      icon: <FaUserCheck className="text-purple-500" />,
      color: 'bg-purple-100 dark:bg-purple-900'
    },
    {
      title: 'Active Events',
      value: events?.filter(event => event.isActive)?.length || 0,
      icon: <FaChartLine className="text-orange-500" />,
      color: 'bg-orange-100 dark:bg-orange-900'
    },
  ];
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        Dashboard Overview
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div key={index} className={`card p-6 ${card.color}`}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">
                  {card.title}
                </p>
                <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-1">
                  {card.value}
                </h3>
              </div>
              <div className="text-3xl">
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
          Recent Activity
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {isAdmin ? 
            'Welcome to the admin dashboard. From here you can manage users, events, and view system statistics.' : 
            'Welcome to your dashboard. From here you can manage your events and track participant registrations.'}
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
            {isAdmin ? 'Latest Users' : 'My Latest Events'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            This panel will display {isAdmin ? 'recently registered users' : 'your most recently created events'}.
          </p>
        </div>
        
        <div className="card p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
            Upcoming Events
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            This panel will display upcoming events on the platform.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome; 