const express = require('express');
const PORT = 3000;
const app = express();

app.get('/login',(req,res)=>{
    res.send('Hello everybody')
});

app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`)
});
