const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
  name: String,
  id: String,
  photo: String,
  isActive: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Users", UserSchema);
