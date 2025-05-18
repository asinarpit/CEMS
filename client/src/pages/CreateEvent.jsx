import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { FaCalendarPlus, FaPencilAlt } from 'react-icons/fa';
import { createEvent, getEvent, updateEvent, reset } from '../features/events/eventSlice';
import Spinner from '../components/ui/Spinner';

const CreateEvent = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const isEditMode = !!eventId;
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: '',
    category: '',
    capacity: '',
    isPaid: false,
    price: 0,
    image: ''
  });
  
  const { 
    title, 
    description, 
    startDate, 
    startTime, 
    endDate, 
    endTime, 
    location, 
    category, 
    capacity, 
    isPaid, 
    price,
    image
  } = formData;
  
  const { event, isLoading, isSuccess, isError, message } = useSelector((state) => state.events);
  const { user } = useSelector((state) => state.auth);
  
  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'organizer')) {
      toast.error('Unauthorized to access this page');
      navigate('/');
    }
    
    if (isEditMode) {
      dispatch(getEvent(eventId))
        .unwrap()
        .then((res) => {
          const event = res.data;
          
          const startDateObj = new Date(event.startDate);
          const endDateObj = new Date(event.endDate);
          
          setFormData({
            title: event.title,
            description: event.description,
            startDate: startDateObj.toISOString().split('T')[0],
            startTime: startDateObj.toTimeString().slice(0, 5),
            endDate: endDateObj.toISOString().split('T')[0],
            endTime: endDateObj.toTimeString().slice(0, 5),
            location: event.location,
            category: event.category,
            capacity: event.capacity,
            isPaid: event.isPaid,
            price: event.price || 0,
            image: event.image || ''
          });
        })
        .catch((err) => {
          toast.error('Error fetching event');
          navigate('/');
        });
    }
    
    return () => {
      dispatch(reset());
    };
  }, [user, eventId, isEditMode, navigate, dispatch]);
  
  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
  }, [isError, message]);
  
  const categoryOptions = [
    { value: '', label: 'Select Category' },
    { value: 'academic', label: 'Academic' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'sports', label: 'Sports' },
    { value: 'technical', label: 'Technical' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'other', label: 'Other' }
  ];
  
  const compressImage = (file, maxWidth = 800, maxHeight = 600, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = width;
          canvas.height = height;
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Get compressed data URL
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        
        img.onerror = (error) => {
          reject(error);
        };
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
    });
  };
  
  const onChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      // Handle file uploads
      const file = files[0];
      
      if (file) {
        // Show loading indicator or disable form submission while processing
        setSubmitting(true);
        
        compressImage(file)
          .then(compressedImage => {
            setFormData(prevState => ({
              ...prevState,
              [name]: compressedImage
            }));
          })
          .catch(error => {
            toast.error('Error processing image: ' + error.message);
          })
          .finally(() => {
            setSubmitting(false);
          });
      }
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      
      const formattedData = {
        ...formData,
        startDate: new Date(`${formData.startDate}T${formData.startTime}`).toISOString(),
        endDate: new Date(`${formData.endDate}T${formData.endTime}`).toISOString()
      };
      
      delete formattedData.startTime;
      delete formattedData.endTime;
      
      if (isEditMode) {
        await dispatch(updateEvent({ id: eventId, eventData: formattedData })).unwrap();
        toast.success('Event updated successfully!');
        navigate('/dashboard/events');
      } else {
        await dispatch(createEvent(formattedData)).unwrap();
        toast.success('Event created successfully!');
        navigate('/dashboard/events');
      }
    } catch (error) {
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} event: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };
  
  const validateForm = () => {
    if (!formData.title || !formData.description || !formData.startDate || !formData.startTime || 
        !formData.endDate || !formData.endTime || !formData.location || !formData.category || !formData.capacity) {
      toast.error('Please fill in all required fields');
      return false;
    }

    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
    
    if (startDateTime >= endDateTime) {
      toast.error('End time must be after start time');
      return false;
    }
    
    if (parseInt(formData.capacity) <= 0) {
      toast.error('Capacity must be greater than 0');
      return false;
    }
    
    if (formData.isPaid && (!formData.price || parseFloat(formData.price) <= 0)) {
      toast.error('Please enter a valid price for paid events');
      return false;
    }
    
    return true;
  };
  
  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-8">
        <div className="flex justify-center mb-6">
          {isEditMode ? (
            <FaPencilAlt className="text-primary" size={40} />
          ) : (
            <FaCalendarPlus className="text-primary" size={40} />
          )}
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">
          {isEditMode ? 'Edit Event' : 'Create New Event'}
        </h1>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 mb-4">
              <label htmlFor="title" className="form-label">
                Event Title
              </label>
              <input
                type="text"
                className="form-input"
                id="title"
                name="title"
                value={title}
                onChange={onChange}
                placeholder="Enter event title"
                required
              />
            </div>
            
            <div className="md:col-span-2 mb-4">
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                className="form-input min-h-32"
                id="description"
                name="description"
                value={description}
                onChange={onChange}
                placeholder="Describe your event"
                required
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label htmlFor="startDate" className="form-label">
                Start Date
              </label>
              <input
                type="date"
                className="form-input"
                id="startDate"
                name="startDate"
                value={startDate}
                onChange={onChange}
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="startTime" className="form-label">
                Start Time
              </label>
              <input
                type="time"
                className="form-input"
                id="startTime"
                name="startTime"
                value={startTime}
                onChange={onChange}
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="endDate" className="form-label">
                End Date
              </label>
              <input
                type="date"
                className="form-input"
                id="endDate"
                name="endDate"
                value={endDate}
                onChange={onChange}
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="endTime" className="form-label">
                End Time
              </label>
              <input
                type="time"
                className="form-input"
                id="endTime"
                name="endTime"
                value={endTime}
                onChange={onChange}
                required
              />
            </div>
            
            <div className="md:col-span-2 mb-4">
              <label htmlFor="location" className="form-label">
                Location
              </label>
              <input
                type="text"
                className="form-input"
                id="location"
                name="location"
                value={location}
                onChange={onChange}
                placeholder="Enter event location"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="category" className="form-label">
                Category
              </label>
              <select
                className="form-input"
                id="category"
                name="category"
                value={category}
                onChange={onChange}
                required
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label htmlFor="capacity" className="form-label">
                Capacity
              </label>
              <input
                type="number"
                className="form-input"
                id="capacity"
                name="capacity"
                value={capacity}
                onChange={onChange}
                placeholder="Enter maximum participants"
                min="1"
                required
              />
            </div>
            
            <div className="md:col-span-2 mb-4">
              <label htmlFor="image" className="form-label">
                Event Image
              </label>
              <input
                type="file"
                className="form-input pt-1"
                id="image"
                name="image"
                onChange={onChange}
                accept="image/*"
              />
              {image && (
                <div className="mt-2">
                  <img 
                    src={image} 
                    alt="Event preview" 
                    className="h-40 w-auto rounded-md object-cover"
                  />
                </div>
              )}
            </div>
            
            <div className="md:col-span-2 mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  id="isPaid"
                  name="isPaid"
                  checked={isPaid}
                  onChange={onChange}
                />
                <label htmlFor="isPaid" className="ml-2 form-label">
                  This is a paid event
                </label>
              </div>
            </div>
            
            {isPaid && (
              <div className="md:col-span-2 mb-4">
                <label htmlFor="price" className="form-label">
                  Price (₹)
                </label>
                <input
                  type="number"
                  className="form-input"
                  id="price"
                  name="price"
                  value={price}
                  onChange={onChange}
                  placeholder="Enter event price"
                  min="0"
                  step="any"
                  required
                />
              </div>
            )}
          </div>
          
          <div className="mt-6 flex space-x-4">
            <button
              type="submit"
              className="btn btn-primary flex-1"
            >
              {isEditMode ? 'Update Event' : 'Create Event'}
            </button>
            
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent; 