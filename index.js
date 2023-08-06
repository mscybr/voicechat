const express = require("express");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "http://localhost",
    methods: ["GET", "POST"],
  },
});

//To hold user's information
const socketsStatus = {};
const sockets = {};
let adminsocket = null;
let state_of_mic = {};

http.listen(3000, () => {
  console.log("the app is run in port 3000!");
});

io.on("connection", async function (socket) {
  const socketId = socket.id;
  socketsStatus[socketId] = { mute: true };
  sockets[socketId] = socket;

  socket.on("admin", function () {
    adminsocket = socket;
    delete socketsStatus[socketId];
  });

  socket.on("voice", function (data) {
    var newData = data.split(";");
    newData[0] = "data:audio/ogg;";
    newData = newData[0] + newData[1];

    if (adminsocket) adminsocket.emit("send", newData);
    // for (const id in socketsStatus) {
    //   if (id != socketId && !socketsStatus[id].mute) {
    //     // socket.broadcast.to(id).emit("send", newData);
    //   }
    // }
  });

  socket.on("name", function (data) {
    socketsStatus[socketId].name = data;
    if (state_of_mic[data] == false) {
      sockets[socketId].emit("unmute");
      if (socketsStatus[socketId].mute) {
        delete socketsStatus[socketId].mute;
      }
    }

    console.log(state_of_mic);
  });

  socket.on("muteUser", function (data) {
    socketsStatus[data].mute = true;
    state_of_mic[socketsStatus[data].name] = true;

    sockets[data].emit("mute");
    refresh();
    // io.sockets.emit("usersUpdate",socketsStatus);
  });
  socket.on("unmuteUser", function (data) {
    delete socketsStatus[data].mute;
    sockets[data].emit("unmute");
    state_of_mic[socketsStatus[data].name] = false;

    refresh();
    // io.sockets.emit("usersUpdate",socketsStatus);
  });

  socket.on("getStatus", function () {
    refresh();
  });

  socket.on("disconnect", function () {
    delete socketsStatus[socketId];
    delete sockets[socketId];
    refresh();
  });

  function refresh() {
    if (adminsocket) adminsocket.emit("refreshed_online", socketsStatus);
  }

  setTimeout(() => refresh(), 1000);
});
