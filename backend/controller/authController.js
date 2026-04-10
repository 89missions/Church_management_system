require('dotenv').config()
const bcrypt = require('bcryptjs')
const pool = require('../config/dbConfig')
const jwt = require('jsonwebtoken')

const authController = async (req,res)=>{
    try {
        const {email,password,role} = req.body

           //check if email is a member of the church
           const emailexist = await pool.query('SELECT * FROM members WHERE email = $1', [email]);
           const user = emailexist.rows[0]
           if(!user){
           return res.status(401).json({message:"You must be added to the system by the secretary..."});
           }

           // Add this after checking if user exists
            if (user.status !== 'Active') {
             return res.status(403).json({ 
             success: false, 
            message: "Your account is inactive. Please contact the secretary." 
            })
            }

           //validate role..
           console.log(user.positions)
           const validateRole = user.positions.includes(role)
           if(!validateRole){
            return res.status(403).json({message:"You do not have that role..."})
           }

           //compare hashed password
           const comparePassword = await bcrypt.compare(password,user.password_hash);
           if(!comparePassword){
            return res.status(401).json({message:"Incorrect password.."})
           }

           const needsPasswordChange = !user.password_changed

           //make jwts for identification
           const access_token = jwt.sign(
            {id:user.id,email:email,role:role, positions:user.positions},
            process.env.ACCESS_TOKEN_SECRET,
            {expiresIn: '1d'}
        )
           const refresh_token = jwt.sign(
            {id:user.id,email:email,role:role, positions:user.positions},
            process.env.REFRESH_TOKEN_SECRET,
            {expiresIn: '3d'}
        )

        
        //sending it to the client
        res.status(200).json({
            success: true,
            access_token: access_token,
            refresh_token: refresh_token,
            needsPasswordChange: needsPasswordChange,
            user: {
                id: user.id,
                name: `${user.first_name} ${user.last_name}`,
                email: user.email,
                positions: user.positions,
                role: role
            }
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:"Internal Server Error.."})
    }
}

const loginController = ()=>{
    //handlelogin code comes here
}
module.exports = {authController, loginController}