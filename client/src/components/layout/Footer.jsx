import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-dark-100 shadow-inner py-6">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-primary mb-4">CEMS</h3>
            <p className="text-gray-600 dark:text-gray-300">
              College Event Management System - Simplifying event organization and attendance for colleges.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary">
                  Register
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-4">Categories</h4>
            <ul className="space-y-2">
              <li className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary">
                Academic
              </li>
              <li className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary">
                Cultural
              </li>
              <li className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary">
                Sports
              </li>
              <li className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary">
                Technical
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-4">Connect with Us</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-500">
                <FaFacebook size={20} />
              </a>
              <a href="#" className="text-blue-400 dark:text-blue-300 hover:text-blue-500 dark:hover:text-blue-400">
                <FaTwitter size={20} />
              </a>
              <a href="#" className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-500">
                <FaInstagram size={20} />
              </a>
              <a href="#" className="text-blue-800 dark:text-blue-500 hover:text-blue-900 dark:hover:text-blue-600">
                <FaLinkedin size={20} />
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-center text-gray-600 dark:text-gray-300">
            &copy; {year} College Event Management System. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 