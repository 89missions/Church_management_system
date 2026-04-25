const pool = require('../config/dbConfig');

const addSummary = async (req, res) => {
    try {
        const { 
            sermon_text, 
            sermon_title, 
            teaching_text, 
            offering_total, 
            highlights, 
            summary_date 
        } = req.body;

        // Validation - summary_date is required
        if (!summary_date) {
            return res.status(400).json({ message: "Summary date is required" });
        }

        // Calculate attendance from attendance table
        const attendanceQuery = `
            SELECT COUNT(*) as count 
            FROM attendance 
            WHERE service_date = $1 AND attended = true
        `;
        const attendanceResult = await pool.query(attendanceQuery, [summary_date]);
        const attendanceCount = parseInt(attendanceResult.rows[0].count) || 0;
        const recordedBy = req.user?.id;
        if (!recordedBy) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        // Insert into sunday_summaries 
        const insertQuery = `
            INSERT INTO sunday_summaries 
            (summary_date, sermon_text, sermon_title, teaching_text, offering_total, attendance_count, highlights, recorded_by) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (summary_date) DO UPDATE SET
                sermon_text = EXCLUDED.sermon_text,
                sermon_title = EXCLUDED.sermon_title,
                teaching_text = EXCLUDED.teaching_text,
                offering_total = EXCLUDED.offering_total,
                attendance_count = EXCLUDED.attendance_count,
                highlights = EXCLUDED.highlights,
                updated_at = CURRENT_TIMESTAMP
        `;

        const insertValues = [
            summary_date,
            sermon_text || null,
            sermon_title || null,
            teaching_text || null,
            parseFloat(offering_total) || 0,
            attendanceCount,
            highlights || null,
            recordedBy
        ];

        await pool.query(insertQuery, insertValues);

        return res.status(201).json({ message: "Sunday summary saved successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const getLatestSundaySummary = async (req, res) => {
    try {
        // Query the latest Sunday summary
        const query = `
            SELECT * FROM sunday_summaries 
            ORDER BY summary_date DESC 
            LIMIT 1
        `;
        
        const result = await pool.query(query);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                message: "No Sunday summary found" 
            });
        }
        
        return res.status(200).json(result.rows[0]);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {addSummary,getLatestSundaySummary};