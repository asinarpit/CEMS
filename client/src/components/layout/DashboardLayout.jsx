import { useState } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import { useSelector } from 'react-redux';
import { FaBars } from 'react-icons/fa';

const DashboardLayout = () => {
  const [showSidebar, setShowSidebar] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  
  if (!user || (user.role !== 'admin' && user.role !== 'organizer')) {
    return <Navigate to="/" />;
  }
  
  if (location.pathname === '/dashboard') {
    return <Navigate to="/dashboard/profile" replace />;
  }

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };
  
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-gray-100 dark:bg-dark-300">
      {/* Mobile menu button */}
      <div className="md:hidden flex items-center p-4 bg-white dark:bg-dark-100 shadow-md z-20">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-200"
        >
          <FaBars />
        </button>
        <h1 className="ml-4 text-xl font-bold text-primary">Dashboard</h1>
      </div>
      
      {/* Sidebar */}
      <div className={`fixed inset-0 z-10 transition-transform transform ${showSidebar ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="absolute inset-0 bg-black bg-opacity-50 md:hidden" onClick={toggleSidebar}></div>
        <div className="relative h-full">
          <DashboardSidebar closeMobileMenu={() => setShowSidebar(false)} />
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden pt-0 md:pt-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="container mx-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout; 