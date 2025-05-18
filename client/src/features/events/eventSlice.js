import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/events`;

const initialState = {
  events: [],
  event: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: ''
};

export const getEvents = createAsyncThunk(
  'events/getAll',
  async (_, thunkAPI) => {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
        
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const getEvent = createAsyncThunk(
  'events/getEvent',
  async (id, thunkAPI) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
        
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const createEvent = createAsyncThunk(
  'events/create',
  async (eventData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.post(API_URL, eventData, config);
      return response.data;
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
        
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const updateEvent = createAsyncThunk(
  'events/update',
  async ({ id, eventData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.put(`${API_URL}/${id}`, eventData, config);
      return response.data;
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
        
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const deleteEvent = createAsyncThunk(
  'events/delete',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.delete(`${API_URL}/${id}`, config);
      
      return id;
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
        
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const registerForEvent = createAsyncThunk(
  'events/register',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.post(`${API_URL}/register/${id}`, {}, config);
      return response.data;
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
        
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const unregisterFromEvent = createAsyncThunk(
  'events/unregister',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.post(`${API_URL}/unregister/${id}`, {}, config);
      return response.data;
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
        
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const eventSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    clearEvent: (state) => {
      state.event = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getEvents.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.events = action.payload.data;
      })
      .addCase(getEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getEvent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.event = action.payload.data;
      })
      .addCase(getEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(createEvent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.events.push(action.payload.data);
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateEvent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.events = state.events.map(event => 
          event._id === action.payload.data._id ? action.payload.data : event
        );
        state.event = action.payload.data;
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteEvent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.events = state.events.filter(event => event._id !== action.payload);
      })
      .addCase(deleteEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(registerForEvent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(registerForEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        if (action.payload.data) {
          state.events = state.events.map(event => 
            event._id === action.payload.data._id ? action.payload.data : event
          );
          state.event = action.payload.data;
        } else if (action.payload.isPaid && state.event) {
          const userId = state.event.organizer?._id;
          if (userId && state.event.registeredUsers) {
            if (!state.event.registeredUsers.includes(userId)) {
              state.event = {
                ...state.event,
                registeredUsers: [...state.event.registeredUsers, userId]
              };
            }
          }
        }
      })
      .addCase(registerForEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(unregisterFromEvent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(unregisterFromEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        if (action.payload.data) {
          state.events = state.events.map(event => 
            event._id === action.payload.data._id ? action.payload.data : event
          );
          state.event = action.payload.data;
        }
      })
      .addCase(unregisterFromEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  }
});

export const { reset, clearEvent } = eventSlice.actions;
export default eventSlice.reducer; 