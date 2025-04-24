const express = require('express');
const http = require('http');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('frontend'));

const USERS_FILE = './backend/users.json';
let users = JSON.parse(fs.readFileSync(USERS_FILE));

// Save users to file
function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (users[username]) return res.status(400).send("Username taken.");
  users[username] = { password };
  saveUsers();
  res.send("Registered.");
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!users[username] || users[username].password !== password)
    return res.status(401).send("Invalid login.");
  res.send("Logged in.");
});

let onlineUsers = {};
let announcements = '';

io.on('connection', socket => {
  let user = null;

  socket.on('login', username => {
    user = username;
    onlineUsers[socket.id] = username;
    socket.broadcast.emit('chat', { user: "Server", text: `${username} joined.` });
    socket.emit('announcement', announcements);
  });

  socket.on('chat', msg => {
    io.emit('chat', { user, text: msg });
  });

  socket.on('private', ({ to, message }) => {
    for (let [id, uname] of Object.entries(onlineUsers)) {
      if (uname === to) io.to(id).emit('private', { from: user, message });
    }
  });

  socket.on('flash', target => {
    for (let [id, uname] of Object.entries(onlineUsers)) {
      if (uname === target) io.to(id).emit('flash');
    }
  });

  socket.on('announce', msg => {
    announcements = msg;
    io.emit('announcement', msg);
  });

  socket.on('disconnect', () => {
    if (user) {
      socket.broadcast.emit('chat', { user: "Server", text: `${user} left.` });
      delete onlineUsers[socket.id];
    }
  });
});

server.listen(3000, () => console.log("Server running on http://localhost:3000"));
