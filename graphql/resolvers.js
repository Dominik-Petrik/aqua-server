const casual = require("casual");
const { PubSub } = require("graphql-subscriptions");
const { now } = require("mongoose");
const bcrypt = require("bcrypt");
const Customer = require("../models/Customer");
const Order = require("../models/Order");
const crypto = require("crypto");
const Session = require("../models/Session");
const Password = require("../models/Password");
let o = require("./import-orders.json");
let c = require("./import-customers.json");
const { count } = require("console");
const pubsub = new PubSub();

module.exports = {
  Mutation: {
    async createOrder(
      _,
      {
        orderInput: {
          surname,
          name,
          city,
          adress,
          email,
          phone,
          birthdate,
          ico,
          note,
          createdBy,
        },
      }
    ) {
      const newOrder = new Order({
        state: "Nová",
        createdAt: now(),
        surname: surname,
        name: name,
        city: city,
        adress: adress,
        email: email,
        phone: phone,
        birthdate: birthdate,
        ico: ico,
        note: note,
        finishedAt: null,
        createdBy: createdBy,
        finishedBy: null,
      });
      const res = await newOrder.save();

      pubsub.publish("ORDER_CREATED", {
        orderCreated: {
          id: res.id,
          state: "Nová",
          createdAt: res.createdAt,
          surname: surname,
          name: name,
          city: city,
          adress: adress,
          email: email,
          phone: phone,
          birthdate: birthdate,
          ico: ico,
          note: note,
          finishedAt: null,
          createdBy: createdBy,
          finishedBy: null,
        },
      });

      return {
        id: res.id,
        ...res._doc,
      };
    },
    async editOrder(_, { orderID, field, value }) {
      const order = await Order.findById(orderID);
      order[field] = value;
      if (field == "state" && value == "Hotová") {
        this.editOrder(_, {
          orderID: orderID,
          field: "finishedAt",
          value: now().toISOString(),
        });
      }
      const res = await order.save();
      pubsub.publish("ORDER_EDITED", {
        orderEdited: {
          id: res.id,
          field: field,
          value: value,
        },
      });
      return {
        id: res.id,
        field: field,
        value: value,
      };
    },
    async deleteOrder(_, { orderID }) {
      try {
        const res = Order.findOneAndDelete({ _id: orderID }, () => {});
        pubsub.publish("ORDER_DELETED", {
          orderDeleted: orderID,
        });
        return orderID;
      } catch (error) {
        console.log(error);
      }
    },
    async createCustomer(
      _,
      {
        customerInput: {
          surname,
          name,
          city,
          adress,
          email,
          phone,
          birthdate,
          ico,
        },
      }
    ) {
      const doesExist = await Customer.findOne({
        surname,
        name,
        city,
        adress,
        email,
        phone,
        birthdate,
        ico,
      });
      if (doesExist) {
        return doesExist._id;
      }
      const newCustomer = new Customer({
        createdAt: now(),
        surname: surname,
        name: name,
        city: city,
        adress: adress,
        email: email,
        phone: phone,
        birthdate: birthdate,
        ico: ico,
      });
      const res = await newCustomer.save();
      return res.id;
    },
    //only for testing
    async populateOrders(_, { number }) {
      const orders = [];
      for (let index = 0; index < number; index++) {
        orders.push(
          new Order({
            state: "Nová",
            createdAt: casual.unix_time,
            surname: casual.last_name,
            name: casual.first_name,
            city: casual.city,
            adress: casual.address1,
            email: casual.email,
            phone: casual.phone,
            birthdate: casual.unix_time,
            ico: casual.integer(168516, 21815186),
            note: casual.sentence,
            finishedAt: casual.unix_time,
            createdBy: casual.first_name,
            finishedBy: casual.first_name,
          })
        );
      }
      const res = await Order.insertMany(orders);
      return "Saved";
    },
    async deleteAll(_, { confirm }) {
      if (confirm == "IWANTTODELETEALL") {
        const res = await Order.deleteMany();
        return "deleted";
      }
      return "not deleted";
    },

    async import() {
      let count = 0;
      o.map(async (o) => {
        const newOrder = new Order({
          state: o.state,
          createdAt: o.createdAt,
          surname: o.surname,
          name: o.name,
          city: o.city,
          adress: o.adress,
          email: o.email,
          phone: o.phone,
          birthdate: o.birthdate,
          ico: o.ico,
          note: o.note,
          finishedAt: o.finishedAt,
          createdBy: o.createdBy,
          finishedBy: o.finishedBy,
        });
        await newOrder.save();
        count++;
      });
      return count;
    },
    async importCustomers() {
      let count = 0;
      c.map(async (u) => {
        const newCustomer = new Customer({
          createdAt: u.createdAt,
          surname: u.surname,
          name: u.name,
          city: u.city,
          adress: u.adress,
          email: u.email,
          phone: u.phone,
          birthdate: u.birthdate,
          ico: u.ico,
        });
        await newCustomer.save();
        count++;
      });
      return count;
    },
    async createSession() {
      const key = crypto.randomBytes(20).toString("hex");
      const session = new Session({ key: key, createdAt: now() });
      const res = await session.save();

      return session;
    },
    async deleteSession(_, { key }) {
      try {
        const res = await Session.findOneAndDelete({ key: key });
        return "deleted";
      } catch (error) {
        console.log(error);
        return "not deleted";
      }
    },
    async changePassword(_, { password }) {
      const encrypted = await bcrypt.hash(password, 10);
      const newPassword = new Password({
        password: encrypted,
        lastChanged: now(),
      });
      await newPassword.save();
      return "Password changed";
    },
  },

  Subscription: {
    orderCreated: {
      subscribe: () => pubsub.asyncIterator("ORDER_CREATED"),
    },
    orderEdited: {
      subscribe: () => pubsub.asyncIterator("ORDER_EDITED"),
    },
    orderDeleted: {
      subscribe: () => pubsub.asyncIterator("ORDER_DELETED"),
    },
  },
  Query: {
    async autocompleteOrder(_, { searchTerm }) {
      newTerm = searchTerm.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const agg = [
        {
          $search: {
            compound: {
              should: [
                {
                  autocomplete: {
                    query: searchTerm,
                    path: "surname",
                  },
                },
                {
                  autocomplete: {
                    query: searchTerm,
                    path: "city",
                  },
                },
              ],
            },
          },
        },
        { $limit: 10 },
      ];
      try {
        const orders = await Order.aggregate(agg);
        let results = [];
        const re = new RegExp(newTerm, "i");

        if (orders.length > 0) {
          orders.map((order) => {
            if (
              re.test(
                order.surname.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
              ) &&
              !results.includes(order.surname)
            )
              results.push(order.surname);
            else if (
              re.test(
                order.city.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
              ) &&
              !results.includes(order.city)
            )
              results.push(order.city);
          });

          return results;
        } else {
          throw new Error("No orders found");
        }
      } catch (error) {
        throw new Error(error);
      }
    },
    async getOrder(_, { id }) {
      const order = await Order.findById(id);
      return order;
    },
    async getOrders(_, { states, order, offset, createdAfter, createdBefore }) {
      createdAfter = createdAfter ? createdAfter : 0;
      createdBefore = createdBefore ? createdBefore : 32500911600000;
      const orders = await Order.find({
        state: { $in: states },
        createdAt: { $gte: createdAfter, $lte: createdBefore },
      })

        .sort({ createdAt: order })
        .limit(30)
        .skip(offset);

      return orders;
    },
    async searchOrders(_, { searchTerm }) {
      const agg = [
        {
          $search: {
            index: "search",
            text: {
              query: searchTerm,
              fuzzy: { maxEdits: 1 },
              path: {
                wildcard: "*",
              },
            },
          },
        },
        {
          $limit: 50,
        },
      ];
      const orders = await Order.aggregate(agg).sort({ createdAt: -1 });
      orders.map((order) => (order.id = order._id));
      return orders;
    },
    async autocompleteCustomer(_, { searchTerm }) {
      const agg = [
        {
          $search: {
            index: "customerSearch",
            autocomplete: {
              query: searchTerm,
              path: "surname",
            },
          },
        },
        { $limit: 10 },
      ];
      const customers = await Customer.aggregate(agg);
      const results = [];
      const re = new RegExp(searchTerm, "i");
      if (customers.length > 0) {
        customers.map((customer) => {
          if (re.test(customer.surname) && !results.includes(customer)) {
            customer.id = customer._id;
            results.push(customer);
          }
        });
      }
      return results;
    },
    async authSession(_, { key }) {
      const session = await Session.find({ key: key });
      if (session.length) {
        return true;
      }
      return false;
    },
    async login(_, { password }) {
      const encrypted = await Password.findOne(
        {},
        {},
        { sort: { lastChanged: -1 } }
      );

      const isCorrect = bcrypt.compare(password, encrypted.password);
      return isCorrect;
    },
  },
};
