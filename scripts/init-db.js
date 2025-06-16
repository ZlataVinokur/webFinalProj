require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function initDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'game_design_evolution'
    });

    try {
        // Удаляем существующие таблицы
        await connection.execute('DROP TABLE IF EXISTS era_tags');
        await connection.execute('DROP TABLE IF EXISTS comments');
        await connection.execute('DROP TABLE IF EXISTS feedback');
        await connection.execute('DROP TABLE IF EXISTS eras');
        await connection.execute('DROP TABLE IF EXISTS tags');
        await connection.execute('DROP TABLE IF EXISTS users');

        // Создание таблицы users
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Создание администратора
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await connection.execute(
            'INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)',
            ['admin', hashedPassword, true]
        );

        // Создание таблицы eras
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS eras (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                start_year INT NOT NULL,
                end_year INT NOT NULL,
                image_url VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Создание таблицы tags
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS tags (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE
            )
        `);

        // Создание таблицы era_tags
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS era_tags (
                era_id INT,
                tag_id INT,
                PRIMARY KEY (era_id, tag_id),
                FOREIGN KEY (era_id) REFERENCES eras(id) ON DELETE CASCADE,
                FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
            )
        `);

        // Создание таблицы comments
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                era_id INT,
                author VARCHAR(100) NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (era_id) REFERENCES eras(id) ON DELETE CASCADE
            )
        `);

        // Создание таблицы feedback
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS feedback (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Добавляем теги
        const tags = [
            'Аркады',
            'Консоли',
            '3D',
            'Онлайн',
            'Мобильные'
        ];

        for (const tag of tags) {
            await connection.execute('INSERT INTO tags (name) VALUES (?)', [tag]);
        }

        // Получаем ID тегов
        const [tagRows] = await connection.execute('SELECT id, name FROM tags');
        const tagMap = {};
        tagRows.forEach(tag => {
            tagMap[tag.name] = tag.id;
        });

        // Добавляем эпохи
        const eras = [
            {
                title: 'Arcade',
                description: 'Эпоха аркадных игр, характеризующаяся простым геймплеем и пиксельной графикой. Игры были доступны в специальных автоматах и ранних домашних консолях.',
                start_year: 1970,
                end_year: 1985,
                image_url: '/images/arcade.jpg',
                tags: ['Аркады']
            },
            {
                title: 'Console',
                description: 'Период расцвета консольных игр с улучшенной графикой и более сложным геймплеем. Появление 3D-графики и мультиплеера.',
                start_year: 1985,
                end_year: 2000,
                image_url: '/images/console.jpg',
                tags: ['Консоли', '3D']
            },
            {
                title: 'Modern',
                description: 'Современная эпоха игр с фотореалистичной графикой, онлайн-мультиплеером и мобильными играми. Развитие VR и AR технологий.',
                start_year: 2000,
                end_year: 2024,
                image_url: '/images/modern.jpg',
                tags: ['3D', 'Онлайн', 'Мобильные']
            }
        ];

        for (const era of eras) {
            const [result] = await connection.execute(
                'INSERT INTO eras (title, description, start_year, end_year, image_url) VALUES (?, ?, ?, ?, ?)',
                [era.title, era.description, era.start_year, era.end_year, era.image_url]
            );

            // Добавляем связи с тегами
            for (const tagName of era.tags) {
                await connection.execute(
                    'INSERT INTO era_tags (era_id, tag_id) VALUES (?, ?)',
                    [result.insertId, tagMap[tagName]]
                );
            }
        }

        console.log('База данных успешно инициализирована');
    } catch (error) {
        console.error('Ошибка при инициализации базы данных:', error);
    } finally {
        await connection.end();
    }
}

initDatabase(); 