const socket = io();

const clientsTotal = document.getElementById("client-total");

const messageContainer = document.getElementById("message-container");
const nameInput = document.getElementById("name-input");
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const addInput = document.querySelector(".add-user-input");
const addBtn = document.getElementById("add-user-btn");

const messageTone = new Audio("/message-tone.mp3");

addBtn.addEventListener("click", (e) => {
  e.preventDefault();
  login();
});

var connectedUsers = [];

var messages = [];

// source id --> point to us
// source {id:username}
// total connected user => show their username
// make room using their id + our id --problem
//

function login() {
  var userName = addInput.value;

  socket.emit("add-user", userName);
  const userList = document.querySelector(".connected-users");

  socket.on("clients-total", (users) => {
    console.log("connected users", users);

    // Clear existing list items
    userList.innerHTML = "";

    // Loop through each user and create a list item for them
    for (const [id, username] of users) {
      if (userName === username) continue;
      const listItem = document.createElement("li");
      listItem.textContent = username;

      // Add a click event listener to each list item
      listItem.addEventListener("click", () => {
        initiatePrivateChat(userName, username, id);
      });
      userList.appendChild(listItem);
    }
  });
}

var chatTo = "";

function initiatePrivateChat(source, target, id) {
  console.log("Initiating private chat with user:" + source + " and " + target);
  const sortedRoom = [source, target].sort();
  const room = `room${sortedRoom[0]}${sortedRoom[1]}`;
  console.log("Created room", room);
  chatTo = id;
  socket.emit("join-room", room);
}
messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage();
});

var rooms = [];

socket.on("private-chat-initiated", (room) => {
  socket.on(room, function (message) {
    // Handle incoming messages in the private chat room
    console.log("Received message in private chat: ", message);
  });

  // alert("Joined at room", room);
  // socket.join(room);
});

socket.on("clients-total", (data) => {
  console.log("data", data);
  clientsTotal.innerText = `Total Clients: ${data}`;
});

function sendMessage() {
  console.log("messageinput", messageInput.value);
  if (messageInput.value === "") return;
  // console.log(messageInput.value)
  const data = {
    // name: nameInput.value,
    message: messageInput.value,
    dateTime: new Date(),
    id: chatTo,
  };
  socket.emit("private-chat", data);
  addMessageToUI(true, data);
  messageInput.value = "";
}

socket.on("chat-message", (data) => {
  // console.log(data)
  messageTone.play();
  addMessageToUI(false, data);
});

function addMessageToUI(isOwnMessage, data) {
  clearFeedback();
  const element = `
      <li class="${isOwnMessage ? "message-right" : "message-left"}">
          <p class="message">
            ${data.message}
            <span>${data.name} ● ${moment(data.dateTime).fromNow()}</span>
          </p>
        </li>
        `;

  messageContainer.innerHTML += element;
  scrollToBottom();
}

socket.on("private-message", function (data) {
  console.log("Received private message: ", data);
  addMessageToUI(false, data); // Assuming you have a function to add messages to UI
});

function scrollToBottom() {
  messageContainer.scrollTo(0, messageContainer.scrollHeight);
}

// messageInput.addEventListener("focus", (e) => {
//   console.log("value", nameInput);
//   socket.emit("feedback", {
//     feedback: `✍️ ${nameInput.value} is typing a message`,
//   });
// });

// messageInput.addEventListener("keypress", (e) => {
//   socket.emit("feedback", {
//     feedback: `✍️ ${nameInput.value} is typing a message`,
//   });
// });
messageInput.addEventListener("blur", (e) => {
  socket.emit("feedback", {
    feedback: "",
  });
});

socket.on("feedback", (data) => {
  clearFeedback();
  const element = `
        <li class="message-feedback">
          <p class="feedback" id="feedback">${data.feedback}</p>
        </li>
  `;
  messageContainer.innerHTML += element;
});

function clearFeedback() {
  document.querySelectorAll("li.message-feedback").forEach((element) => {
    element.parentNode.removeChild(element);
  });
}
