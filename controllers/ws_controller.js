import Users from "../model/user.js";

export async function signalHandler(
  to,
  from,
  signal,
  streamType,
  io,
  onlineUsers,
  phones
) {
  console.log(to, from);

  if (from === to) console.log("user cannot call himself/herself");

  let nexaId =
    phones.get(to) || ((await Users.findOne({ phones: to })) || {}).nexaId;

  console.log(`user ${from} is calling ${nexaId} an ${streamType} call`);

  if (!nexaId) return console.log("user not in nexa yet");
  phones.set(to, nexaId);

  // get callee's data
  let callee = onlineUsers.get(nexaId);

  if (!callee) return;

  // get callers data
  let caller = onlineUsers.get(from);
  console.log(caller);

  const Unknown = { username: "Unknown", nexaId: from, avatar: null };
  io.to(callee.socketId).emit("signal", {
    signal,
    streamType,
    Caller: caller?.details ?? Unknown,
  });
}

export async function connectedUsers(socket, onlineUsers, Users, nexaId) {
  let isUserOnline = onlineUsers.get(nexaId);
  if (!isUserOnline) {
    let details = await Users.findOne({ nexaId });
    onlineUsers.set(nexaId, { socketId: socket.id, details });
  } else {
    onlineUsers.set(nexaId, { ...isUserOnline, socketId: socket.id });
  }
  console.log(`user ${nexaId} is online`);
}

export function disconnectUser(socket, onlineUsers) {
  onlineUsers.entries().forEach(([key, value]) => {
    if (value.socketId === socket.id) {
      console.log(`user ${key} has gone offline`);
      onlineUsers.delete(key);
    }
  });
}
