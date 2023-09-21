const mongoose = require("mongoose");

const GroupChatSchema = mongoose.Schema(
  {
    members: Array,
    owner: Number,
    roomName: String,
    roomIdentity: String,
    type: String,
    messages: [
      {
        text: String,
        createdAt: String,
        user: {
          _id: Number,
          name: String,
          avatar: String,
        },
        image: String,
        pdf: String,
        video: String,
        csv: String,
        docx: String,
        location: Object,
      },
    ],
  },
  {
    strict: false,
  }
);

module.exports = mongoose.model("GroupChats", GroupChatSchema);
