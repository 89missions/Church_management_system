const pool = require('../config/dbConfig')

const addOffering = async (req, res) => {
    try {
        let { 
            member_id,
            offering_type, 
            amount, 
            payment_method, 
            referenceNumber, 
            offering_date, 
            notes 
        } = req.body;

        // Validate required fields
        if (!amount) {
            return res.status(400).json({ message: "Amount is required" });
        }

        if (!offering_type) {
            return res.status(400).json({ message: "Offering type is required" });
        }

        if (!payment_method) {
            return res.status(400).json({ message: "Payment method is required" });
        }

        // Get member name from ID
        let member_name = 'church';
        if (member_id) {
            const memberResult = await pool.query(
                'SELECT first_name, last_name FROM members WHERE id = $1',
                [member_id]
            );
            if (memberResult.rows.length > 0) {
                member_name = `${memberResult.rows[0].first_name} ${memberResult.rows[0].last_name}`;
            }
        }

        const text = `INSERT INTO offertory
            (member_name, offering_type, amount, payment_method, reference_number, offering_date, notes) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)`;

        const values = [
            member_name,
            offering_type,
            amount,
            payment_method,
            referenceNumber || null,
            offering_date || new Date().toISOString().split('T')[0],
            notes || null
        ];

        await pool.query(text, values);

        res.status(201).json({ message: "Successfully recorded offering" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getOfferings = async (req,res)=>{
    try {
        //get recent 5 offerings..
        //query the database
        const query = await pool.query(`SELECT offering_date::date, member_name, 
offering_type, amount, 
payment_method FROM offertory ORDER BY offering_date DESC LIMIT 15;`)

            const offeringlist = query.rows
            res.status(200).json(offeringlist)
    } catch (error) {
        console.error(error)
        res.status(500).json({message:'internal server'})
    }
}

    const monthlyOfferings = async (req, res) => {
        try {
            //get today, this month and this years date..
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;
    
            const query = `
                SELECT COALESCE(SUM(amount), 0) as total
                FROM offertory 
                WHERE EXTRACT(YEAR FROM offering_date) = $1 
                AND EXTRACT(MONTH FROM offering_date) = $2
            `;
    
            const result = await pool.query(query, [currentYear, currentMonth]);
    
            res.status(200).json({ 
                total: parseFloat(result.rows[0].total),
                month: now.toLocaleString('default', { month: 'long' }),
                year: currentYear
            });
    
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    };

    const todayOfferings = async (req, res) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            const query = `
                SELECT COALESCE(SUM(amount), 0) as total
                FROM offertory 
                WHERE offering_date = $1
            `;
            
            const result = await pool.query(query, [today]);
            
            res.status(200).json({ 
                total: parseFloat(result.rows[0].total),
                date: today
            });
            
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    };

    const getOfferingsByDateRange = async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            
            const query = `
                SELECT offering_date::date, member_name, offering_type, amount, payment_method 
                FROM offertory 
                WHERE offering_date BETWEEN $1 AND $2
                ORDER BY offering_date DESC
            `;
            
            const result = await pool.query(query, [startDate, endDate]);
            res.status(200).json(result.rows);
            
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    };
    
    module.exports = {
        addOffering,
        monthlyOfferings,
        getOfferings,
        todayOfferings,
        getOfferingsByDateRange
    };