const router = require("express").Router();
const { User, Conversation, Message } = require("../../db/models");
const { Op } = require("sequelize");
const onlineUsers = require("../../onlineUsers");

// get all conversations for a user, include latest message text for preview, and all messages
// include other user model so we have info on username/profile pic (don't include current user info)
// TODO: for scalability, implement lazy loading
router.get("/", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const userId = req.user.id;
    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: {
          user1Id: userId,
          user2Id: userId,
        },
      },
      attributes: ["id"],
      order: [[Message, "createdAt", "ASC"]],
      include: [
        { model: Message, order: ["createdAt", "DESC"] },
        {
          model: User,
          as: "user1",
          where: {
            id: {
              [Op.not]: userId,
            },
          },
          attributes: ["id", "username", "photoUrl"],
          required: false,
        },
        {
          model: User,
          as: "user2",
          where: {
            id: {
              [Op.not]: userId,
            },
          },
          attributes: ["id", "username", "photoUrl"],
          required: false,
        },
      ],
    });

    for (let i = 0; i < conversations.length; i++) {
      const convo = conversations[i];
      const convoJSON = convo.toJSON();

      // set a property "otherUser" so that frontend will have easier access
      if (convoJSON.user1) {
        convoJSON.otherUser = convoJSON.user1;
        delete convoJSON.user1;
      } else if (convoJSON.user2) {
        convoJSON.otherUser = convoJSON.user2;
        delete convoJSON.user2;
      }

      // set property for online status of the other user
      if (onlineUsers.includes(convoJSON.otherUser.id)) {
        convoJSON.otherUser.online = true;
      } else {
        convoJSON.otherUser.online = false;
      }

      // set properties for notification count and latest message preview
      const {messages} = convoJSON;
      const latestMessage = messages[messages.length - 1];
      convoJSON.latestMessageText = latestMessage.text;
      convoJSON.latestMessageCreatedAt = latestMessage.createdAt;

      // filter and count unRead Messages
      const unreadMessages = convoJSON.messages.filter(
        (message) =>
          !message.isRead &&
          message.senderId === convoJSON.otherUser.id
      );
      // set unRead count
      convoJSON.unReadCount = unreadMessages.length;
      conversations[i] = convoJSON;
    }

    // sorting conversations latest on top
    conversations.sort(
      (a, b) => b.latestMessageCreatedAt - a.latestMessageCreatedAt
    );

    res.json(conversations);
  } catch (error) {
    next(error);
  }
});

// update message isRead to True of selected Convo
router.put("/:conversationId/read", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }

    const { conversationId } = req.params;
    const userId = req.user.id;

    await Message.update(
      { isRead: true },
      {
        where: {
          conversationId: conversationId,
          [Op.not]: [{ senderId: userId }],
        },
      }
    );

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
