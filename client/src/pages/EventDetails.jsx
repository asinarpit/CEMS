import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaMoneyBillWave, FaClock, FaEdit, FaTrash, FaCheck, FaTimesCircle, FaDownload } from 'react-icons/fa';
import { getEvent, registerForEvent, clearEvent, deleteEvent, unregisterFromEvent } from '../features/events/eventSlice';
import Spinner from '../components/ui/Spinner';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}`;

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const { event, isLoading, isSuccess, isError, message } = useSelector((state) => state.events);
  const { user } = useSelector((state) => state.auth);
  
  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
    
    dispatch(getEvent(id));
    
    return () => {
      dispatch(clearEvent());
    };
  }, [id, isError, message, dispatch]);
  
  // Add a debug effect to properly check the registration status
  useEffect(() => {
    if (event && user) {
      console.log('Event registered users:', event.registeredUsers);
      console.log('Current user ID:', user.id);
      const isUserRegistered = Array.isArray(event.registeredUsers) && 
        event.registeredUsers.some(regUser => 
          // Check both direct comparison and if registeredUsers contains objects
          regUser === user.id || (regUser._id && regUser._id === user.id)
        );
      console.log('Is user registered:', isUserRegistered);
    }
  }, [event, user]);
  
  const isRegistered = user && event && Array.isArray(event.registeredUsers) && 
    event.registeredUsers.some(regUser => 
      // Check both direct comparison and if registeredUsers contains objects
      regUser === user.id || (regUser._id && regUser._id === user.id)
    );
  
  const isOrganizer = user && event?.organizer?._id === user.id;
  
  const isAdmin = user && user.role === 'admin';
  
  const canEdit = isOrganizer || isAdmin;
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const formatTime = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };
  
  const handleRegister = () => {
    if (!user) {
      toast.error('Please log in to register for this event');
      navigate('/login');
      return;
    }
    
    dispatch(registerForEvent(id))
      .unwrap()
      .then((res) => {
        if (res.isPaid) {
          navigate(`/payment/process/${res.data.event}`, { 
            state: { 
              eventId: res.data.event,
              amount: res.data.price
            } 
          });
        } else {
          toast.success('Successfully registered for event');
          dispatch(getEvent(id));
        }
      })
      .catch((err) => {
        toast.error(err);
      });
  };
  
  const handleUnregister = () => {
    if (!user) {
      toast.error('Please log in to perform this action');
      navigate('/login');
      return;
    }
    
    if (window.confirm('Are you sure you want to cancel your registration for this event?')) {
      dispatch(unregisterFromEvent(id))
        .unwrap()
        .then((response) => {
          toast.success('Successfully unregistered from event');
          dispatch(getEvent(id));
        })
        .catch((err) => {
          toast.error(err);
        });
    }
  };
  
  const handleDelete = () => {
    if (confirmDelete) {
      dispatch(deleteEvent(id))
        .unwrap()
        .then(() => {
          toast.success('Event deleted successfully');
          navigate('/');
        })
        .catch((err) => {
          toast.error(err);
        });
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };
  
  const downloadTicket = async () => {
    try {
      if (!user) {
        toast.error('Please log in to download your ticket');
        return;
      }
      
      const token = localStorage.getItem('token');
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob' // Important for downloading files
      };
      
      toast.info('Downloading ticket...');
      
      const response = await axios.get(
        `${API_URL}/events/${id}/ticket`, 
        config
      );
      
      // Create a blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `event-ticket-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Ticket downloaded successfully');
    } catch (error) {
      console.error('Error downloading ticket:', error);
      toast.error('Failed to download ticket. Please try again later.');
    }
  };
  
  if (isLoading || !event) {
    return <Spinner />;
  }

  return (
    <div className="px-4 md:px-0">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="relative h-48 sm:h-56 md:h-64">
              <img 
                src={event.image === 'default-event.jpg' ? '/images/default-event.jpg' : event.image} 
                alt={event.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-0 right-0 bg-primary text-white px-2 py-1 md:px-3 md:py-1 m-3 md:m-4 rounded-md text-xs md:text-sm">
                {event.category}
              </div>
            </div>
            
            <div className="p-4 md:p-6">
              <div className="flex justify-between items-start mb-3 md:mb-4">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                  {event.title}
                </h1>
                
                {canEdit && (
                  <div className="flex space-x-2">
                    <Link 
                      to={`/events/edit/${event._id}`}
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      <FaEdit size={18} />
                    </Link>
                    
                    <button 
                      onClick={handleDelete}
                      className={`${
                        confirmDelete ? 'text-red-600' : 'text-gray-500'
                      } hover:text-red-700 transition-colors`}
                    >
                      <FaTrash size={18} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6 text-sm md:text-base">
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <FaCalendarAlt className="mr-2 text-primary" />
                  <span>{formatDate(event.startDate)}</span>
                </div>
                
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <FaClock className="mr-2 text-primary" />
                  <span>{formatTime(event.startDate)} - {formatTime(event.endDate)}</span>
                </div>
                
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <FaMapMarkerAlt className="mr-2 text-primary" />
                  <span className="truncate">{event.location}</span>
                </div>
                
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <FaUsers className="mr-2 text-primary" />
                  <span>
                    {event.registeredUsers?.length || 0} / {event.capacity} registered
                  </span>
                </div>
              </div>
              
              <div className="mb-4 md:mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  Description
                </h3>
                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {event.description}
                </p>
              </div>
              
              <div className="mb-4 md:mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  Organizer
                </h3>
                <div className="flex items-center">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-300 dark:bg-gray-700 mr-3"></div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white text-sm md:text-base">
                      {event.organizer?.name || 'Anonymous'}
                    </p>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                      {event.organizer?.email || ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="card p-4 md:p-6 sticky top-6 mb-4 lg:mb-0">
            <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white mb-3 md:mb-4">
              Registration
            </h3>
            
            <div className="mb-4 md:mb-6">
              {event.isPaid ? (
                <div className="flex items-center text-green-600 dark:text-green-400 text-xl md:text-2xl font-bold">
                  <FaMoneyBillWave className="mr-2" />
                  <span>₹{event.price}</span>
                </div>
              ) : (
                <div className="text-gray-700 dark:text-gray-300 text-xl md:text-2xl font-bold">
                  Free Event
                </div>
              )}
            </div>
            
            <div className="space-y-3 md:space-y-4">
              {isRegistered ? (
                <div className="space-y-3">
                  <div className="bg-green-100 dark:bg-green-900 p-2 md:p-3 rounded-md text-sm md:text-base text-green-800 dark:text-green-200 flex items-center">
                    <FaCheck className="mr-2" />
                    <span>You are registered for this event</span>
                  </div>
                  <div className="flex flex-col xs:flex-row gap-2 mt-4">
                    <button 
                      onClick={downloadTicket}
                      className="btn btn-secondary flex items-center justify-center"
                    >
                      <FaDownload className="mr-2" /> Download Ticket
                    </button>
                    <button 
                      onClick={handleUnregister}
                      className="btn btn-danger flex items-center justify-center"
                    >
                      <FaTimesCircle className="mr-2" /> Cancel Registration
                    </button>
                  </div>
                </div>
              ) : event.registeredUsers?.length >= event.capacity ? (
                <div className="bg-red-100 dark:bg-red-900 p-2 md:p-3 rounded-md text-sm md:text-base text-red-800 dark:text-red-200">
                  This event is at full capacity
                </div>
              ) : !event.isActive ? (
                <div className="bg-gray-100 dark:bg-gray-800 p-2 md:p-3 rounded-md text-sm md:text-base text-gray-800 dark:text-gray-200">
                  This event is no longer active
                </div>
              ) : (
                <button 
                  onClick={handleRegister}
                  className="btn btn-primary w-full text-sm md:text-base"
                >
                  Register Now
                </button>
              )}
              
              <button 
                onClick={() => navigate('/')}
                className="btn btn-secondary w-full text-sm md:text-base"
              >
                Back to Events
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails; 