const pool = require('../config/dbConfig')

function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Get last Sunday (LOCAL SAFE)
function getLastSundayLocal() {
    const today = new Date();
    const day = today.getDay(); // 0 = Sunday

    const lastSunday = new Date(today);
    lastSunday.setDate(today.getDate() - day);
    lastSunday.setHours(0, 0, 0, 0);

    return formatLocalDate(lastSunday);
}

const getSundaySummary = async (req, res) => {
    try {
        const lastSunday = getLastSundayLocal();

        const query = `
            SELECT * FROM sunday_summaries 
            WHERE summary_date = $1
            LIMIT 1
        `;

        const result = await pool.query(query, [lastSunday]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "No Sunday summary for this week"
            });
        }

        return res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error("Error fetching Sunday summary:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


const saveSundaySummary = async (req, res) => {
    try {
        const lastSunday = getLastSundayLocal();

        const {
            sermon_text,
            sermon_title,
            teaching_text,
            offering_total,
            highlights
        } = req.body;

        const query = `
            INSERT INTO sunday_summaries 
            (summary_date, sermon_text, sermon_title, teaching_text, offering_total, highlights)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (summary_date)
            DO UPDATE SET
                sermon_text = EXCLUDED.sermon_text,
                sermon_title = EXCLUDED.sermon_title,
                teaching_text = EXCLUDED.teaching_text,
                offering_total = EXCLUDED.offering_total,
                highlights = EXCLUDED.highlights
            RETURNING *;
        `;

        const result = await pool.query(query, [
            lastSunday,
            sermon_text,
            sermon_title,
            teaching_text,
            offering_total,
            highlights
        ]);

        return res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error("Error saving Sunday summary:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    getSundaySummary,
    saveSundaySummary,
};