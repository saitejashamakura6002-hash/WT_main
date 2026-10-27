const session = require("express-session");
const {MongoStore} = require("connect-mongo");

const sessionMiddleware = session({
    secret : process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:false,
    store: MongoStore.create({
        mongoUrl:process.env.MONGO_URI,
        collectionName: "sessions",    
        ttl: 30 * 60
    }),
    cookie:{
        httpOnly:true,
        secure:false,
        sameSite:"lax",
        maxAge:30*60*1000
    }
});
module.exports=sessionMiddleware;