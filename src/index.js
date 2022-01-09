const http = require("http");
const app = require("./app");
const socketIo = require("socket.io");

const { generateMessage } = require("./utils/messages");
const {
  addUser,
  getUser,
  getUsersInRoom,
  startGame,
  addVote,
  addTask,
  getGame,
  getGameTasks,
  toggleReveal,
  completeTask,
  removeUser,
  updateUser,
  updateGame,
} = require("./utils/users");

const PORT = process.env.PORT || 4001;

const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("New client connected");
  // socket.emit('connected', 'you connected')

  socket.on("join", ({ username, room, gameId }, callback) => {
    const { user, error } = addUser({ id: socket.id, username, room });
    const game = getGame(gameId.toLowerCase());
    if (error) {
      return callback(error);
    }

    if (!game) {
      return callback("Game not found");
    }

    socket.join(user.room);

    socket.emit("system", generateMessage("System", "Welcome"));
    socket.broadcast
      .to(user.room)
      .emit(
        "system",
        generateMessage("System", `${user.username} has joined!`)
      );
    io.to(user.room).emit("roomInfo", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    socket.emit("tasksUpdate", {
      room: game.room,
      tasks: getGameTasks(gameId),
    });
    callback(null, game, user);
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit("message", generateMessage(user.username, message));
  });

  socket.on("startGame", ({ name, voting, username }, callback) => {
    const room = `${socket.id}+${name}`.trim();
    const { game, error } = startGame({
      id: socket.id,
      name,
      voting,
      room,
      username,
    });

    if (error) {
      return callback(error);
    }
    const user = getUser(socket.id);
    socket.join(room);
    socket.emit("system", generateMessage("System", "Welcome"));

    io.to(room).emit("roomInfo", {
      room: room,
      users: getUsersInRoom(room),
    });
    callback(null, game, user);
  });

  socket.on("vote", ({ id, value }, callback) => {
    const { user, error } = addVote({ id, value });

    if (error) {
      return callback(error);
    }
    console.log("all users---", getUsersInRoom(user.room));
    io.to(user.room).emit("roomInfo", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
  });

  socket.on("addTask", ({ gameId, title }, callback) => {
    const { task, error } = addTask({ gameId, title });
    const game = getGame(gameId);
    if (error) {
      return callback(error);
    }

    if (task) {
      io.to(game.room).emit("tasksUpdate", {
        room: game.room,
        tasks: getGameTasks(gameId),
      });

      io.to(game.room).emit("roomInfo", {
        room: game.room,
        users: getUsersInRoom(game.room),
      });

      io.to(game.room).emit("gameUpdate", game);
    }
  });

  socket.on("toggleReveal", ({ gameId }, callback) => {
    const { error } = toggleReveal(gameId);

    if (error) {
      return callback(error);
    }

    const { error: completeError } = completeTask(gameId);

    if (completeError) {
      return callback(completeError);
    }

    const game = getGame(gameId);
    io.to(game.room).emit("gameUpdate", game);

    io.to(game.room).emit("tasksUpdate", {
      room: game.room,
      tasks: getGameTasks(gameId),
    });
  });

  socket.on("updateGame", ({ gameId, value, fieldName }, callback) => {
    const game = getGame(gameId);
    if (!game) {
      callback("Name change failed!. Game was not found");
      return;
    }

    const updatedGame = updateGame({ gameId, value, fieldName });
    console.log("updated game**", updatedGame);
    if (!updatedGame) {
      callback("Name update failed");
      return;
    }

    io.to(updatedGame.room).emit("gameUpdate", game);
    callback();
  });

  socket.on("updateUser", ({ userId, value, fieldName }, callback) => {
    const user = getUser(userId);

    if (!user) {
      callback("User not found");
      return;
    }

    const updatedUser = updateUser({ userId, value, fieldName });

    if (!updatedUser) {
      callback("User update failed");
      return;
    }

    io.to(user.room).emit("roomInfo", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback();
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    const { user } = removeUser(socket.id);
    console.log("deleted", user);
    if (user && user[0]) {
      io.to(user[0].room).emit("roomInfo", {
        room: user[0].room,
        users: getUsersInRoom(user[0].room),
      });

      socket.broadcast
        .to(user[0].room)
        .emit(
          "system",
          generateMessage("System", `${user[0].username} has left!`)
        );
    }
  });
});
server.listen(PORT, () => console.log(`Listening on ${PORT}`));
