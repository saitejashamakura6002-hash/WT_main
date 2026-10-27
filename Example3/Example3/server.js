require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const cookieParser=require("cookie-parser");
// const sessionMiddleware=require("./config/session");
const studentRoutes = require("./routes/studentRoutes");
const authRoutes = require("./routes/authRoutes");

const port = process.env.PORT;
const app = express();

app.use(express.json());
app.use(cookieParser());
// app.use(sessionMiddleware);

app.use("/",studentRoutes);
app.use("/api/auth",authRoutes)


const startServer = async()=>{
 await connectDB();
app.listen(port,  () =>{
   
    console.log(`The server is running on the port ${port}`);
});
}
startServer();