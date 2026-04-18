const pool = require('../config/dbConfig');
const { sendNotificationToAll } = require('../utils/notification');

const addEvents = async (req, res) => {
    try {
        const { 
            title, 
            description, 
            event_date, 
            start_time, 
            end_time, 
            location, 
            status, 
            created_by 
        } = req.body;

        // Only title and event_date are required
        if (!title || !event_date) {
            return res.status(400).json({ message: "Title and event date are required" });
        }

        const query = `INSERT INTO events 
            (title, description, event_date, start_time, end_time, location, status, created_by) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING *`;

        const values = [
            title, 
            description || null, 
            event_date, 
            start_time || null, 
            end_time || null, 
            location || null, 
            status || 'Scheduled', 
            created_by || null
        ];

        const result = await pool.query(query, values);

        // Send notification to all users about new event
    await sendNotificationToAll({
    title: '📅 New Event Created',
    body: `${title} on ${event_date}`,
    url: '/events.html'
});
        return res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const getEvents = async (req, res) => {
    try {
        const query = await pool.query(`SELECT * FROM events ORDER BY event_date DESC`);
        return res.status(200).json(query.rows);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const getEventsById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "Event ID is required" });
        }

        const result = await pool.query(`SELECT * FROM events WHERE id = $1`, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Event not found" });
        }

        return res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const editEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            title, 
            description, 
            event_date, 
            start_time, 
            end_time, 
            location, 
            status 
        } = req.body;

        if (!id) {
            return res.status(400).json({ message: "Event ID is required" });
        }

        // Check if event exists
        const checkEvent = await pool.query(`SELECT id FROM events WHERE id = $1`, [id]);
        if (checkEvent.rows.length === 0) {
            return res.status(404).json({ message: "Event not found" });
        }

        // Build dynamic update query
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (title !== undefined) {
            updateFields.push(`title = $${paramIndex++}`);
            updateValues.push(title);
        }
        if (description !== undefined) {
            updateFields.push(`description = $${paramIndex++}`);
            updateValues.push(description);
        }
        if (event_date !== undefined) {
            updateFields.push(`event_date = $${paramIndex++}`);
            updateValues.push(event_date);
        }
        if (start_time !== undefined) {
            updateFields.push(`start_time = $${paramIndex++}`);
            updateValues.push(start_time);
        }
        if (end_time !== undefined) {
            updateFields.push(`end_time = $${paramIndex++}`);
            updateValues.push(end_time);
        }
        if (location !== undefined) {
            updateFields.push(`location = $${paramIndex++}`);
            updateValues.push(location);
        }
        if (status !== undefined) {
            updateFields.push(`status = $${paramIndex++}`);
            updateValues.push(status);
        }

        // Add updated_at timestamp
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

        if (updateFields.length === 1) {
            return res.status(400).json({ message: "No fields provided to update" });
        }

        updateValues.push(id);

        const query = `
            UPDATE events 
            SET ${updateFields.join(', ')} 
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const result = await pool.query(query, updateValues);
        return res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

//delete event
const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if event exists
        const checkEvent = await pool.query(`SELECT id FROM events WHERE id = $1`, [id]);
        
        if (checkEvent.rows.length === 0) {
            return res.status(404).json({ message: "Event not found" });
        }

        // Database query
        await pool.query(`DELETE FROM events WHERE id = $1`, [id]);
        
        return res.status(200).json({ message: "Successfully deleted event" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    addEvents,
    getEvents,
    getEventsById,
    editEvent,
    deleteEvent
};