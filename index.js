const { makeExecutableSchema } = require("@graphql-tools/schema");
const { ApolloServer } = require("apollo-server-express");
const express = require("express");
const { execute, subscribe } = require("graphql");
const { createServer } = require("http");
const mongoose = require("mongoose");
const { SubscriptionServer } = require("subscriptions-transport-ws");
const resolvers = require("./graphql/resolvers");
const typeDefs = require("./graphql/typeDefs");

const MONGODB =
  //oficiální
  "mongodb+srv://Dominik:whU8LX0VWvhKoGCN@cluster0.36rcq.mongodb.net/AquaZakazky?retryWrites=true&w=majority";
//demo
/* "mongodb+srv://user:pYqsaKFq3X@cluster0.4c18q.mongodb.net/DemoZakazky?retryWrites=true&w=majority"; */

(async function () {
  const app = express();

  const httpServer = createServer(app);
  const schema = makeExecutableSchema({
    resolvers,
    typeDefs,
  });

  const subscriptionServer = SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
    },
    { server: httpServer, path: "/graphql" }
  );

  const server = new ApolloServer({
    schema,
    plugins: [
      {
        async serverWillStart() {
          return {
            async drainServer() {
              subscriptionServer.close();
            },
          };
        },
      },
    ],
  });
  await server.start();
  server.applyMiddleware({ app });

  mongoose.connect(MONGODB, { useNewUrlParser: true });

  const PORT = process.env.port || 4000;
  httpServer.listen(PORT, () => {
    console.log(
      `🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`
    );
  });
})();
