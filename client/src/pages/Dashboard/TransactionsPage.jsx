import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaSearch, FaFilter, FaDownload, FaEye, FaMoneyBillWave, FaCheckCircle, FaTimesCircle, FaExclamationCircle, FaCalendarAlt } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import Spinner from '../../components/ui/Spinner';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}`;

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user && user.role === 'admin';
  
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        // Debug message
        console.log('Fetching transactions...');
        
        try {
          // Try the API endpoint first
          const url = isAdmin 
            ? `${API_URL}/payments/transactions` 
            : `${API_URL}/payments/transactions/my-events`;
          
          const response = await axios.get(url, config);
          console.log('Transactions response:', response.data);
          
          if (response.data.success) {
            setTransactions(response.data.data);
            setFilteredTransactions(response.data.data);
          }
        } catch (apiError) {
          console.error('API error:', apiError);
          
          // If API endpoint not available, fetch payments history as fallback
          console.log('Falling back to payment history...');
          const historyResponse = await axios.get(`${API_URL}/payments/history`, config);
          
          if (historyResponse.data.success) {
            // Format payment history to match expected transaction format
            const formattedTransactions = historyResponse.data.data.map(payment => ({
              _id: payment._id,
              transactionId: payment.transactionId || `TX${Math.floor(Math.random() * 10000)}`,
              event: payment.event || { _id: 'unknown', title: 'Event' },
              user: payment.user || { _id: user.id, name: user.name, email: user.email },
              amount: payment.amount || 0,
              status: payment.status || 'completed',
              date: payment.createdAt || new Date()
            }));
            
            setTransactions(formattedTransactions);
            setFilteredTransactions(formattedTransactions);
          } else {
            // If both fail, create mock data
            console.log('Using mock data...');
            generateMockTransactions();
          }
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setError(error.message || 'Error fetching transactions');
        toast.error('Error fetching transactions. Using mock data instead.');
        generateMockTransactions();
      } finally {
        setIsLoading(false);
      }
    };
    
    // Generate mock transactions for demo or when API fails
    const generateMockTransactions = () => {
      const mockEvents = [
        { _id: 'evt1', title: 'Annual Tech Conference' },
        { _id: 'evt2', title: 'Web Development Workshop' },
        { _id: 'evt3', title: 'Music Festival 2023' },
        { _id: 'evt4', title: 'Data Science Bootcamp' }
      ];
      
      const mockUsers = [
        { _id: 'usr1', name: 'John Doe', email: 'john@example.com' },
        { _id: 'usr2', name: 'Jane Smith', email: 'jane@example.com' },
        { _id: 'usr3', name: 'Alice Brown', email: 'alice@example.com' },
        { _id: 'usr4', name: 'Bob Johnson', email: 'bob@example.com' }
      ];
      
      const statuses = ['success', 'failed', 'pending'];
      
      const mockTransactions = Array.from({ length: 20 }, (_, i) => {
        const event = mockEvents[Math.floor(Math.random() * mockEvents.length)];
        const userObj = mockUsers[Math.floor(Math.random() * mockUsers.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));
        
        return {
          _id: `mock${i}`,
          transactionId: `TX${Math.floor(Math.random() * 100000)}`,
          event,
          user: userObj,
          amount: Math.floor(Math.random() * 5000) + 500,
          status,
          date: date.toISOString()
        };
      });
      
      setTransactions(mockTransactions);
      setFilteredTransactions(mockTransactions);
      toast.info('Using demo data for transactions. This is not real data.');
    };
    
    fetchTransactions();
  }, [isAdmin, user]);
  
  // Apply filters
  useEffect(() => {
    let results = transactions;
    
    // Search term filter
    if (searchTerm) {
      results = results.filter(transaction => 
        transaction.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.event?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      results = results.filter(transaction => transaction.status === statusFilter);
    }
    
    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let dateThreshold;
      
      switch(dateFilter) {
        case 'today':
          dateThreshold = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          dateThreshold = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          dateThreshold = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          dateThreshold = null;
      }
      
      if (dateThreshold) {
        results = results.filter(transaction => 
          new Date(transaction.date) >= dateThreshold
        );
      }
    }
    
    setFilteredTransactions(results);
    setCurrentPage(1); // Reset to first page on filter change
  }, [searchTerm, statusFilter, dateFilter, transactions]);
  
  // Format date
  const formatDate = (dateString) => {
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return '₹' + (amount || 0).toLocaleString();
  };
  
  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  
  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Transaction ID', 'Event', 'User', 'Email', 'Amount', 'Status', 'Date'];
    
    const csvData = filteredTransactions.map(t => [
      t.transactionId || '',
      t.event?.title || '',
      t.user?.name || '',
      t.user?.email || '',
      t.amount || 0,
      t.status || '',
      new Date(t.date || new Date()).toISOString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transactions-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    toast.success('Transactions exported successfully');
  };
  
  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg">
        <h2 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">Error</h2>
        <p className="text-red-600 dark:text-red-200">{error}</p>
      </div>
    );
  }
  
  if (isLoading) {
    return <Spinner />;
  }
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 md:mb-0">Transactions</h1>
        
        <button 
          onClick={exportToCSV}
          className="btn btn-primary flex items-center justify-center"
        >
          <FaDownload className="mr-2" /> Export to CSV
        </button>
      </div>
      
      {/* Filters */}
      <div className="bg-white dark:bg-dark-200 rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-100 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-100 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="success">Successful</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          
          <div className="relative">
            <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-100 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
          
          <div className="relative">
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-100 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Transactions Table */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white dark:bg-dark-200 rounded-lg p-8 text-center">
          <FaMoneyBillWave className="text-5xl text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">No transactions found</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Try changing your search criteria</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-200 rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-dark-300 text-left">
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm uppercase">Transaction ID</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm uppercase">Event</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm uppercase">User</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm uppercase">Amount</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm uppercase">Status</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm uppercase">Date</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedTransactions.map(transaction => (
                <tr key={transaction._id} className="hover:bg-gray-50 dark:hover:bg-dark-300">
                  <td className="p-4 text-gray-800 dark:text-gray-200 font-medium">
                    {transaction.transactionId}
                  </td>
                  <td className="p-4">
                    {transaction.event?._id ? (
                      <Link 
                        to={`/events/${transaction.event._id}`}
                        className="text-primary hover:underline"
                      >
                        {transaction.event.title}
                      </Link>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">
                        {transaction.event?.title || 'Unknown Event'}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="text-gray-800 dark:text-gray-200">
                      {transaction.user?.name || 'Unknown User'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {transaction.user?.email || ''}
                    </div>
                  </td>
                  <td className="p-4 text-gray-800 dark:text-gray-200 font-medium">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="p-4">
                    {transaction.status === 'success' && (
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <FaCheckCircle className="mr-1" /> Success
                      </div>
                    )}
                    {transaction.status === 'failed' && (
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        <FaTimesCircle className="mr-1" /> Failed
                      </div>
                    )}
                    {transaction.status === 'pending' && (
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        <FaExclamationCircle className="mr-1" /> Pending
                      </div>
                    )}
                    {!['success', 'failed', 'pending'].includes(transaction.status) && (
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {transaction.status || 'Unknown'}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="p-4">
                    <Link
                      to={`/dashboard/transactions/${transaction._id}`}
                      className="flex items-center text-primary hover:text-primary-dark"
                    >
                      <FaEye className="mr-1" /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredTransactions.length)} of {filteredTransactions.length} transactions
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 dark:bg-dark-300 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-white dark:bg-dark-200 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-300'
                  }`}
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-md ${
                        currentPage === pageNum
                          ? 'bg-primary text-white'
                          : 'bg-white dark:bg-dark-200 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 dark:bg-dark-300 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-white dark:bg-dark-200 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-300'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionsPage; 