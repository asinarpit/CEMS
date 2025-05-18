import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaPlus, FaTrash, FaEdit, FaEye, FaFilter, FaSearch } from 'react-icons/fa';
import { getEvents, deleteEvent, reset } from '../../features/events/eventSlice';
import Spinner from '../../components/ui/Spinner';

const EventManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { events, isLoading, isSuccess, isError, message } = useSelector((state) => state.events);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  
  const isAdmin = user && user.role === 'admin';
  
  useEffect(() => {
    dispatch(getEvents());
    
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);
  
  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
  }, [isError, message]);
  
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    
    setDeleteInProgress(true);
    setDeletingId(id);
    
    try {
      await dispatch(deleteEvent(id)).unwrap();
      toast.success('Event deleted successfully');
      dispatch(getEvents());
    } catch (error) {
      toast.error('Failed to delete event: ' + (error.message || 'Unknown error'));
    } finally {
      setDeleteInProgress(false);
      setDeletingId(null);
    }
  };
  
  const handleCreateEvent = () => {
    navigate('/events/create');
  };
  
  const handleEditEvent = (id) => {
    navigate(`/events/edit/${id}`);
  };
  
  const handleViewEvent = (id) => {
    navigate(`/events/${id}`);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const filteredEvents = events?.filter((event) => {
    if (!isAdmin && event.organizer?._id !== user?.id) {
      return false;
    }
    
    const matchesSearch = 
      event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter ? event.category === categoryFilter : true;
    
    return matchesSearch && matchesCategory;
  }) || [];
  
  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'academic', label: 'Academic' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'sports', label: 'Sports' },
    { value: 'technical', label: 'Technical' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'other', label: 'Other' }
  ];
  
  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 md:mb-0">
          Event Management
        </h1>
        
        <button 
          onClick={handleCreateEvent}
          className="btn btn-primary flex items-center"
        >
          <FaPlus className="mr-2" /> Add New Event
        </button>
      </div>
      
      <div className="card p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search events..."
              className="form-input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          
          <div className="relative w-full md:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-input pl-10 w-full appearance-none"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-dark-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Registrations
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-100 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <tr key={event._id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <img
                            src={event.image}
                            alt={event.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/40x40?text=Event';
                            }}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {event.title}
                          </div>
                          <div className="flex mt-1">
                            <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                              {event.category}
                            </span>
                            {event.isPaid && (
                              <span className="text-xs bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-1 rounded ml-2">
                                Paid
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(event.startDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {event.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {event.registeredUsers?.length || 0} / {event.capacity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewEvent(event._id)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                        title="View Event"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleEditEvent(event._id)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mx-3"
                        title="Edit Event"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(event._id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        disabled={deleteInProgress}
                        title="Delete Event"
                      >
                        {deleteInProgress && deletingId === event._id ? (
                          <span className="inline-block w-4 h-4 border-2 border-t-2 border-red-500 rounded-full animate-spin"></span>
                        ) : (
                          <FaTrash />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    {searchTerm || categoryFilter 
                      ? 'No events found matching your search criteria' 
                      : 'No events found. Create your first event!'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EventManagement; 