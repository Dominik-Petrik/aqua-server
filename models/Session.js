const { model, Schema } = require("mongoose");

const sessionSchema = new Schema({
  key: String,
  createdAt: Date,
});
module.exports = model("Session", sessionSchema);
