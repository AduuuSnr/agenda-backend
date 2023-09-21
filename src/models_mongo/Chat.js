const mongoose = require("mongoose");

const ChatSchema = mongoose.Schema(
  {
    sender: Number,
    reciever: Number,
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
        sent: Boolean,
        received: Array
      },
    ],
  },
  {
    strict: false,
  }
);

module.exports = mongoose.model("Chats", ChatSchema);
