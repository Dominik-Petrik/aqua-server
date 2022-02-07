const { model, Schema } = require("mongoose");

const orderSchema = new Schema({
  state: String,
  createdAt: Date,
  surname: String,
  name: String,
  city: String,
  adress: String,
  email: String,
  phone: String,
  birthdate: Date,
  ico: String,
  note: String,
  finishedAt: Date,
  createdBy: String,
  finishedBy: String,
});

module.exports = model("Order", orderSchema);
