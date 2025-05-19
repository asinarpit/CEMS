import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter, FaDownload, FaEnvelope, FaUsers, FaArrowLeft, FaTicketAlt, FaCheck, FaTimes, FaFileCsv, FaCalendarAlt, FaUser, FaListAlt } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import Spinner from '../../components/ui/Spinner';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}`;

const ParticipantsPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(eventId || '');
  const [participants, setParticipants] = useState([]);
  const [filteredParticipants, setFilteredParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);
  
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user && user.role === 'admin';
  
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          toast.error('Authentication required');
          return;
        }
        
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        // For organizers, only fetch their events
        // For admins, fetch all events
        const endpoint = user.role === 'organizer' 
          ? `${API_URL}/events/organizer` 
          : `${API_URL}/events`;
        
        const response = await axios.get(endpoint, config);
        
        if (response.data.success) {
          setEvents(response.data.data);
          
          // Set selected event if eventId param exists and is valid
          if (eventId) {
            const eventExists = response.data.data.some(event => event._id === eventId);
            if (eventExists) {
              setSelectedEvent(eventId);
            } else if (response.data.data.length > 0) {
              setSelectedEvent(response.data.data[0]._id);
            }
          } else if (response.data.data.length > 0) {
            setSelectedEvent(response.data.data[0]._id);
          }
        } else {
          throw new Error('Failed to fetch events');
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error(error.response?.data?.message || 'Error fetching events');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, [user, eventId]);
  
  useEffect(() => {
    const fetchParticipants = async () => {
      if (!selectedEvent) return;
      
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          toast.error('Authentication required');
          return;
        }
        
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        const response = await axios.get(`${API_URL}/events/${selectedEvent}/participants`, config);
        
        if (response.data.success) {
          setParticipants(response.data.data);
          setFilteredParticipants(response.data.data);
        } else {
          throw new Error('Failed to fetch participants');
        }
      } catch (error) {
        console.error('Error fetching participants:', error);
        toast.error(error.response?.data?.message || 'Error fetching participants');
        setParticipants([]);
        setFilteredParticipants([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchParticipants();
  }, [selectedEvent]);
  
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredParticipants(participants);
      return;
    }
    
    const searchLower = searchTerm.toLowerCase();
    const results = participants.filter(
      participant =>
        participant.name.toLowerCase().includes(searchLower) ||
        participant.email.toLowerCase().includes(searchLower) ||
        (participant.department && participant.department.toLowerCase().includes(searchLower)) ||
        (participant.year && participant.year.toString().includes(searchLower)) ||
        (participant.ticketId && participant.ticketId.toLowerCase().includes(searchLower))
    );
    
    setFilteredParticipants(results);
  }, [searchTerm, participants]);
  
  useEffect(() => {
    const sorted = [...filteredParticipants].sort((a, b) => {
      if (sortField === 'name') {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortField === 'email') {
        return sortOrder === 'asc'
          ? a.email.localeCompare(b.email)
          : b.email.localeCompare(a.email);
      } else if (sortField === 'department') {
        const deptA = a.department || '';
        const deptB = b.department || '';
        return sortOrder === 'asc'
          ? deptA.localeCompare(deptB)
          : deptB.localeCompare(deptA);
      } else if (sortField === 'year') {
        const yearA = a.year || 0;
        const yearB = b.year || 0;
        return sortOrder === 'asc'
          ? yearA - yearB
          : yearB - yearA;
      } else if (sortField === 'registrationDate') {
        const dateA = new Date(a.registrationDate || 0);
        const dateB = new Date(b.registrationDate || 0);
        return sortOrder === 'asc'
          ? dateA - dateB
          : dateB - dateA;
      }
      return 0;
    });
    
    setFilteredParticipants(sorted);
  }, [sortField, sortOrder]);
  
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const exportToCSV = () => {
    if (filteredParticipants.length === 0) {
      toast.error('No participants to export');
      return;
    }
    
    try {
      const event = events.find(e => e._id === selectedEvent);
      const eventName = event ? event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'participants';
      
      const headers = ['Name', 'Email', 'Department', 'Year', 'Registration Date', 'Ticket ID', 'Paid'];
      
      const csvContent = [
        headers.join(','),
        ...filteredParticipants.map(p => [
          `"${p.name || ''}"`,
          `"${p.email || ''}"`,
          `"${p.department || ''}"`,
          p.year || '',
          p.registrationDate ? new Date(p.registrationDate).toISOString() : '',
          `"${p.ticketId || ''}"`,
          p.paid ? 'Yes' : 'No'
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${eventName}_participants_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Participants exported successfully');
    } catch (error) {
      console.error('Error exporting participants:', error);
      toast.error('Failed to export participants');
    }
  };
  
  const sendEmailToAll = () => {
    toast.info('Email functionality to be implemented');
  };
  
  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg">
        <h2 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">Error</h2>
        <p className="text-red-600 dark:text-red-200">{error}</p>
      </div>
    );
  }
  
  if (isLoading && events.length === 0) {
    return <Spinner />;
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Event Participants</h1>
        
        <div className="flex space-x-2">
          <button
            onClick={exportToCSV}
            className="btn btn-secondary flex items-center"
            disabled={filteredParticipants.length === 0}
          >
            <FaFileCsv className="mr-2" /> Export CSV
          </button>
          
          <button
            onClick={sendEmailToAll}
            className="btn btn-primary flex items-center"
            disabled={filteredParticipants.length === 0}
          >
            <FaEnvelope className="mr-2" /> Email All
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-dark-200 rounded-lg shadow p-4 mb-6">
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-2">
            Select Event
          </label>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-dark-300 text-gray-900 dark:text-white"
          >
            {events.length === 0 ? (
              <option value="">No events available</option>
            ) : (
              events.map(event => (
                <option key={event._id} value={event._id}>
                  {event.title} ({formatDate(event.startDate)})
                </option>
              ))
            )}
          </select>
        </div>
        
        {selectedEvent && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Event Details</h2>
            {events.length > 0 && selectedEvent && (
              (() => {
                const event = events.find(e => e._id === selectedEvent);
                return event ? (
                  <div className="flex flex-col md:flex-row md:justify-between gap-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                      <div className="flex items-center">
                        <FaCalendarAlt className="text-primary mr-2" />
                        <span>{formatDate(event.startDate)}</span>
                      </div>
                      <div className="flex items-center">
                        <FaUsers className="text-primary mr-2" />
                        <span>{filteredParticipants.length} / {event.capacity || 'Unlimited'} participants</span>
                      </div>
                    </div>
                    
                    <Link to={`/events/${event._id}`} className="text-primary hover:underline">
                      View Event Details
                    </Link>
                  </div>
                ) : null;
              })()
            )}
          </div>
        )}
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FaSearch className="text-gray-500 dark:text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search participants by name, email, department..."
            className="w-full pl-10 p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-dark-300 text-gray-900 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {isLoading && selectedEvent ? (
        <Spinner />
      ) : filteredParticipants.length === 0 ? (
        <div className="bg-white dark:bg-dark-200 rounded-lg shadow p-6 text-center">
          <div className="flex justify-center mb-4">
            <FaUsers className="text-gray-400 text-5xl" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No Participants Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm
              ? "No participants match your search criteria."
              : "There are no registrations for this event yet."}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-200 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100 dark:bg-dark-300 text-xs uppercase">
                <tr>
                  <th 
                    className="px-6 py-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-dark-400"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      <FaUser className="mr-1" />
                      Name
                      {sortField === 'name' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-dark-400"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center">
                      <FaEnvelope className="mr-1" />
                      Email
                      {sortField === 'email' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-dark-400"
                    onClick={() => handleSort('department')}
                  >
                    <div className="flex items-center">
                      Department
                      {sortField === 'department' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-dark-400"
                    onClick={() => handleSort('year')}
                  >
                    <div className="flex items-center">
                      Year
                      {sortField === 'year' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-dark-400"
                    onClick={() => handleSort('registrationDate')}
                  >
                    <div className="flex items-center">
                      <FaCalendarAlt className="mr-1" />
                      Registration Date
                      {sortField === 'registrationDate' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3">
                    <div className="flex items-center">
                      <FaListAlt className="mr-1" />
                      Ticket ID
                    </div>
                  </th>
                  <th className="px-6 py-3">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredParticipants.map((participant) => (
                  <tr key={participant._id} className="hover:bg-gray-50 dark:hover:bg-dark-300">
                    <td className="px-6 py-4 font-medium">
                      {participant.name}
                    </td>
                    <td className="px-6 py-4">
                      {participant.email}
                    </td>
                    <td className="px-6 py-4">
                      {participant.department || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {participant.year || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(participant.registrationDate)}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm">
                      {participant.ticketId || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {participant.paid ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Paid
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                          Free
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {filteredParticipants.length > 0 && (
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredParticipants.length} of {participants.length} participants
        </div>
      )}
    </div>
  );
};

export default ParticipantsPage; 