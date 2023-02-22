import { Server } from "socket.io";
import Connection from "./database/db.js";
import express from "express";
import { createServer } from "http";
import {
  getDocument,
  updateDocument,
} from "./controller/document-controller.js";
const PORT = process.env.PORT || 9000;
const app = express();
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}
const httpServer = createServer(app);
httpServer.listen(PORT);
// const io = new Server(PORT, {
//   cors: {
//     origin: "http://localhost:3000",
//     methods: ["GET", "POST"],
//   },
// });
const io = new Server(httpServer);
const URL =
  process.env.MONGO_URL ||
  `mongodb://onlineediter:9pw57ja9z577ayBS@ac-qcarrul-shard-00-00.jx5ckzu.mongodb.net:27017,ac-qcarrul-shard-00-01.jx5ckzu.mongodb.net:27017,ac-qcarrul-shard-00-02.jx5ckzu.mongodb.net:27017/?ssl=true&replicaSet=atlas-k28a5l-shard-0&authSource=admin&retryWrites=true&w=majority`;
Connection(URL);
//creating a server connection
//"connection"=> is the socket server name give, and
//second argument is the callbackFunction
//send event to client io.on meaning
io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    const document = await getDocument(documentId);
    socket.join(documentId);
    //if id matches send the document data
    socket.emit("load-document", document.data);
    //recive the changes from the client
    socket.on("send-changes", (delta) => {
      //broadcast or send all the changes to all the conneted clients
      //except the sender with the particular id
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });
    //to the save the document to database
    //disadvatage is that is saves every 2 seconds
    //even thougth the editor is live
    socket.on("save-document", async (data) => {
      await updateDocument(documentId, data);
    });
  });
});
