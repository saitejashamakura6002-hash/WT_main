const bcrypt = require("bcrypt");
const User = require("../models/User");

const register = async (req,res)=>{
    const {
        name,
        email,
        password,
        role
    } = req.body;

    //check whether user already exists
    const existingUser = await User.findOne({email});

    if(existingUser){
        return res.status(409).json({
            message:"Email already registered"
        });
    }

    //Hash Password

    const hashedPassword = await bcrypt.hash(password,12);

    //Store user in MongoDB

    const user = await User.create({
        name,
        email,
        password:hashedPassword,
        role
    });

    res.status(201).json({
        message:"User registered successfully",
        user:{
            id:user._id,
            name:user.name,
            email:user.email,
            role:user.role
        }
    });
};

const login = async(req,res)=>{
        const {
            email,
            password
        } = req.body;

        const user = await User.findOne({
            email
        });

        const passwordMatched = await bcrypt.compare(password, user.password);

        req.session.user = {
        id: user._id,
        email: user.email,    
        role: user.role
        };

        res.status(200).json({
            message:"Login Successful",
            user:{
                id:user._id,
                name:user.name,
                email:user.email,
                role:user.role
            }
        });
    }

    const logout = async (req,res) => {
    req.session.destroy(
    error => {
      if (error) {
        return res.status(500).json({message:"Logout failed"});
      }
      res.clearCookie("connect.sid");
      res.status(200).json({message:"Logout successful"});

    }
  );

};

module.exports = {register,login,logout}