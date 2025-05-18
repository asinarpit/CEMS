import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { FaTrash, FaEdit, FaUser, FaUserGraduate, FaUserTie, FaSearch, FaUserMinus, FaUserEdit, FaFilter, FaSave, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Spinner from '../../components/ui/Spinner';
import { getAllUsers, deleteUser, updateUser, reset } from '../../features/auth/authSlice';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const EditUserModal = ({ user, onClose, onSave, isSubmitting }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'attendee'
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(user._id, formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Edit User</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
          >
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={onChange}
              className="form-input w-full"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={onChange}
              className="form-input w-full"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="role" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={onChange}
              className="form-input w-full"
              required
            >
              <option value="attendee">Attendee</option>
              <option value="organizer">Organizer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Spinner />
              ) : (
                <>
                  <FaSave className="mr-2" /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UserManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { allUsers, isLoading, isError, message } = useSelector((state) => state.auth);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isAdmin = user && user.role === 'admin';
  
  useEffect(() => {
    if (isAdmin) {
      dispatch(getAllUsers());
    } else if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
    
    return () => {
      dispatch(reset());
    };
  }, [dispatch, isAdmin, user, navigate]);
  
  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
  }, [isError, message]);
  
  const handleDeleteUser = async (id) => {
    if (id === user.id) {
      toast.error("You cannot delete your own account here");
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    setDeleteInProgress(true);
    setDeletingId(id);
    
    try {
      await dispatch(deleteUser(id)).unwrap();
      toast.success('User deleted successfully');
      dispatch(getAllUsers());
    } catch (error) {
      const errorMessage = error?.message || 'Unknown error occurred';
      toast.error('Failed to delete user: ' + errorMessage);
    } finally {
      setDeleteInProgress(false);
      setDeletingId(null);
    }
  };
  
  const handleEditUser = (id) => {
    const userToEdit = allUsers.find(u => u._id === id);
    if (userToEdit) {
      setSelectedUser(userToEdit);
      setIsEditModalOpen(true);
    } else {
      toast.error('User not found');
    }
  };
  
  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };
  
  const handleSaveUser = async (userId, userData) => {
    setIsSubmitting(true);
    
    try {
      await dispatch(updateUser({ userId, userData })).unwrap();
      toast.success('User updated successfully');
      setIsEditModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      const errorMessage = error?.message || 'Failed to update user';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const filteredUsers = allUsers?.filter((u) => {
    const matchesSearch = 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    
    return matchesSearch && matchesRole;
  }) || [];
  
  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'organizer', label: 'Organizer' },
    { value: 'attendee', label: 'Attendee' }
  ];
  
  if (isLoading && !allUsers.length) {
    return <Spinner />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">User Management</h1>
      
      <div className="card p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search users..."
              className="form-input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          
          <div className="relative w-full md:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="form-input pl-10 w-full appearance-none"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        
        {isLoading && allUsers.length > 0 && (
          <div className="text-center py-4">
            <Spinner />
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-dark-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-100 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u._id} className={u._id === user.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {u.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                          ({u.email})
                        </div>
                        {u._id === user.id && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-1 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        u.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                          : u.role === 'organizer'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditUser(u._id)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                        title="Edit User"
                      >
                        <FaUserEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u._id)}
                        className={`text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ${u._id === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={deleteInProgress || u._id === user.id}
                        title={u._id === user.id ? "Cannot delete your own account" : "Delete User"}
                      >
                        {deleteInProgress && deletingId === u._id ? (
                          <span className="inline-block w-4 h-4 border-2 border-t-2 border-red-500 rounded-full animate-spin"></span>
                        ) : (
                          <FaUserMinus />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    {searchTerm || roleFilter 
                      ? 'No users found matching your search criteria' 
                      : 'No users found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {isEditModalOpen && selectedUser && (
        <EditUserModal 
          user={selectedUser} 
          onClose={handleCloseModal}
          onSave={handleSaveUser}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default UserManagement; 