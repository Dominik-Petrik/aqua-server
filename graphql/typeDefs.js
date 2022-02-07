const { gql } = require("apollo-server");
const moment = require("moment");

module.exports = gql`
  scalar Date
  type Order {
    id: ID!
    state: String!
    createdAt: Date!
    surname: String
    name: String
    city: String
    adress: String
    email: String
    phone: String
    birthdate: Date
    ico: String
    note: String
    finishedAt: Date
    createdBy: String
    finishedBy: String
  }
  type EditLog {
    id: ID!
    field: String!
    value: String
  }

  input OrderInput {
    surname: String
    name: String
    city: String
    adress: String
    email: String
    phone: String
    birthdate: Date
    ico: String
    note: String
    createdBy: String
  }

  type Password {
    password: String
    lastChanged: Date
  }

  type Query {
    getOrder(id: ID!): Order
    getOrders(
      order: Int
      states: [String]
      offset: Int
      createdAfter: Date
      createdBefore: Date
    ): [Order]
    autocompleteOrder(searchTerm: String): [String]
    searchOrders(searchTerm: String): [Order]
    autocompleteCustomer(searchTerm: String): [Customer]
    authSession(key: String): Boolean
    login(password: String): Boolean
  }

  type Mutation {
    createOrder(orderInput: OrderInput): Order!
    editOrder(orderID: ID, field: String, value: String): EditLog
    deleteOrder(orderID: ID): String
    populateOrders(number: Int): String
    createCustomer(customerInput: CustomerInput): ID!
    createSession: Session
    deleteSession(key: String): String
    changePassword(password: String): String
    deleteAll(confirm: String): String
    import: Int
    importCustomers: Int
  }

  type Subscription {
    orderCreated: Order
    orderEdited: EditLog
    orderDeleted: String
  }

  type Customer {
    id: ID!
    createdAt: Date!
    surname: String!
    name: String
    city: String
    adress: String
    email: String
    phone: String
    birthdate: Date
    ico: String
  }

  type Session {
    key: String!
    createdAt: Date!
  }

  input CustomerInput {
    surname: String
    name: String
    city: String
    adress: String
    email: String
    phone: String
    birthdate: Date
    ico: String
  }
`;
