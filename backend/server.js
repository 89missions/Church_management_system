require('dotenv').config()
const express = require('express');
const cors = require('cors')
const verifyJWT = require('./middlewares/verifyjwt.js')
const PORT = 3000;
//const testfunction = require('./testingneonconnection')
const app = express();

app.use(cors({
    Origin: '*'
}))
app.use(express.json())

app.use('/api/auth/',require('./routes/api/authroute.js'))

app.use(verifyJWT)
app.use('/api/members/',require('./routes/api/membersroute.js'))

app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`)
});
