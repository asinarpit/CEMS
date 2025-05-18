import { Link } from 'react-router-dom';
import { FaExclamationTriangle } from 'react-icons/fa';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <FaExclamationTriangle className="text-primary text-8xl mb-6" />
      <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">404</h1>
      <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
        Oops! The page you are looking for could not be found.
      </p>
      <Link to="/" className="btn btn-primary">
        Go Home
      </Link>
    </div>
  );
};

export default NotFound; 