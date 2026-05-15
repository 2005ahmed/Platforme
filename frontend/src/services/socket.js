import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

socket.emit("join", userId);

socket.on("new_notification", (data) => {
  console.log("New notification:", data);
});