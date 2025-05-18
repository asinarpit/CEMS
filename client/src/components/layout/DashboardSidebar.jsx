import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  FaUsers, 
  FaCalendarAlt, 
  FaUserCircle,
  FaChevronLeft,
  FaChevronRight,
  FaSignOutAlt,
  FaTimes
} from 'react-icons/fa';
import { logout, reset } from '../../features/auth/authSlice';

const DashboardSidebar = ({ closeMobileMenu }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(false);
      }
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  const isAdmin = user && user.role === 'admin';
  
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = () => {
    dispatch(logout());
    dispatch(reset());
    navigate('/');
  };
  
  const navItems = [
    {
      path: '/dashboard/profile',
      name: 'My Profile',
      icon: <FaUserCircle />,
      access: ['admin', 'organizer']
    },
    {
      path: '/dashboard/events',
      name: 'Events Management',
      icon: <FaCalendarAlt />,
      access: ['admin', 'organizer']
    },
    {
      path: '/dashboard/users',
      name: 'User Management',
      icon: <FaUsers />,
      access: ['admin']
    }
  ];
  
  const filteredNavItems = navItems.filter(item => 
    item.access.includes(user?.role)
  );
  
  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') {
      return true;
    }
    return location.pathname.startsWith(path) && path !== '/dashboard';
  };

  const handleLinkClick = () => {
    if (isMobile && closeMobileMenu) {
      closeMobileMenu();
    }
  };
  
  return (
    <div className={`h-full bg-dark-100 dark:bg-dark-200 ${collapsed && !isMobile ? 'w-20' : 'w-64'} transition-all duration-300`}>
      <div className="h-full flex flex-col text-white shadow-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {(!collapsed || isMobile) && (
            <h2 className="text-xl font-bold text-primary">Dashboard</h2>
          )}
          
          {isMobile ? (
            <button
              onClick={closeMobileMenu}
              className="p-2 rounded-full hover:bg-dark-300 text-gray-400 hover:text-white"
            >
              <FaTimes />
            </button>
          ) : (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-full hover:bg-dark-300 text-gray-400 hover:text-white"
            >
              {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
            </button>
          )}
        </div>
        
        <div className="overflow-y-auto flex-grow">
          <ul className="pt-2">
            {filteredNavItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={handleLinkClick}
                  className={`flex items-center p-4 ${
                    collapsed && !isMobile ? 'justify-center' : 'space-x-3'
                  } ${
                    isActive(item.path)
                      ? 'bg-primary text-white'
                      : 'text-gray-300 hover:bg-dark-300'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {(!collapsed || isMobile) && <span>{item.name}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="p-4 border-t border-gray-700">
          <div
            className={`flex items-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-dark-300 cursor-pointer ${
              collapsed && !isMobile ? 'justify-center' : 'space-x-3'
            }`}
            onClick={() => {
              handleLogout();
              handleLinkClick();
            }}
          >
            <span className="text-lg"><FaSignOutAlt /></span>
            {(!collapsed || isMobile) && <span>Logout</span>}
          </div>
          
          <Link
            to="/"
            onClick={handleLinkClick}
            className={`mt-2 flex items-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-dark-300 ${
              collapsed && !isMobile ? 'justify-center' : 'space-x-3'
            }`}
          >
            <span className="text-lg"><FaSignOutAlt /></span>
            {(!collapsed || isMobile) && <span>Back to Site</span>}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar; 