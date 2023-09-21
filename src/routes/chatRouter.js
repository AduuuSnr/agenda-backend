const express = require("express");
const {
  send,
  getConversation,
  sendGroup,
  getConversations,
  getConversationGroup
} = require("../controllers/chatController");

const router = express.Router();

router.route("/send").post(send);
router.route("/sendGroup").post(sendGroup);
router.route("/get").post(getConversation);
router.route("/getConversations").post(getConversations);
router.route("/getConversationGroup").post(getConversationGroup);

module.exports = router;
