require('dotenv').config()
const pool = require('../config/dbConfig')
const bcrypt = require('bcryptjs')

//getmembers
const getMembers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const offset = (page - 1) * limit;

        const countResult = await pool.query('SELECT COUNT(*) FROM members');
        const totalMembers = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalMembers / limit);

        const result = await pool.query(
            'SELECT id, first_name, last_name, email, phone, address FROM members ORDER BY first_name ASC LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        res.status(200).json({
            members: result.rows,
            pagination: {
                currentPage: page,
                totalPages,
                totalMembers,
                limit
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

//get members with id
const getMembersWithId= async (req,res)=>{
    try {
        const {id} = req.params
        //validate the id from the req.body..
        if (!id){
            return res.status(400).json({"message":"Missing or invalid Id..."})
        }
        //quering the db..
        const getmemberwithid = await pool.query('SELECT id, first_name, last_name, email, phone, date_of_birth, gender,  address, marital_status, occupation, emergency_contact_name, emergency_contact_phone,joined_date  FROM members where id = $1',[id])

        //if member doesnt exist
        if (getmemberwithid.rows.length === 0) {
            return res.status(404).json({ message: "Member not found" });
        }
        res.status(200).json(getmemberwithid.rows[0])
        
    } catch (error) {
        console.error(error)
        res.status(500).json({"message":"Internal Server Error"})
    }
}

//add a member
const postMembers = async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            phone,
            date_of_birth,
            gender,
            address,
            marital_status,
            occupation,
            emergency_contact_name,
            emergency_contact_phone,
            positions
        } = req.body;

        const defaultpassword = process.env.DEFAULT_PASSWORD
        // Validation to ensure backend receives all valuable inputs
        if (!first_name || !last_name || !phone) {
            return res.status(400).json({ 
                message: "First name, last name, and phone are required" 
            });
        }

        //hashing the default password
        const hashed_password = await bcrypt.hash(defaultpassword,10)

        // Querying the database
        const addMember = await pool.query(
            `INSERT INTO members (
                first_name, last_name, email, phone, date_of_birth, gender, address,
                marital_status, occupation, emergency_contact_name, emergency_contact_phone, password_hash, positions
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
                first_name, last_name, email, phone, date_of_birth, gender, address,
                marital_status, occupation, emergency_contact_name, emergency_contact_phone,hashed_password, positions
            ]
        );

        return res.status(201).json({ message: "Successfully added member." });
    } catch (error) {
            if (error.code === '23505') {
                return res.status(409).json({ message: "Email or phone already exists" });
            }
            console.error(error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
};

//update members
const updateMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            first_name,
            last_name,
            email,
            phone,
            date_of_birth,
            gender,
            address,
            marital_status,
            occupation,
            emergency_contact_name,
            emergency_contact_phone,
            status,
            positions
        } = req.body;

        // Validate ID exists
        if (!id) {
            return res.status(400).json({ message: "Member ID is required" });
        }

        // Check if member exists
        const checkMember = await pool.query(
            'SELECT id FROM members WHERE id = $1',
            [id]
        );

        if (checkMember.rows.length === 0) {
            return res.status(404).json({ message: "Member not found" });
        }

        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (first_name !== undefined) {
            updateFields.push(`first_name = $${paramIndex++}`);
            updateValues.push(first_name);
        }
        if (last_name !== undefined) {
            updateFields.push(`last_name = $${paramIndex++}`);
            updateValues.push(last_name);
        }
        if (email !== undefined) {
            updateFields.push(`email = $${paramIndex++}`);
            updateValues.push(email);
        }
        if (phone !== undefined) {
            updateFields.push(`phone = $${paramIndex++}`);
            updateValues.push(phone);
        }
        if (date_of_birth !== undefined) {
            updateFields.push(`date_of_birth = $${paramIndex++}`);
            updateValues.push(date_of_birth);
        }
        if (gender !== undefined) {
            updateFields.push(`gender = $${paramIndex++}`);
            updateValues.push(gender);
        }
        if (address !== undefined) {
            updateFields.push(`address = $${paramIndex++}`);
            updateValues.push(address);
        }
        if (marital_status !== undefined) {
            updateFields.push(`marital_status = $${paramIndex++}`);
            updateValues.push(marital_status);
        }
        if (occupation !== undefined) {
            updateFields.push(`occupation = $${paramIndex++}`);
            updateValues.push(occupation);
        }
        if (emergency_contact_name !== undefined) {
            updateFields.push(`emergency_contact_name = $${paramIndex++}`);
            updateValues.push(emergency_contact_name);
        }
        if (emergency_contact_phone !== undefined) {
            updateFields.push(`emergency_contact_phone = $${paramIndex++}`);
            updateValues.push(emergency_contact_phone);
        }
        if (status !== undefined) {
            updateFields.push(`status = $${paramIndex++}`);
            updateValues.push(status);
        }
        if (positions !== undefined) {
            updateFields.push(`positions = $${paramIndex++}`);
            updateValues.push(positions);
        }

        // Add updated_at timestamp
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

        // If no fields to update
        if (updateFields.length === 1) { // only updated_at
            return res.status(400).json({ message: "No fields provided to update" });
        }

        // Add ID as last parameter
        updateValues.push(id);

        const query = `
            UPDATE members 
            SET ${updateFields.join(', ')} 
            WHERE id = $${paramIndex}
            RETURNING id, first_name, last_name, email, phone, status, positions, updated_at
        `;

        const result = await pool.query(query, updateValues);

        res.status(200).json({
            success: true,
            message: "Member updated successfully",
            member: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating member:", error);
        
        // Handle duplicate email error
        if (error.code === '23505') {
            return res.status(409).json({ message: "Email already exists" });
        }
        
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const deleteMembers = async (req, res) => {
    try {
        const { id } = req.params;  
        console.log(req.params)
        
        if (!id) {
            return res.status(400).json({ message: "Member ID is required" });
        }
        
        const result = await pool.query(
            'DELETE FROM members WHERE id = $1 RETURNING id',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Member not found" });
        }
        
        return res.status(200).json({ message: "Successfully deleted member" });
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });  // Fixed for consistency
    }
};

// Search members by name or phone
const searchMembers = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.length < 2) {
            return res.status(400).json({ message: "Search term must be at least 2 characters" });
        }
        
        const query = `
            SELECT id, first_name, last_name, email, phone 
            FROM members 
            WHERE status = 'Active' 
            AND (first_name ILIKE $1 OR last_name ILIKE $1 OR phone ILIKE $1)
            ORDER BY first_name ASC
            LIMIT 20
        `;
        
        const result = await pool.query(query, [`%${q}%`]);
        
        return res.status(200).json(result.rows);
        
    } catch (error) {
        console.error('Error searching members:', error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Get total members count
const getMembersCount = async (req, res) => {
    try {
        const query = `SELECT COUNT(*) as count FROM members WHERE status = 'Active'`;
        const result = await pool.query(query);
        
        return res.status(200).json({ count: parseInt(result.rows[0].count) });
        
    } catch (error) {
        console.error('Error getting members count:', error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports={
    getMembers,
    getMembersWithId,
    postMembers,
    updateMembers,
    deleteMembers,
    searchMembers,
    getMembersCount
}