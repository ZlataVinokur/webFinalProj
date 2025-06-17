const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

// Настройка multer для загрузки изображений
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Только изображения!'), false);
        }
        cb(null, true);
    }
});

// Middleware для проверки прав администратора
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.is_admin) {
        next();
    } else {
        res.status(403).send('Доступ запрещен');
    }
};

// Страница входа
router.get('/login', (req, res) => {
    res.render('admin/login', { 
        title: 'Вход в админ-панель',
        error: null
    });
});

// Обработка входа
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        
        if (users.length === 0) {
            return res.render('admin/login', { 
                title: 'Вход в админ-панель',
                error: 'Неверное имя пользователя или пароль' 
            });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.render('admin/login', { 
                title: 'Вход в админ-панель',
                error: 'Неверное имя пользователя или пароль' 
            });
        }

        req.session.user = {
            id: user.id,
            username: user.username,
            is_admin: user.is_admin
        };

        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error(error);
        res.render('admin/login', { 
            title: 'Вход в админ-панель',
            error: 'Произошла ошибка при входе' 
        });
    }
});

// Страница админ-панели
router.get('/dashboard', isAdmin, async (req, res) => {
    try {
        // Получаем все эпохи
        const [eras] = await pool.query('SELECT id, title, previous_title, description, image_url, start_year, end_year, created_at FROM eras ORDER BY created_at DESC');
        
        // Получаем все сообщения обратной связи
        const [feedback] = await pool.query('SELECT * FROM feedback ORDER BY created_at DESC');
        
        res.render('admin/dashboard', {
            title: 'Панель управления',
            eras: eras,
            feedback: feedback
        });
    } catch (error) {
        console.error('Ошибка при загрузке админ-панели:', error);
        res.status(500).send('Ошибка сервера');
    }
});

// Добавление новой эпохи
router.post('/eras', isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { title, description, start_year, end_year, tags } = req.body;
        
        // Проверяем наличие обязательных полей
        if (!title || !description || !start_year || !end_year) {
            return res.status(400).json({ 
                error: 'Все поля обязательны для заполнения' 
            });
        }

        // Определяем путь к изображению
        const imageUrl = req.file ? `/images/${req.file.filename}` : '/images/default.jpg';

        // Добавляем эпоху
        const [result] = await pool.query(
            'INSERT INTO eras (title, description, start_year, end_year, image_url) VALUES (?, ?, ?, ?, ?)',
            [title, description, start_year, end_year, imageUrl]
        );

        // Добавляем теги
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            for (const tagName of tagArray) {
                // Добавляем тег, если его нет
                await pool.query(
                    'INSERT IGNORE INTO tags (name) VALUES (?)',
                    [tagName]
                );
                
                // Получаем ID тега
                const [tag] = await pool.query('SELECT id FROM tags WHERE name = ?', [tagName]);
                
                // Связываем тег с эпохой
                await pool.query(
                    'INSERT INTO era_tags (era_id, tag_id) VALUES (?, ?)',
                    [result.insertId, tag[0].id]
                );
            }
        }

        res.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('Ошибка при добавлении эпохи:', error);
        res.status(500).json({ 
            error: 'Ошибка при добавлении эпохи' 
        });
    }
});

// Редактирование эпохи
router.put('/eras/:id', isAdmin, async (req, res) => {
    try {
        const { title, description, start_year, end_year, tags } = req.body;
        
        // Проверяем наличие обязательных полей
        if (!title || !description || !start_year || !end_year) {
            return res.status(400).json({ 
                error: 'Все поля обязательны для заполнения' 
            });
        }

        // Получаем текущее название эпохи
        const [currentEra] = await pool.query('SELECT title FROM eras WHERE id = ?', [req.params.id]);
        const currentTitle = currentEra[0].title;

        // Обновляем основную информацию об эпохе
        await pool.query(
            'UPDATE eras SET title = ?, previous_title = CASE WHEN ? != ? THEN ? ELSE previous_title END, description = ?, start_year = ?, end_year = ? WHERE id = ?',
            [title, currentTitle, title, currentTitle, description, start_year, end_year, req.params.id]
        );

        // Обновляем теги
        await pool.query('DELETE FROM era_tags WHERE era_id = ?', [req.params.id]);
        
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            for (const tagName of tagArray) {
                // Добавляем тег, если его нет
                await pool.query(
                    'INSERT IGNORE INTO tags (name) VALUES (?)',
                    [tagName]
                );
                
                // Получаем ID тега
                const [tag] = await pool.query('SELECT id FROM tags WHERE name = ?', [tagName]);
                
                // Связываем тег с эпохой
                await pool.query(
                    'INSERT INTO era_tags (era_id, tag_id) VALUES (?, ?)',
                    [req.params.id, tag[0].id]
                );
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка при обновлении эпохи:', error);
        res.status(500).json({ 
            error: 'Ошибка при обновлении эпохи' 
        });
    }
});

// Удаление эпохи
router.delete('/eras/:id', isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM eras WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Удаление сообщения обратной связи
router.delete('/feedback/:id', isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM feedback WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка при удалении сообщения:', error);
        res.status(500).json({ error: 'Ошибка при удалении сообщения' });
    }
});

// Удаление комментария
router.delete('/comments/:id', isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM comments WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка при удалении комментария:', error);
        res.status(500).json({ error: 'Ошибка при удалении комментария' });
    }
});

// Выход из админ-панели
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Ошибка при выходе:', err);
            return res.status(500).send('Ошибка при выходе');
        }
        res.redirect('/');
    });
});

module.exports = router; 