const users = [];
const games = [];

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

const addUser = ({
  id,
  username,
  room,
  type = "contributor",
  creator = false,
}) => {
  username = username.trim().toLowerCase();
  room = room.trim().toLowerCase();

  if (!username || !room) {
    return {
      error: "Username and room are required",
    };
  }

  const existingUser = users.find((user) => {
    return user.room === room && user.username === username;
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
  console.log("user---", user);
  user.vote = value;

  if(!user) return {user: null, error: 'User not found'}

  const removed = removeUser(id);
  if (removed) {
    users.splice(removed.idx, 0, user);
    return {user, error: null}
  }
  return {user: null, error: 'Unable to update vote'}
};

const getUser = (id) => {
  return (user = users.find((user) => user.id === id));
};

const removeUser = (id) => {
  const idx = users.findIndex((user) => user.id === id);

  if (idx !== -1) {
    const user = users.splice(idx, 1);
    return { user, idx };
  }

  return null;
};

const getUsersInRoom = (room) => {
  const roomUsers = users.filter((user) => user.room === room.toLowerCase());
  return roomUsers;
};

module.exports = {
  startGame,
  addUser,
  getUser,
  getUsersInRoom,
  addVote,
};
