import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter, FaDownload, FaEnvelope, FaUsers, FaArrowLeft, FaTicketAlt, FaCheck, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import Spinner from '../../components/ui/Spinner';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}`;

const ParticipantsPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [filteredParticipants, setFilteredParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [event, setEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user && user.role === 'admin';
  
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        // Debug message
        console.log('Fetching events...');
        
        const url = isAdmin 
          ? `${API_URL}/events` 
          : `${API_URL}/events`; // Use a common endpoint for now
        
        const response = await axios.get(url, config);
        console.log('Events response:', response.data);
        
        if (response.data.success) {
          // Filter events organized by this user if not admin
          let filteredEvents = response.data.data;
          if (!isAdmin && user.role === 'organizer') {
            filteredEvents = filteredEvents.filter(e => e.organizer._id === user.id);
          }
          setEvents(filteredEvents);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setError(error.message || 'Error fetching events');
        toast.error('Error fetching events');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!eventId) {
      fetchEvents();
    }
  }, [isAdmin, eventId, user]);
  
  useEffect(() => {
    const fetchParticipants = async () => {
      if (!eventId) return;
      
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        // Debug message
        console.log(`Fetching participants for event ${eventId}...`);
        
        // First, get the event details
        const eventResponse = await axios.get(`${API_URL}/events/${eventId}`, config);
        console.log('Event response:', eventResponse.data);
        
        if (eventResponse.data.success) {
          const eventData = eventResponse.data.data;
          setEvent(eventData);
          
          // Create formatted participants from registeredUsers
          if (eventData.registeredUsers && Array.isArray(eventData.registeredUsers)) {
            const formattedParticipants = eventData.registeredUsers.map(user => ({
              _id: user._id,
              user: user,
              attended: false, // Default value since we don't track attendance yet
              paid: eventData.isPaid, // Assume all registered users for paid events have paid
              registeredAt: user.createdAt || new Date()
            }));
            
            setParticipants(formattedParticipants);
            setFilteredParticipants(formattedParticipants);
            console.log('Formatted participants:', formattedParticipants);
          } else {
            console.log('No registeredUsers found in the event data');
            setParticipants([]);
            setFilteredParticipants([]);
          }
        }
      } catch (error) {
        console.error('Error fetching participants:', error);
        setError(error.message || 'Error fetching participants');
        toast.error('Error fetching participants');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchParticipants();
  }, [eventId]);
  
  // Apply filters
  useEffect(() => {
    if (!participants) return;
    
    let results = participants;
    
    // Search term filter
    if (searchTerm) {
      results = results.filter(participant => 
        participant.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        participant.user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Status filter (attendance)
    if (statusFilter !== 'all') {
      const attended = statusFilter === 'attended';
      results = results.filter(participant => participant.attended === attended);
    }
    
    // Payment filter
    if (paymentFilter !== 'all') {
      const paid = paymentFilter === 'paid';
      results = results.filter(participant => participant.paid === paid);
    }
    
    setFilteredParticipants(results);
    setCurrentPage(1); // Reset to first page on filter change
  }, [searchTerm, statusFilter, paymentFilter, participants]);
  
  // Pagination
  const totalPages = Math.ceil((filteredParticipants?.length || 0) / pageSize);
  const paginatedParticipants = filteredParticipants?.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  ) || [];
  
  // Export to CSV
  const exportToCSV = () => {
    if (!filteredParticipants || !filteredParticipants.length) return;
    
    const headers = ['Name', 'Email', 'Registered On', 'Ticket Type', 'Payment Status', 'Attendance'];
    
    const csvData = filteredParticipants.map(p => [
      p.user.name,
      p.user.email,
      new Date(p.registeredAt).toISOString(),
      p.paid ? 'Paid' : 'Free',
      p.paid ? 'Paid' : 'N/A',
      p.attended ? 'Attended' : 'Not Attended'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `participants-${event?.title.replace(/\s+/g, '-').toLowerCase() || 'event'}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    toast.success('Participants data exported successfully');
  };
  
  // Mark attendance
  const toggleAttendance = async (participantId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      // Just update local state for now, since attendance is not tracked on the server
      const updatedParticipants = participants.map(p => 
        p._id === participantId ? { ...p, attended: !currentStatus } : p
      );
      
      setParticipants(updatedParticipants);
      
      toast.success(`Attendance ${!currentStatus ? 'marked' : 'unmarked'} successfully`);
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Error updating attendance');
    }
  };
  
  // Send email to participants
  const sendEmailToAll = () => {
    // Redirect to email page with participant IDs
    if (filteredParticipants && filteredParticipants.length) {
      const participantIds = filteredParticipants.map(p => p._id).join(',');
      navigate(`/dashboard/email/${eventId}?participants=${participantIds}`);
    }
  };
  
  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg">
        <h2 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">Error</h2>
        <p className="text-red-600 dark:text-red-200">{error}</p>
      </div>
    );
  }
  
  if (isLoading && eventId) {
    return <Spinner />;
  }
  
  // If no event is selected, show events list
  if (!eventId) {
    return (
      <div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 md:mb-0">Events Participants</h1>
        </div>
        
        {isLoading ? (
          <Spinner />
        ) : events.length === 0 ? (
          <div className="bg-white dark:bg-dark-200 rounded-lg p-8 text-center">
            <FaUsers className="text-5xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">No events found</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              You don't have any events yet. Create one to start managing participants.
            </p>
            <Link 
              to="/events/create" 
              className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
            >
              Create Event
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <div 
                key={event._id}
                className="bg-white dark:bg-dark-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-40 bg-gray-200 dark:bg-gray-700 relative">
                  {event.image ? (
                    <img 
                      src={event.image} 
                      alt={event.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaUsers className="text-4xl text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 line-clamp-1">
                    {event.title}
                  </h3>
                  
                  <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm mb-4">
                    <FaUsers className="mr-1" />
                    <span>{event.registeredUsers?.length || 0} participants</span>
                  </div>
                  
                  <Link 
                    to={`/dashboard/participants/${event._id}`}
                    className="w-full flex items-center justify-center px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
                  >
                    View Participants
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <button 
            onClick={() => navigate('/dashboard/participants')}
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-primary mb-2"
          >
            <FaArrowLeft className="mr-1" /> Back to Events
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {event?.title} - Participants
          </h1>
        </div>
        
        <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0">
          <button 
            onClick={sendEmailToAll}
            disabled={!filteredParticipants || filteredParticipants.length === 0}
            className="btn btn-secondary flex items-center justify-center"
          >
            <FaEnvelope className="mr-2" /> Email Participants
          </button>
          
          <button 
            onClick={exportToCSV}
            disabled={!filteredParticipants || filteredParticipants.length === 0}
            className="btn btn-primary flex items-center justify-center"
          >
            <FaDownload className="mr-2" /> Export to CSV
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white dark:bg-dark-200 rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-100 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="relative">
            <FaCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-100 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
            >
              <option value="all">All Attendance</option>
              <option value="attended">Attended</option>
              <option value="not-attended">Not Attended</option>
            </select>
          </div>
          
          <div className="relative">
            <FaTicketAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-100 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
            >
              <option value="all">All Ticket Types</option>
              <option value="paid">Paid Tickets</option>
              <option value="free">Free Tickets</option>
            </select>
          </div>
          
          <div className="relative">
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-100 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Participants Table */}
      {!filteredParticipants || filteredParticipants.length === 0 ? (
        <div className="bg-white dark:bg-dark-200 rounded-lg p-8 text-center">
          <FaUsers className="text-5xl text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">No participants found</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {participants && participants.length > 0
              ? 'Try changing your search criteria'
              : 'This event has no registered participants yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-200 rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-dark-300 text-left">
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm uppercase">Participant</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm uppercase">Registered On</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm uppercase">Ticket Type</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm uppercase">Payment</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm uppercase">Attendance</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedParticipants.map(participant => (
                <tr key={participant._id} className="hover:bg-gray-50 dark:hover:bg-dark-300">
                  <td className="p-4">
                    <div className="text-gray-800 dark:text-gray-200 font-medium">
                      {participant.user.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {participant.user.email}
                    </div>
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">
                    {new Date(participant.registeredAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="p-4">
                    {participant.paid ? (
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        <FaTicketAlt className="mr-1" /> Paid
                      </div>
                    ) : (
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                        <FaTicketAlt className="mr-1" /> Free
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    {participant.paid ? (
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <FaCheck className="mr-1" /> Paid
                      </div>
                    ) : (
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                        N/A
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    {participant.attended ? (
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <FaCheck className="mr-1" /> Attended
                      </div>
                    ) : (
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        <FaTimes className="mr-1" /> Not Attended
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleAttendance(participant._id, participant.attended)}
                      className={`flex items-center text-sm font-medium ${
                        participant.attended
                          ? 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300'
                          : 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300'
                      }`}
                    >
                      {participant.attended ? (
                        <>
                          <FaTimes className="mr-1" /> Mark as Not Attended
                        </>
                      ) : (
                        <>
                          <FaCheck className="mr-1" /> Mark as Attended
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredParticipants.length)} of {filteredParticipants.length} participants
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 dark:bg-dark-300 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-white dark:bg-dark-200 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-300'
                  }`}
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-md ${
                        currentPage === pageNum
                          ? 'bg-primary text-white'
                          : 'bg-white dark:bg-dark-200 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 dark:bg-dark-300 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-white dark:bg-dark-200 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-300'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ParticipantsPage; 