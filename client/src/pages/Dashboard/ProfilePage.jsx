import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaUser, FaEnvelope, FaCalendarAlt, FaIdBadge, FaLock, FaSave, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getProfile, updateProfile, changePassword, reset } from '../../features/auth/authSlice';
import Spinner from '../../components/ui/Spinner';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user, isLoading, isSuccess, isError, message } = useSelector((state) => state.auth);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    year: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  useEffect(() => {
    dispatch(getProfile());
    
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);
  
  useEffect(() => {
    if (isError) {
      toast.error(message);
      setSubmitting(false);
    }
    
    if (isSuccess && submitting) {
      if (isEditing) {
        toast.success('Profile updated successfully');
        setIsEditing(false);
      } else if (isChangingPassword) {
        toast.success('Password changed successfully');
        setIsChangingPassword(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
      setSubmitting(false);
    }
    
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
        department: user.department || '',
        year: user.year || ''
      });
    }
  }, [user, isError, isSuccess, message, submitting, isEditing, isChangingPassword]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form data to current user data
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
        department: user.department || '',
        year: user.year || ''
      });
    }
    setIsEditing(!isEditing);
  };
  
  const handlePasswordToggle = () => {
    if (isChangingPassword) {
      // Reset password data
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
    setIsChangingPassword(!isChangingPassword);
  };
  
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    
    // Get updated fields only
    const updatedData = {
      name: formData.name,
      department: formData.department,
      year: formData.year
    };
    
    setSubmitting(true);
    dispatch(updateProfile(updatedData));
  };
  
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('All password fields are required');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setSubmitting(true);
    dispatch(changePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    }));
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  if (isLoading && !submitting) {
    return <Spinner />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">My Profile</h1>
      
      <div className="card p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            Account Information
          </h2>
          <button 
            onClick={handleEditToggle}
            className={`btn ${isEditing ? 'btn-secondary' : 'btn-primary'} flex items-center`}
            disabled={isChangingPassword || submitting}
          >
            {isEditing ? (
              <>
                <FaTimes className="mr-2" /> Cancel
              </>
            ) : (
              <>
                <FaUser className="mr-2" /> Edit Profile
              </>
            )}
          </button>
        </div>
        
        <form onSubmit={handleProfileSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-4">
              <div className="bg-primary-100 dark:bg-primary-900 p-3 rounded-full text-primary-500 dark:text-primary-300">
                <FaUser size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input mt-1"
                    required
                  />
                ) : (
                  <p className="text-lg font-medium text-gray-800 dark:text-white">
                    {user?.name || 'N/A'}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-primary-100 dark:bg-primary-900 p-3 rounded-full text-primary-500 dark:text-primary-300">
                <FaEnvelope size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email Address</p>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input mt-1"
                    disabled
                  />
                ) : (
                  <p className="text-lg font-medium text-gray-800 dark:text-white">
                    {user?.email || 'N/A'}
                  </p>
                )}
                {isEditing && (
                  <p className="text-xs text-gray-500 mt-1">
                    Email address cannot be changed
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-primary-100 dark:bg-primary-900 p-3 rounded-full text-primary-500 dark:text-primary-300">
                <FaIdBadge size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                <p className="text-lg font-medium text-gray-800 dark:text-white capitalize">
                  {user?.role || 'N/A'}
                  {user?.role === 'admin' && (
                    <span className="ml-2 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 py-1 px-2 rounded-full">
                      Administrator
                    </span>
                  )}
                  {user?.role === 'organizer' && (
                    <span className="ml-2 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 py-1 px-2 rounded-full">
                      Event Organizer
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-primary-100 dark:bg-primary-900 p-3 rounded-full text-primary-500 dark:text-primary-300">
                <FaCalendarAlt size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
                <p className="text-lg font-medium text-gray-800 dark:text-white">
                  {formatDate(user?.createdAt)}
                </p>
              </div>
            </div>
            
            {isEditing && (
              <>
                <div className="flex items-start space-x-4">
                  <div className="bg-primary-100 dark:bg-primary-900 p-3 rounded-full text-primary-500 dark:text-primary-300">
                    <FaIdBadge size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Department</p>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="form-input mt-1"
                      placeholder="Enter your department"
                    />
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-primary-100 dark:bg-primary-900 p-3 rounded-full text-primary-500 dark:text-primary-300">
                    <FaIdBadge size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Year</p>
                    <input
                      type="number"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className="form-input mt-1"
                      placeholder="Enter your year"
                      min="1"
                      max="5"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          
          {isEditing && (
            <div className="mt-8 flex justify-end">
              <button 
                type="submit"
                className="btn btn-primary flex items-center"
                disabled={submitting}
              >
                {submitting ? (
                  <Spinner />
                ) : (
                  <>
                    <FaSave className="mr-2" /> Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
      
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-6">
          Account Security
        </h2>
        
        <div className="mb-6">
          {!isChangingPassword ? (
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Change your password to keep your account secure.
              </p>
              
              <button 
                className="btn btn-secondary flex items-center"
                onClick={handlePasswordToggle}
                disabled={isEditing || submitting}
              >
                <FaLock className="mr-2" /> Change Password
              </button>
            </>
          ) : (
            <form onSubmit={handlePasswordSubmit}>
              <div className="space-y-4 mb-6">
                <div>
                  <label htmlFor="currentPassword" className="form-label">
                    Current Password
                  </label>
                  <input 
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="form-input"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="form-label">
                    New Password
                  </label>
                  <input 
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="form-input"
                    required
                    minLength="6"
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm New Password
                  </label>
                  <input 
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handlePasswordToggle}
                  className="btn btn-secondary flex items-center"
                  disabled={submitting}
                >
                  <FaTimes className="mr-2" /> Cancel
                </button>
                
                <button
                  type="submit"
                  className="btn btn-primary flex items-center"
                  disabled={submitting}
                >
                  {submitting ? (
                    <Spinner />
                  ) : (
                    <>
                      <FaSave className="mr-2" /> Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 