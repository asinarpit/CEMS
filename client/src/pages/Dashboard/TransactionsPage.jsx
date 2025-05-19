import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaSearch, FaCalendarAlt, FaMoneyBillWave, FaUser, FaCalendarCheck } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import Spinner from '../../components/ui/Spinner';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}`;

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const { user } = useSelector((state) => state.auth);
  
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          toast.error('Authentication required');
          return;
        }
        
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        // For organizers, only fetch transactions for their events
        // For admins, fetch all transactions
        const endpoint = user.role === 'organizer' 
          ? `${API_URL}/events/transactions/organizer` 
          : `${API_URL}/events/transactions`;
        
        const response = await axios.get(endpoint, config);
        
        if (response.data.success) {
          setTransactions(response.data.data);
          setFilteredTransactions(response.data.data);
        } else {
          throw new Error('Failed to fetch transactions');
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        toast.error(error.response?.data?.message || 'Error fetching transactions');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTransactions();
  }, [user]);
  
  useEffect(() => {
    // Apply filters and search
    let result = [...transactions];
    
    // Apply filter
    if (filter !== 'all') {
      result = result.filter(transaction => transaction.status === filter);
    }
    
    // Apply search
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        transaction =>
          transaction.event?.title.toLowerCase().includes(searchLower) ||
          transaction.user?.name.toLowerCase().includes(searchLower) ||
          transaction.paymentId?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'date') {
        comparison = new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortBy === 'event') {
        comparison = a.event?.title.localeCompare(b.event?.title);
      } else if (sortBy === 'user') {
        comparison = a.user?.name.localeCompare(b.user?.name);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredTransactions(result);
  }, [transactions, filter, searchTerm, sortBy, sortOrder]);
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };
  
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };
  
  const handleSort = (field) => {
    if (sortBy === field) {
      toggleSortOrder();
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };
  
  if (isLoading) {
    return <Spinner />;
  }
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Transactions</h1>
      
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FaSearch className="text-gray-500 dark:text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by event, user or payment ID"
            className="bg-white dark:bg-dark-300 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg w-full pl-10 p-2.5"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select
          className="bg-white dark:bg-dark-300 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        
        <select
          className="bg-white dark:bg-dark-300 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5"
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-');
            setSortBy(field);
            setSortOrder(order);
          }}
        >
          <option value="date-desc">Date (Newest First)</option>
          <option value="date-asc">Date (Oldest First)</option>
          <option value="amount-desc">Amount (Highest First)</option>
          <option value="amount-asc">Amount (Lowest First)</option>
          <option value="event-asc">Event Name (A-Z)</option>
          <option value="event-desc">Event Name (Z-A)</option>
          <option value="user-asc">User Name (A-Z)</option>
          <option value="user-desc">User Name (Z-A)</option>
        </select>
      </div>
      
      {filteredTransactions.length === 0 ? (
        <div className="bg-white dark:bg-dark-200 rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left bg-white dark:bg-dark-200 shadow-md rounded-lg">
            <thead className="bg-gray-100 dark:bg-dark-300 uppercase text-xs">
              <tr>
                <th 
                  className="px-6 py-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-dark-400"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    <FaCalendarAlt className="mr-1" />
                    Date
                    {sortBy === 'date' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-dark-400"
                  onClick={() => handleSort('event')}
                >
                  <div className="flex items-center">
                    <FaCalendarCheck className="mr-1" />
                    Event
                    {sortBy === 'event' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-dark-400"
                  onClick={() => handleSort('user')}
                >
                  <div className="flex items-center">
                    <FaUser className="mr-1" />
                    User
                    {sortBy === 'user' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-dark-400"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center">
                    <FaMoneyBillWave className="mr-1" />
                    Amount
                    {sortBy === 'amount' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Payment ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr 
                  key={transaction._id} 
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-dark-300"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(transaction.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    {transaction.event?.title || 'Unknown Event'}
                  </td>
                  <td className="px-6 py-4">
                    {transaction.user?.name || 'Unknown User'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium 
                      ${transaction.status === 'success' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : transaction.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm">
                    {transaction.paymentId || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-6 bg-white dark:bg-dark-200 rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-2">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-dark-300 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Transactions</p>
            <p className="text-2xl font-bold">{transactions.length}</p>
          </div>
          <div className="bg-gray-50 dark:bg-dark-300 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(
                transactions
                  .filter(t => t.status === 'success')
                  .reduce((sum, t) => sum + t.amount, 0)
              )}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-dark-300 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Successful</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {transactions.filter(t => t.status === 'success').length}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-dark-300 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Failed/Pending</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {transactions.filter(t => t.status !== 'success').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage; 