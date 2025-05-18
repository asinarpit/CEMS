import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { FaSignInAlt, FaEnvelope, FaLock } from 'react-icons/fa';
import { login, reset } from '../features/auth/authSlice';
import Spinner from '../components/ui/Spinner';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const { email, password } = formData;
  
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
    
    const userData = {
      email,
      password
    };
    
    dispatch(login(userData));
  };
  
  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="flex justify-center mb-6">
            <FaSignInAlt className="text-primary" size={40} />
          </div>
          
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">
            Login to Your Account
          </h1>
          
          <form onSubmit={onSubmit}>
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
            
            <button type="submit" className="btn btn-primary w-full mt-6">
              Login
            </button>
            
            <div className="mt-4 text-center text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Register
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 