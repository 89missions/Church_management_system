const webPush = require('web-push');
const pool = require('../config/dbConfig');

// Setup web-push
webPush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

async function sendNotificationToAll(notification) {
    try {
        const result = await pool.query('SELECT subscription FROM push_subscriptions');
        
        console.log(`Sending to ${result.rows.length} subscribers`);
        
        for (const row of result.rows) {
            try {
                await webPush.sendNotification(
                    row.subscription,
                    JSON.stringify(notification)
                );
            } catch (error) {
                if (error.statusCode === 410) {
                    await pool.query('DELETE FROM push_subscriptions WHERE subscription = $1', [row.subscription]);
                    console.log('Removed expired subscription');
                } else {
                    console.error('Push error:', error.message);
                }
            }
        }
    } catch (error) {
        console.error('Error sending notifications:', error);
    }
}

module.exports = { sendNotificationToAll };