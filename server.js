const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Data storage file path
const dataStorePath = path.join(__dirname, 'data', 'users.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

// Create users.json if it doesn't exist
if (!fs.existsSync(dataStorePath)) {
  fs.writeFileSync(dataStorePath, JSON.stringify({ users: [] }));
}

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname));
app.use(session({
  secret: 'astro-games-secret',
  resave: false,
  saveUninitialized: true
}));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API to register new user
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  try {
    // Read existing users
    const data = JSON.parse(fs.readFileSync(dataStorePath));
    
    // Check if user already exists
    if (data.users.some(user => user.username === username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Add new user
    data.users.push({ username, password });
    
    // Write updated data back to file
    fs.writeFileSync(dataStorePath, JSON.stringify(data, null, 2));
    
    return res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// API to login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  try {
    // Read existing users
    const data = JSON.parse(fs.readFileSync(dataStorePath));
    
    // Find user
    const user = data.users.find(user => user.username === username && user.password === password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Set session
    req.session.user = { username: user.username };
    
    return res.json({ success: true, message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// API to check if user is logged in
app.get('/api/user', (req, res) => {
  if (req.session.user) {
    return res.json({ loggedIn: true, user: req.session.user });
  }
  return res.json({ loggedIn: false });
});

// API to logout
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 