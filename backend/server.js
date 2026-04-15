require('dotenv').config()
const express = require('express');
const cors = require('cors')
const verifyJWT = require('./middlewares/verifyjwt.js')
const PORT = 3000;
const app = express();

app.use(cors({
    origin: '*'
}))
app.use(express.json())

console.log('auth route..')
app.use('/api/auth/',require('./routes/api/authroute.js'))

app.use(verifyJWT)
app.use('/api/members/',require('./routes/api/membersroute.js'))
app.use('/api/offerings/',require('./routes/api/offeringsroute.js'))

app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`)
});
