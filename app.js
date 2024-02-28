const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => console.log(`💬 server on port ${PORT}`));

const io = require("socket.io")(server);

app.use(express.static(path.join(__dirname, "public")));

let socketsConected = new Map();

io.on("connection", onConnected);

var fullRoom = 0;

function onConnected(socket) {
  console.log("Socket connected", socket.id);
  // socketsConected.add(socket.id);
  socket.on("add-user", (username) => {
    console.log("usrname", username);
    const id = socket.id;
    socketsConected.set(id, username);
    console.log("socket connnected", socketsConected);
    const connectedUsersArray = Array.from(socketsConected);
    io.emit("clients-total", connectedUsersArray);
  });
  socket.on("private-chat-request", (id) => {
    console.log("Private chat request from:", id);

    console.log("socket connected", socketsConected);

    io.sockets.to(id).emit("private-chat-initiated", roomName);

    console.log(
      "Private chat initiated between",
      socket.id,
      "and",
      targetSocket.id
    );
  });
  function findSocketByUsername(username) {
    for (let [socketId, storedUsername] of socketsConected.entries()) {
      console.log("storedusername", storedUsername);
      if (storedUsername === username) {
        return { id: socketId, username: storedUsername };
      }
    }
    return null; // Return null if username is not found
  }

  // Helper function to generate a unique room name for the private chat
  // function generateRoomName(socketId1, socketId2) {
  //   return `private_chat_${socketId1}_${socketId2}`;
  // }

  socket.on("private-chat", (message) => {
    io.to(message.id).emit("private-message", message);
    console.log("messages", message);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected", socket.id);
    socketsConected.delete(socket.id);
    io.emit("clients-total", socketsConected.size);
  });

  socket.on("message", (data) => {
    // console.log(data)
    socket.broadcast.emit("chat-message", data);
  });

  socket.on("join-room", (room) => {
    socket.join(room);
    console.log("user joined room" + room);
  });

  socket.on("feedback", (data) => {
    socket.broadcast.emit("feedback", data);
  });
}
