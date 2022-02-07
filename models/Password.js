const { model, Schema } = require("mongoose");

const passwordSchema = new Schema({
  password: String,
  lastChanged: Date,
});
module.exports = model("Password", passwordSchema);
