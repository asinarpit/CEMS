import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaLock, FaBuilding, FaGraduationCap } from 'react-icons/fa';
import { register, reset } from '../features/auth/authSlice';
import Spinner from '../components/ui/Spinner';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: '',
    department: '',
    year: ''
  });
  
  const { name, email, password, password2, department, year } = formData;
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user, isLoading, isSuccess, isError, message } = useSelector(
    (state) => state.auth
  );
  
  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
    
    if (isSuccess || user) {
      navigate('/');
    }
    
    dispatch(reset());
  }, [user, isError, isSuccess, message, navigate, dispatch]);
  
  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value
    }));
  };
  
  const onSubmit = (e) => {
    e.preventDefault();
    
    if (password !== password2) {
      toast.error('Passwords do not match');
    } else {
      const userData = {
        name,
        email,
        password,
        department,
        year: parseInt(year)
      };
      
      dispatch(register(userData));
    }
  };
  
  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="flex justify-center mb-6">
            <FaUser className="text-primary" size={40} />
          </div>
          
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">
            Create Your Account
          </h1>
          
          <form onSubmit={onSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="form-label">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="form-input pl-10"
                  id="name"
                  name="name"
                  value={name}
                  onChange={onChange}
                  placeholder="Enter your full name"
                  required
                />
                <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  className="form-input pl-10"
                  id="email"
                  name="email"
                  value={email}
                  onChange={onChange}
                  placeholder="Enter your email"
                  required
                />
                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="department" className="form-label">
                Department
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="form-input pl-10"
                  id="department"
                  name="department"
                  value={department}
                  onChange={onChange}
                  placeholder="Enter your department"
                  required
                />
                <FaBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="year" className="form-label">
                Year of Study
              </label>
              <div className="relative">
                <select
                  className="form-input pl-10"
                  id="year"
                  name="year"
                  value={year}
                  onChange={onChange}
                  required
                >
                  <option value="" disabled>Select your year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="5">5th Year</option>
                </select>
                <FaGraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  className="form-input pl-10"
                  id="password"
                  name="password"
                  value={password}
                  onChange={onChange}
                  placeholder="Enter your password"
                  required
                />
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="password2" className="form-label">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  className="form-input pl-10"
                  id="password2"
                  name="password2"
                  value={password2}
                  onChange={onChange}
                  placeholder="Confirm your password"
                  required
                />
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary w-full mt-6">
              Register
            </button>
            
            <div className="mt-4 text-center text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register; 