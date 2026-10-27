const allowRoles = (...roles)=>{ //["user"]
    return(req,res,next)=>{
        if(!roles.includes(req.user.role)){ //admin
            return res.status(403).json({
                message:"Access Denied"
            });
        }
        next();
    };
}

module.exports = allowRoles;