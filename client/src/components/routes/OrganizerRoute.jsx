import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const OrganizerRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user || (user.role !== 'organizer' && user.role !== 'admin')) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default OrganizerRoute; 