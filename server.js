const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const MESSAGE = require("./utils/messages");

const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

// App is an object 
const app = express();
// http.createServer method turns your computer into an HTTP server
const server = http.createServer(app);


const io = socketio(server);

// // Set static folder
app.use(express.static(path.join(__dirname, "public")));
const botName = "ADMIN";


// Run when client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    // Told that user to join this room
    socket.join(user.room);

    // Welcome current user
    socket.emit("message", MESSAGE(botName, "Welcome to Chatter!"));

    // Broadcast when a user connects
    socket.broadcast.to(user.room).emit("message",MESSAGE(botName, `${user.username} has joined the chat`));

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  

  // Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", MESSAGE(user.username, msg));
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) 
    {
      io.to(user.room).emit("message",MESSAGE(botName, `${user.username} has left the chat`));
      // Send users and room info
      io.to(user.room).emit("roomUsers", {room: user.room,users: getRoomUsers(user.room)});
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 