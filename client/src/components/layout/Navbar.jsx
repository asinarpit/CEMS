import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaSun, FaMoon, FaBars, FaTimes, FaUser, FaSignOutAlt, FaCalendarPlus } from 'react-icons/fa';
import { toggleTheme } from '../../features/theme/themeSlice';
import { logout, reset } from '../../features/auth/authSlice';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { theme } = useSelector((state) => state.theme);
  const { user } = useSelector((state) => state.auth);
  
  const handleToggleTheme = () => {
    dispatch(toggleTheme());
  };
  
  const handleLogout = () => {
    dispatch(logout());
    dispatch(reset());
    navigate('/');
  };
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-white dark:bg-dark-100 shadow-md">
      <div className="container-custom flex justify-between items-center py-4">
        <Link to="/" className="text-2xl font-bold text-primary">
          CEMS
        </Link>
        
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary">
            Home
          </Link>
          
          {user ? (
            <>
              <Link to="/dashboard" className="text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary">
                Dashboard
              </Link>
              
              {(user.role === 'admin' || user.role === 'organizer') && (
                <Link to="/events/create" className="text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary flex items-center">
                  <FaCalendarPlus className="mr-1" /> Create Event
                </Link>
              )}
              
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary"
              >
                <FaSignOutAlt className="mr-1" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Register
              </Link>
            </>
          )}
          
          <button 
            onClick={handleToggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-dark-200 text-gray-700 dark:text-gray-300"
          >
            {theme === 'dark' ? <FaSun className="text-yellow-500" /> : <FaMoon className="text-gray-700" />}
          </button>
        </div>
        
        <div className="md:hidden flex items-center">
          <button 
            onClick={handleToggleTheme}
            className="p-2 mr-2 rounded-full bg-gray-200 dark:bg-dark-200 text-gray-700 dark:text-gray-300"
          >
            {theme === 'dark' ? <FaSun className="text-yellow-500" /> : <FaMoon className="text-gray-700" />}
          </button>
          
          <button 
            onClick={toggleMenu}
            className="p-2 rounded-md text-gray-700 dark:text-gray-300"
          >
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>
      
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-dark-100 py-2 px-4">
          <Link 
            to="/" 
            className="block py-2 text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary"
            onClick={toggleMenu}
          >
            Home
          </Link>
          
          {user ? (
            <>
              <Link 
                to="/dashboard" 
                className="block py-2 text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary"
                onClick={toggleMenu}
              >
                Dashboard
              </Link>
              
              {(user.role === 'admin' || user.role === 'organizer') && (
                <Link 
                  to="/events/create" 
                  className="py-2 text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary flex items-center"
                  onClick={toggleMenu}
                >
                  <FaCalendarPlus className="mr-1" /> Create Event
                </Link>
              )}
              
              <button
                onClick={() => {
                  handleLogout();
                  toggleMenu();
                }}
                className="w-full text-left py-2 text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary flex items-center"
              >
                <FaSignOutAlt className="mr-1" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="block py-2 text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary"
                onClick={toggleMenu}
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="block py-2 text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary"
                onClick={toggleMenu}
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar; 