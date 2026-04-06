require('dotenv').config()
const express = require('express');
const cors = require('cors')
const PORT = 3000;
//const testfunction = require('./testingneonconnection')
const app = express();
app.use(express.json())
app.use(cors({
    Origin: '*'
}))

app.use('/api/auth/login',require('./routes/api/authroute.js'))

app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`)
});
