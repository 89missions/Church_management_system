const pool = require('./config/dbConfig')

const getSecretaryname =async(req,res)=>{
    try {
        const getname = await pool.query('SELECT first_name FROM members')
        console.log('successfully connected to neon.. and the names are ' + getname.rows[0].first_name)
       return res.json(getname.rows[0])
    } catch (error) {
        console.log(error)
    }
}

module.exports = getSecretaryname