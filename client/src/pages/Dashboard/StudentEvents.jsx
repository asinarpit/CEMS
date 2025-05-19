import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaMapMarkerAlt, FaClock, FaDownload, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import Spinner from '../../components/ui/Spinner';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}`;

const StudentEvents = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [error, setError] = useState(null);
  
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  
  useEffect(() => {
    const fetchRegisteredEvents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        
        if (!token || !user) {
          throw new Error('Authentication required');
        }
        
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        // First try the dedicated endpoint
        try {
          console.log('Attempting to fetch registered events from users/registered-events...');
          const response = await axios.get(`${API_URL}/users/registered-events`, config);
          
          if (response.data.success) {
            console.log('Successfully fetched from users/registered-events');
            setEvents(response.data.data);
            return;
          }
        } catch (primaryError) {
          console.error('Error with primary endpoint:', primaryError);
          // Continue to fallback approach
        }
        
        // Fallback: Get user profile which includes registeredEvents
        try {
          console.log('Falling back to auth/me endpoint...');
          const userResponse = await axios.get(`${API_URL}/auth/me`, config);
          
          if (userResponse.data.success && userResponse.data.data.registeredEvents) {
            console.log('Successfully fetched from auth/me');
            setEvents(userResponse.data.data.registeredEvents);
            return;
          }
        } catch (fallbackError) {
          console.error('Error with fallback endpoint:', fallbackError);
          // Continue to the next fallback
        }
        
        // If both approaches fail, try a different approach with individual requests
        console.log('Fetching individual events as last resort...');
        if (user && user.registeredEvents && Array.isArray(user.registeredEvents)) {
          const eventPromises = user.registeredEvents.map(eventId => 
            axios.get(`${API_URL}/events/${eventId}`, config)
              .then(res => res.data.data)
              .catch(err => null) // Return null for failed requests
          );
          
          const eventResults = await Promise.all(eventPromises);
          const validEvents = eventResults.filter(event => event !== null);
          
          if (validEvents.length > 0) {
            console.log('Successfully fetched individual events');
            setEvents(validEvents);
            return;
          }
        }
        
        // If all approaches fail, show a helpful error
        throw new Error('Unable to retrieve your registered events');
      } catch (error) {
        console.error('Error fetching registered events:', error);
        setError(error.message || 'Error fetching your events');
        toast.error(error.message || 'Error fetching your registered events');
        // Set events to empty array to avoid undefined errors
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRegisteredEvents();
  }, [user]);
  
  // Format date
  const formatDate = (dateString) => {
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Date unavailable';
    }
  };
  
  // Format time
  const formatTime = (dateString) => {
    try {
      const options = { hour: '2-digit', minute: '2-digit' };
      return new Date(dateString).toLocaleTimeString(undefined, options);
    } catch (err) {
      console.error('Error formatting time:', err);
      return 'Time unavailable';
    }
  };
  
  // Download ticket
  const downloadTicket = async (eventId) => {
    try {
      const token = localStorage.getItem('token');
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob' // Important for downloading files
      };
      
      const response = await axios.get(
        `${API_URL}/events/${eventId}/ticket`, 
        config
      );
      
      // Create a blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `event-ticket-${eventId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Ticket downloaded successfully');
    } catch (error) {
      toast.error('Failed to download ticket');
      console.error('Error downloading ticket:', error);
    }
  };
  
  // Filter events based on active tab
  const filteredEvents = events.filter(event => {
    if (!event || !event.startDate) return false;
    
    try {
      const eventDate = new Date(event.startDate);
      const today = new Date();
      
      if (activeTab === 'upcoming') {
        return eventDate > today;
      } else if (activeTab === 'past') {
        return eventDate < today;
      }
      
      return true; // for "all" tab
    } catch (err) {
      console.error('Error filtering event:', err);
      return false;
    }
  });
  
  // Sort by date
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    try {
      if (activeTab === 'upcoming') {
        return new Date(a.startDate) - new Date(b.startDate);
      } else {
        return new Date(b.startDate) - new Date(a.startDate);
      }
    } catch (err) {
      console.error('Error sorting events:', err);
      return 0;
    }
  });
  
  if (isLoading) {
    return <Spinner />;
  }
  
  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">My Events</h1>
        <div className="text-red-700 dark:text-red-300 mb-4">
          <p>{error}</p>
        </div>
        <Link to="/" className="btn btn-primary">
          Browse Events
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">My Events</h1>
      
      <div className="mb-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'upcoming'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 dark:text-gray-400 hover:text-primary'
            }`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'past'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 dark:text-gray-400 hover:text-primary'
            }`}
            onClick={() => setActiveTab('past')}
          >
            Past
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'all'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 dark:text-gray-400 hover:text-primary'
            }`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
        </div>
      </div>
      
      {sortedEvents.length === 0 ? (
        <div className="bg-gray-100 dark:bg-dark-200 rounded-lg p-8 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {activeTab === 'upcoming'
              ? "You don't have any upcoming events."
              : activeTab === 'past'
              ? "You don't have any past events."
              : "You haven't registered for any events yet."}
          </p>
          <Link to="/" className="btn btn-primary">
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedEvents.map((event) => {
            if (!event) return null;
            
            const isUpcoming = new Date(event.startDate) > new Date();
            const isPast = new Date(event.endDate) < new Date();
            const isOngoing = !isUpcoming && !isPast;
            
            return (
              <div
                key={event._id}
                className="bg-white dark:bg-dark-200 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/4 relative">
                    <img
                      src={event.image === 'default-event.jpg' ? '/images/default-event.jpg' : event.image}
                      alt={event.title}
                      className="w-full h-48 md:h-full object-cover"
                    />
                    <div className="absolute top-0 right-0 m-2 bg-primary text-white px-2 py-1 rounded text-xs">
                      {event.category}
                    </div>
                  </div>
                  
                  <div className="p-4 md:p-6 flex-1">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                          {event.title}
                        </h2>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <FaCalendarAlt className="mr-2 text-primary" />
                            <span>{formatDate(event.startDate)}</span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <FaClock className="mr-2 text-primary" />
                            <span>{formatTime(event.startDate)} - {formatTime(event.endDate)}</span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <FaMapMarkerAlt className="mr-2 text-primary" />
                            <span>{event.location}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 md:mt-0">
                        {isOngoing && (
                          <div className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium mb-2">
                            Happening now
                          </div>
                        )}
                        {isUpcoming && (
                          <div className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium mb-2">
                            Upcoming
                          </div>
                        )}
                        {isPast && (
                          <div className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 px-3 py-1 rounded-full text-sm font-medium mb-2">
                            Past
                          </div>
                        )}
                        
                        <div className="mt-2">
                          {event.isPaid ? (
                            <div className="text-green-600 dark:text-green-400 font-medium">
                              Paid: ₹{event.price}
                            </div>
                          ) : (
                            <div className="text-gray-600 dark:text-gray-400">Free Event</div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="mb-2 md:mb-0">
                        <Link
                          to={`/events/${event._id}`}
                          className="text-primary hover:underline"
                        >
                          View Event Details
                        </Link>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => downloadTicket(event._id)}
                          className="flex items-center btn btn-secondary text-sm"
                        >
                          <FaDownload className="mr-1" /> Ticket
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentEvents; 