const requireSessionAuth = (req,res,next)=>{
    if(!req.session ||  !req.session.user){
        return res.status(401).json({
            message:"please login first"
        });
    };
        req.user=req.session.user;
        next();
}

module.exports=requireSessionAuth;

