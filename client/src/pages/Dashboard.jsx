import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaUniversity, FaGraduationCap, FaCalendarCheck, FaHistory } from 'react-icons/fa';
import { getProfile } from '../features/auth/authSlice';
import Spinner from '../components/ui/Spinner';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  
  const { user, isLoading, isError, message } = useSelector((state) => state.auth);
  
  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    const fetchProfile = async () => {
      try {
        await dispatch(getProfile()).unwrap();
      } catch (error) {
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [isError, message, navigate, dispatch]);
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (isLoading || loading) {
    return <Spinner />;
  }

  const profileImage = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name || 'User') + '&background=random';

  const registeredEvents = user?.registeredEvents || [];
  const hasEvents = registeredEvents.length > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <div className="card p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-28 h-28 rounded-full bg-gray-300 dark:bg-gray-700 mb-4 overflow-hidden">
              <img 
                src={profileImage} 
                alt={user?.name || 'User'} 
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{user?.name || 'User'}</h2>
            <span className="text-gray-600 dark:text-gray-400 capitalize bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-sm mt-2">
              {user?.role || 'student'}
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <FaEnvelope className="mr-2 text-primary" />
              <span>{user?.email || 'No email'}</span>
            </div>
            
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <FaUniversity className="mr-2 text-primary" />
              <span>{user?.department || 'No department'}</span>
            </div>
            
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <FaGraduationCap className="mr-2 text-primary" />
              <span>Year {user?.year || '1'}</span>
            </div>
          </div>
          
          <div className="mt-6">
            <Link to="/profile/edit" className="btn btn-secondary w-full">
              Edit Profile
            </Link>
          </div>
        </div>
      </div>
      
      <div className="md:col-span-2">
        <div className="card p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
            <FaCalendarCheck className="mr-2 text-primary" />
            Registered Events
          </h3>
          
          {hasEvents ? (
            <div className="space-y-4">
              {registeredEvents.map((event) => (
                <div key={event._id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0 last:pb-0">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {event.title || 'Untitled Event'}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {formatDate(event.startDate)}
                      </p>
                      <div className="flex mt-2">
                        <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                          {event.category || 'Unknown'}
                        </span>
                        {event.isPaid && (
                          <span className="text-xs bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-1 rounded ml-2">
                            Paid
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      to={`/events/${event._id}`}
                      className="btn btn-primary mt-3 md:mt-0 text-sm"
                    >
                      View Event
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <FaHistory className="mx-auto text-gray-400 dark:text-gray-600 text-4xl mb-2" />
              <p className="text-gray-600 dark:text-gray-400">
                You haven't registered for any events yet.
              </p>
              <Link to="/" className="btn btn-primary mt-4">
                Explore Events
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 