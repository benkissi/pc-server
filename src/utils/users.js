const users = [];
const games = [];
const tasks = [];

const startGame = ({ id, name, voting, room, username }) => {
  name = name.trim().toLowerCase();
  voting = voting.trim().toLowerCase();

  if (!name || !voting || !username) {
    return {
      error: "Username, game name and voting type are required",
    };
  }

  const game = {
    id,
    name,
    voting,
    room,
    reveal: false,
  };

  const creator = {
    id,
    username,
    room,
    type: "facilitator",
    creator: true,
  };

  games.push(game);
  addUser(creator);

  return { game };
};

const getGame = (id) => {
  console.log("games", games);
  return games.find((game) => game.id.toLowerCase() === id.toLowerCase());
};

const toggleReveal = (id) => {
  const game = games.find((game) => game.id === id);

  if (!game) {
    return {
      error: "Game was not found",
    };
  }
  game.reveal = !game.reveal;

  return {};
};

const completeTask = (id) => {
  const gameTasks = tasks.filter((task) => task.gameId === id);
  if (!gameTasks) {
    return { error };
  }
  const task = gameTasks.find((task) => !task.completed);
  if (!task) {
    return { error };
  }
  const game = getGame(id);
  const users = getUsersInRoom(game.room);
  const votedUsers = users.filter(user => user.voted !== null)

  const score = users.reduce((acc, curr) => {
    return acc + (curr?.vote || 0);
  }, 0);
  console.log("score", score);
  task.completed = true;
  task.score = (score / votedUsers.length).toFixed(1);

  return {
    task,
  };
};

const addUser = ({
  id,
  username,
  room,
  type = "contributor",
  creator = false,
}) => {
  username = username.trim();
  room = room.trim();

  if (!username || !room) {
    return {
      error: "Username and room are required",
    };
  }

  const existingUser = users.find((user) => {
    return (
      user.room === room &&
      user.username.toLowerCase() === username.toLowerCase()
    );
  });

  if (existingUser) {
    return { error: "Username is in use in this room" };
  }

  const user = {
    id,
    username,
    room,
    type,
    creator,
  };
  users.push(user);
  return { user };
};

const addVote = ({ id, value }) => {
  const user = getUser(id);
  user.vote = value;

  if (!user) return { user: null, error: "User not found" };

  const removed = removeUser(id);
  if (removed) {
    users.splice(removed.idx, 0, user);
    return { user, error: null };
  }
  return { user: null, error: "Unable to update vote" };
};

const getUser = (id) => {
  return users.find((user) => user.id === id);
};

const removeUser = (id) => {
  const idx = users.findIndex((user) => user.id === id);

  if (idx !== -1) {
    const user = users.splice(idx, 1);
    return { user, idx };
  }

  return {};
};

const getUsersInRoom = (room) => {
  const roomUsers = users.filter(
    (user) => user.room.toLowerCase() === room.toLowerCase()
  );
  return roomUsers;
};

const addTask = ({ gameId, title, completed = false, score = null }) => {
  if (!title) {
    return {
      error: "Task title is required",
    };
  }

  const task = {
    id: Date.now(),
    title,
    completed,
    score,
    gameId,
  };

  tasks.push(task);
  reset(gameId);
  return {
    task,
  };
};

const reset = (gameId) => {
  const game = getGame(gameId);
  const users = getUsersInRoom(game.room);

  users.forEach((user) => {
    user.vote = null;
  });
  console.log("users in room", users);
  game.reveal = false;
};

const getGameTasks = (id) => {
  return tasks.filter((task) => task.gameId.toLowerCase() === id.toLowerCase());
};

const updateGame = ({ gameId, value, fieldName }) => {
  const game = games.find(
    (game) => game.id.toLowerCase() === gameId.toLowerCase()
  );

  game[fieldName] = value;

  if (!game) {
    null;
  }

  return game;
};

const updateUser = ({ userId, value, fieldName }) => {
  const user = users.find((user) => user.id === userId);

  if (!user) return null;
  user[fieldName] = value;
  return user;
};

module.exports = {
  startGame,
  addUser,
  getUser,
  getUsersInRoom,
  addVote,
  addTask,
  getGame,
  getGameTasks,
  toggleReveal,
  completeTask,
  removeUser,
  updateGame,
  updateUser,
};
