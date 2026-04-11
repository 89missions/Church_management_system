
const verifyRoles= (roles)=>{
    return async (req,res,next) =>{
        try {
            if (!req.user) {
                console.log('verifyrole')
                return res.status(401).json({ message: "Unauthorized. No user data." });
            }

        //get role..
        const getRole = req.user.positions

        //verifyRole..
        if(!getRole.includes(roles)){
            console.log('verifyrole')
            return res.status(403).json({message:'not allowed'})
        }

        next()
    }catch(error){
        res.status(500).json(error)
    }
}
}
module.exports = verifyRoles