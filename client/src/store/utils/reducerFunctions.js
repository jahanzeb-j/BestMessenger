export const addMessageToStore = (state, payload) => {
  const { message, sender } = payload;
  // if sender isn't null, that means the message needs to be put in a brand new convo
  if (sender !== null) {
    const newConvo = {
      id: message.conversationId,
      otherUser: sender,
      messages: [message],
      unReadCount: message.senderId === sender.id ? 1 : null,
    };
    newConvo.latestMessageText = message.text;
    return [newConvo, ...state];
  }

  // checking existing convo
  const existingConvo = state.find(
    (convo) => convo.id === message.conversationId
  );
  const convoCopy = {
    ...existingConvo,
    messages: [...existingConvo.messages],
  };
  // add new message to the convo if exist
  if (existingConvo) {
    convoCopy.messages.push(message);
    // update latest message also
    convoCopy.latestMessageText = message.text;
    state = state.filter((convo) => convo.id !== message.conversationId);

    // count again unRead
    // filter and count unRead Messages
    const unreadMessages = convoCopy.messages.filter(
      (message) =>
        !message.isRead && message.senderId === convoCopy.otherUser.id
    );
    // set unRead count
    convoCopy.unReadCount = unreadMessages.length;
    //put this convo to the front of the list
    return [convoCopy, ...state];
  } else {
    return state;
  }
};

export const addOnlineUserToStore = (state, id) => {
  return state.map((convo) => {
    if (convo.otherUser.id === id) {
      const convoCopy = { ...convo };
      convoCopy.otherUser.online = true;
      return convoCopy;
    } else {
      return convo;
    }
  });
};

export const removeOfflineUserFromStore = (state, id) => {
  return state.map((convo) => {
    if (convo.otherUser.id === id) {
      const convoCopy = { ...convo };
      convoCopy.otherUser.online = false;
      return convoCopy;
    } else {
      return convo;
    }
  });
};

export const addSearchedUsersToStore = (state, users) => {
  const currentUsers = {};

  // make table of current users so we can lookup faster
  state.forEach((convo) => {
    currentUsers[convo.otherUser.id] = true;
  });

  const newState = [...state];
  users.forEach((user) => {
    // only create a fake convo if we don't already have a convo with this user
    if (!currentUsers[user.id]) {
      let fakeConvo = { otherUser: user, messages: [] };
      newState.push(fakeConvo);
    }
  });

  return newState;
};

export const addNewConvoToStore = (state, recipientId, message) => {
  return state.map((convo) => {
    if (convo.otherUser.id === recipientId) {
      const newConvo = { ...convo };
      newConvo.id = message.conversationId;
      newConvo.messages.push(message);
      newConvo.latestMessageText = message.text;
      return newConvo;
    } else {
      return convo;
    }
  });
};
// updating state unread count and messages to true
export const setMessageReadFunc = (state, conversationId) => {
  return state.map((convo) => {
    if (convo.id === conversationId) {
      const convoCopy = { ...convo };
      convoCopy.unReadCount = 0;
      // set message to true
      convoCopy.messages.map((message) => {
        if (message.senderId === convoCopy.otherUser.id) {
          message.isRead = true;
        }
      });
      return convoCopy;
    } else {
      return convo;
    }
  });
};
