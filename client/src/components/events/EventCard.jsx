import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaMoneyBillWave } from 'react-icons/fa';

const EventCard = ({ event }) => {
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="card hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        <img 
          loading='lazy'
          src={event.image === 'default-event.jpg' ? '/images/default-event.jpg' : event.image} 
          alt={event.title} 
          className="w-full h-40 md:h-48 object-cover"
        />
        <div className="absolute top-0 right-0 bg-primary text-white px-2 py-1 m-2 rounded text-xs md:text-sm">
          {event.category}
        </div>
      </div>
      
      <div className="p-3 md:p-4">
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white mb-1 md:mb-2 truncate">
          {event.title}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm mb-2 md:mb-3 line-clamp-2">
          {event.description}
        </p>
        
        <div className="space-y-1 md:space-y-2 mb-2 md:mb-3">
          <div className="flex items-center text-xs md:text-sm text-gray-600 dark:text-gray-300">
            <FaCalendarAlt className="mr-1 md:mr-2 text-primary" />
            <span>{formatDate(event.startDate)}</span>
          </div>
          
          <div className="flex items-center text-xs md:text-sm text-gray-600 dark:text-gray-300">
            <FaMapMarkerAlt className="mr-1 md:mr-2 text-primary" />
            <span className="truncate">{event.location}</span>
          </div>
          
          <div className="flex items-center text-xs md:text-sm text-gray-600 dark:text-gray-300">
            <FaUsers className="mr-1 md:mr-2 text-primary" />
            <span>
              {event.registeredUsers?.length || 0} / {event.capacity}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-3 md:mt-4">
          <div className="flex items-center">
            {event.isPaid ? (
              <div className="flex items-center text-green-600 dark:text-green-400 text-xs md:text-sm">
                <FaMoneyBillWave className="mr-1" />
                <span>₹{event.price}</span>
              </div>
            ) : (
              <span className="text-xs md:text-sm text-gray-600 dark:text-gray-300">Free</span>
            )}
          </div>
          
          <Link
            to={`/events/${event._id}`}
            className="btn btn-primary text-xs md:text-sm py-1 px-2 md:py-2 md:px-3"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventCard; 