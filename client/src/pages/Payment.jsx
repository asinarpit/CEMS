import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { FaCreditCard, FaPhoneAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import axios from 'axios';
import Spinner from '../components/ui/Spinner';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}`;

const Payment = () => {
  const { paymentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  
  const { user } = useSelector((state) => state.auth);
  
  const eventId = location.state?.eventId;
  const amount = location.state?.amount;
  
  useEffect(() => {
    if (!user) {
      toast.error('Please log in to complete the payment');
      navigate('/login');
      return;
    }
    
    if (!eventId || !amount) {
      toast.error('Invalid payment information');
      navigate('/');
      return;
    }
  }, [user, eventId, amount, navigate]);
  
  const processPayment = async (status) => {
    setIsProcessing(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      // First, process the payment
      const paymentResponse = await axios.post(
        `${API_URL}/payments/process/${paymentId}`,
        {
          eventId,
          status
        },
        config
      );
      
      // If payment is successful, complete the registration and send ticket
      if (status === 'success') {
        const transactionId = `PHONEPAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        await axios.post(
          `${API_URL}/events/complete-payment/${eventId}`,
          {
            transactionId
          },
          config
        );
        
        toast.success('Payment successful. A ticket has been sent to your email.');
      } else {
        toast.error('Payment failed');
      }
      
      setPaymentStatus(status);
      setIsComplete(true);
      
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
        
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="max-w-lg mx-auto">
      <div className="card p-8">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center">
            <FaPhoneAlt size={30} />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">
          PhonePe Payment
        </h1>
        
        {isComplete ? (
          <div className="text-center">
            {paymentStatus === 'success' ? (
              <>
                <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  Payment Successful!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Your payment has been processed successfully. You are now registered for the event.
                  A confirmation email with your ticket has been sent to your registered email address.
                </p>
                <button
                  onClick={() => navigate('/dashboard/events')}
                  className="btn btn-primary w-full"
                >
                  Back to Dashboard
                </button>
              </>
            ) : (
              <>
                <FaTimesCircle className="text-red-500 text-5xl mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  Payment Failed
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Your payment could not be processed.
                </p>
                <button
                  onClick={() => navigate('/dashboard/events')}
                  className="btn btn-primary w-full"
                >
                  Back to Dashboard
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">Payment ID</span>
                <span className="text-gray-800 dark:text-gray-200">{paymentId}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">Amount</span>
                <span className="text-gray-800 dark:text-gray-200 font-semibold">₹{amount}</span>
              </div>
            </div>
            
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              This is a mock payment gateway. In a real app, you would be redirected to PhonePe.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={() => processPayment('success')}
                disabled={isProcessing}
                className="btn btn-primary w-full flex items-center justify-center"
              >
                {isProcessing ? (
                  <Spinner />
                ) : (
                  <>
                    <FaCheckCircle className="mr-2" /> Simulate Successful Payment
                  </>
                )}
              </button>
              
              <button
                onClick={() => processPayment('failure')}
                disabled={isProcessing}
                className="btn btn-secondary w-full flex items-center justify-center"
              >
                {isProcessing ? (
                  <Spinner />
                ) : (
                  <>
                    <FaTimesCircle className="mr-2" /> Simulate Failed Payment
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Payment; 