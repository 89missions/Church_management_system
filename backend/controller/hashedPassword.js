const bcrypt = require('bcryptjs');

async function hashPassword() {
    const password = '1234';
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Password:', password);
    console.log('Hash:', hash);
}

hashPassword();