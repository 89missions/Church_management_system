require('dotenv').config()
const express = require('express');
const cors = require('cors')
const verifyJWT = require('./middlewares/verifyjwt.js')
const cron = require('node-cron');
const { sendNotificationToAll } = require('./utils/notification');
const PORT = 3000;
const app = express();
app.use(cors({
    origin: '*'
}))
app.use(express.json())

app.use('/api/auth/', require('./routes/api/authroute.js'))

app.use(verifyJWT)
app.use('/api/members/', require('./routes/api/membersroute.js'))
app.use('/api/offerings/', require('./routes/api/offeringsroute.js'))
app.use('/api/events/', require('./routes/api/eventroute.js'))
app.use('/api/push/', require('./routes/api/pushroute.js'))

// Saturday 6pm reminder cron job (runs every Saturday at 18:00)
cron.schedule('0 18 * * 6', async () => {
    console.log('Running Saturday reminder notification...');
    
    const notification = {
        title: '⛪ Sunday Service Reminder',
        body: 'Join us tomorrow at 9am for Sunday service!',
        url: '/events.html'
    };
    
    await sendNotificationToAll(notification);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
});