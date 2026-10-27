require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const Student = require("./models/Student");
const studentRoutes = require("./routes/studentRoutes");

const port = process.env.PORT;
const app = express();

app.use(express.json());

app.use("/", studentRoutes);

const startServer = async () => {
  await connectDB();
  app.listen(port, () => {

    console.log(`The server is running on the port ${port}`);
  });
}
startServer();