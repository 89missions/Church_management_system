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

           //check if user is active
            if (user.status !== 'Active') {
             return res.status(403).json({ 
             success: false, 
            message: "Your account is inactive. Please contact the secretary." 
            })
            }

           //validate role..
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

const changePassword = async (req, res) => {
    try {
        const { current_password, new_password, confirm_password } = req.body;
        const userId = req.user.id;

        if (!current_password || !new_password || !confirm_password) {
            return res.status(400).json({ 
                message: "Current password, new password, and confirmation are required" 
            });
        }

        // Validate new password length
        if (new_password.length < 6) {
            return res.status(400).json({ 
                message: "New password must be at least 6 characters" 
            });
        }

        // Validate new password matches confirmation
        if (new_password !== confirm_password) {
            return res.status(400).json({ 
                message: "New password and confirmation do not match" 
            });
        }

        // Validate new password is different from current
        if (current_password === new_password) {
            return res.status(400).json({ 
                message: "New password must be different from current password" 
            });
        }

        // Get user from database
        const result = await pool.query(
            'SELECT password_hash FROM members WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = result.rows[0];

        // Verify current password
        const isMatch = await bcrypt.compare(current_password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Current password is incorrect" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(new_password, 10);

        // Update password in database
        await pool.query(
            `UPDATE members 
             SET password_hash = $1, 
                 password_changed = true,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [hashedPassword, userId]
        );

        res.status(200).json({ 
            success: true, 
            message: "Password changed successfully" 
        });

    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: "Internal server error" });
    }
};
module.exports = {authController,changePassword}