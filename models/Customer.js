const { model, Schema } = require("mongoose");

const customerSchema = new Schema({
  createdAt: Date,
  surname: String,
  name: String,
  city: String,
  adress: String,
  email: String,
  phone: String,
  birthdate: Date,
  ico: String,
});

module.exports = model("Customer", customerSchema);
