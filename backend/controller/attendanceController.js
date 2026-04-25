const pool = require('../config/dbConfig');

// Mark single member as present for today
const markAttendance = async (req, res) => {
    try {
        const { member_id, service_date } = req.body;
        
        if (!member_id) {
            return res.status(400).json({ message: "Member ID is required" });
        }
        
        const today = service_date || new Date().toISOString().split('T')[0];
        
        // Check if member exists
        const memberCheck = await pool.query('SELECT id FROM members WHERE id = $1', [member_id]);
        if (memberCheck.rows.length === 0) {
            return res.status(404).json({ message: "Member not found" });
        }
        
        // Insert or update attendance
        const query = `
            INSERT INTO attendance (member_id, service_date, attended)
            VALUES ($1, $2, true)
            ON CONFLICT (member_id, service_date) 
            DO UPDATE SET attended = true, updated_at = CURRENT_TIMESTAMP
            RETURNING id
        `;
        
        await pool.query(query, [member_id, today]);
        
        return res.status(200).json({ 
            success: true, 
            message: "Attendance marked successfully" 
        });
        
    } catch (error) {
        console.error('Error marking attendance:', error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Get today's attendance with pagination
const getTodayAttendance = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        
        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM attendance a
            WHERE a.service_date = $1 AND a.attended = true
        `;
        const countResult = await pool.query(countQuery, [today]);
        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / limit);
        
        // Get paginated records
        const query = `
            SELECT 
                a.member_id, 
                m.first_name, 
                m.last_name, 
                m.phone, 
                a.created_at as marked_at
            FROM attendance a
            JOIN members m ON a.member_id = m.id
            WHERE a.service_date = $1 AND a.attended = true
            ORDER BY a.created_at DESC
            LIMIT $2 OFFSET $3
        `;
        
        const result = await pool.query(query, [today, limit, offset]);
        
        return res.status(200).json({
            records: result.rows,
            total: total,
            page: page,
            totalPages: totalPages,
            limit: limit
        });
        
    } catch (error) {
        console.error('Error getting today\'s attendance:', error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    getTodayAttendance,
    markAttendance 
};