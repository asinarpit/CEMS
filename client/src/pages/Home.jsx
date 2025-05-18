import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { FaSearch, FaFilter } from 'react-icons/fa';
import { getEvents, reset } from '../features/events/eventSlice';
import EventCard from '../components/events/EventCard';
import Spinner from '../components/ui/Spinner';

const Home = () => {
  const dispatch = useDispatch();
  const { events, isLoading, isError, message } = useSelector((state) => state.events);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([]);
  
  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
    
    dispatch(getEvents());
    
    return () => {
      dispatch(reset());
    };
  }, [dispatch, isError, message]);
  
  useEffect(() => {
    if (events) {
      setFilteredEvents(
        events.filter((event) => {
          const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               event.description.toLowerCase().includes(searchTerm.toLowerCase());
          
          const matchesCategory = filterCategory ? event.category === filterCategory : true;
          
          return matchesSearch && matchesCategory;
        })
      );
    }
  }, [events, searchTerm, filterCategory]);
  
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
    <div className="px-4 md:px-0">
      <section className="bg-gray-900 text-white py-10 md:py-20 rounded-lg mb-6 md:mb-10">
        <div className="container-custom text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
            College Event <span className="text-primary">Management</span>
          </h1>
          <p className="text-lg md:text-xl mb-5 md:mb-8 max-w-2xl mx-auto px-4">
            Discover, register, and manage all your college events in one place.
          </p>
          
          <div className="max-w-2xl mx-auto flex flex-col gap-3 px-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 md:py-3 px-4 pl-10 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-gray-800"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            <div className="relative">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full py-2 md:py-3 px-4 pl-10 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-gray-800 appearance-none pr-8"
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
        </div>
      </section>
      
      <section className="pb-10">
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-800 dark:text-white">
          Upcoming Events
        </h2>
        
        {filteredEvents.length === 0 ? (
          <div className="text-center py-6 md:py-10">
            <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg">
              No events found. Try a different search term.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home; 