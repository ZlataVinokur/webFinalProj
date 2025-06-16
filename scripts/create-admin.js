require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function createAdmin() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        // Проверяем, существует ли таблица admins
        const [tables] = await connection.query('SHOW TABLES LIKE "admins"');
        
        if (tables.length === 0) {
            // Создаем таблицу admins, если она не существует
            await connection.query(`
                CREATE TABLE admins (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    username VARCHAR(50) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('Таблица admins создана');
        }

        // Проверяем, существует ли администратор
        const [admins] = await connection.query('SELECT * FROM admins WHERE username = ?', ['admin']);
        
        if (admins.length === 0) {
            // Создаем администратора
            const password = 'admin123'; // Пароль по умолчанию
            const hashedPassword = await bcrypt.hash(password, 10);
            
            await connection.query(
                'INSERT INTO admins (username, password) VALUES (?, ?)',
                ['admin', hashedPassword]
            );
            
            console.log('Администратор создан');
            console.log('Логин: admin');
            console.log('Пароль: admin123');
        } else {
            console.log('Администратор уже существует');
        }
    } catch (error) {
        console.error('Ошибка:', error);
    } finally {
        await connection.end();
    }
}

createAdmin(); 