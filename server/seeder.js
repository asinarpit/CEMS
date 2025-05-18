const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Event = require('./models/Event');
const bcrypt = require('bcryptjs');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB for seeding'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin',
    department: 'Administration',
    year: 1
  },
  {
    name: 'Event Organizer',
    email: 'organizer@example.com',
    password: 'password123',
    role: 'organizer',
    department: 'Student Activities',
    year: 3
  },
  {
    name: 'Student User',
    email: 'student@example.com',
    password: 'password123',
    role: 'student',
    department: 'Computer Science',
    year: 2
  }
];

const eventImages = [
  'https://images.unsplash.com/photo-1523580494863-6f3031224c94',
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
  'https://images.unsplash.com/photo-1475721027785-f74eccf877e2',
  'https://images.unsplash.com/photo-1511578314322-379afb476865',
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678',
  'https://images.unsplash.com/photo-1464047736614-af63643285bf',
  'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04',
  'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b',
  'https://images.unsplash.com/photo-1528605248644-14dd04022da1'
];

const eventTitles = [
  'Annual Tech Symposium',
  'Cultural Fest',
  'Sports Meet 2023',
  'Coding Hackathon',
  'Science Exhibition',
  'Literature Festival',
  'Career Fair',
  'Workshop on AI and ML',
  'Photography Contest',
  'Debate Competition',
  'Alumni Meet',
  'Robotics Workshop',
  'Music Concert',
  'Dance Competition',
  'Art Exhibition',
  'Research Symposium',
  'Entrepreneurship Summit',
  'Gaming Tournament',
  'Environmental Awareness Drive',
  'International Food Festival'
];

const eventLocations = [
  'Main Auditorium',
  'Sports Complex',
  'Central Library',
  'Engineering Block',
  'Science Building',
  'Open Air Theatre',
  'Conference Hall',
  'Computer Lab',
  'College Grounds',
  'Student Center'
];

const eventCategories = [
  'academic',
  'cultural',
  'sports',
  'technical',
  'workshop',
  'other'
];

const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomBoolean = () => Math.random() > 0.7;

const getRandomFutureDate = (minDays, maxDays) => {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + getRandomInt(minDays, maxDays));
  return futureDate;
};

const getRandomDuration = () => getRandomInt(1, 8);

const importData = async () => {
  try {
    await User.deleteMany();
    await Event.deleteMany();

    const createdUsers = [];
    for (const user of users) {
      const newUser = await User.create({
        ...user
      });
      
      createdUsers.push(newUser);
    }

    const adminUser = createdUsers.find(user => user.role === 'admin');
    const organizerUser = createdUsers.find(user => user.role === 'organizer');

    const eventData = [];
    
    for (let i = 0; i < 20; i++) {
      const startDate = getRandomFutureDate(7, 90);
      const durationHours = getRandomDuration();
      
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + durationHours);
      
      const isPaid = getRandomBoolean();
      
      eventData.push({
        title: eventTitles[i] || `Event ${i + 1}`,
        description: `This is the description for ${eventTitles[i] || `Event ${i + 1}`}. Join us for this exciting event that promises to be educational and entertaining.`,
        startDate,
        endDate,
        location: getRandomElement(eventLocations),
        category: getRandomElement(eventCategories),
        isPaid,
        price: isPaid ? getRandomInt(50, 500) : 0,
        capacity: getRandomInt(50, 300),
        organizer: i % 2 === 0 ? adminUser._id : organizerUser._id,
        image: `${getRandomElement(eventImages)}?random=${i}`
      });
    }
    
    await Event.insertMany(eventData);

    console.log('Data imported successfully');
    process.exit();
  } catch (error) {
    console.error(`Error importing data: ${error}`);
    process.exit(1);
  }
};

const deleteData = async () => {
  try {
    await User.deleteMany();
    await Event.deleteMany();

    console.log('Data deleted successfully');
    process.exit();
  } catch (error) {
    console.error(`Error deleting data: ${error}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else {
  console.log('Please use correct arguments: -i to import or -d to delete');
  process.exit();
} 