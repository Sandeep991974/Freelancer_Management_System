const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

const { initializeDatabase } = require('./config/db');
const { createTables } = require('./models/dbSchema');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const bidRoutes = require('./routes/bidRoutes');
const chatRoutes = require('./routes/chatRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const publicRoutes = require('./routes/publicRoutes');
const adminRoutes = require('./routes/adminRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const { seedAdmin } = require('./controllers/authController');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for client development server
app.use(cors({
  origin: '*', // Allow all origins for dev simplicity
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve file uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/notifications', notificationRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Freelance Marketplace API is online.' });
});

// Create HTTP and Socket.IO Server
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Make Socket.IO accessible to controllers
app.set('io', io);

// Socket.IO Logic
io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  // Join a project specific communication room
  socket.on('join_project', (projectId) => {
    const roomName = `project_${projectId}`;
    socket.join(roomName);
    console.log(`Socket ${socket.id} joined room: ${roomName}`);
  });

  // Leave project room
  socket.on('leave_project', (projectId) => {
    const roomName = `project_${projectId}`;
    socket.leave(roomName);
    console.log(`Socket ${socket.id} left room: ${roomName}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

// Bootstrap application database and server
async function bootstrap() {
  try {
    // 1. Setup Database
    await initializeDatabase();
    
    // 2. Setup Tables
    await createTables();

    // 2.5 Seed Admin User
    await seedAdmin();

    // 3. Start Server
    server.listen(PORT, () => {
      console.log(`========================================`);
      console.log(`🚀 Marketplace Server running on port ${PORT}`);
      console.log(`========================================`);
    });
  } catch (error) {
    console.error('Fatal: Failed to bootstrap the backend server:', error);
    process.exit(1);
  }
}

bootstrap();
