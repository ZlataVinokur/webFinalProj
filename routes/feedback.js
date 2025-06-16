const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Страница обратной связи
router.get('/', (req, res) => {
    res.render('feedback', {
        title: 'Обратная связь',
        error: null,
        success: null
    });
});

// Обработка формы обратной связи
router.post('/', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        
        if (!name || !email || !message) {
            return res.render('feedback', {
                title: 'Обратная связь',
                error: 'Все поля обязательны для заполнения',
                success: null
            });
        }

        await pool.query(
            'INSERT INTO feedback (name, email, message) VALUES (?, ?, ?)',
            [name, email, message]
        );

        res.render('feedback', {
            title: 'Обратная связь',
            error: null,
            success: 'Спасибо за ваше сообщение! Мы свяжемся с вами в ближайшее время.'
        });
    } catch (error) {
        console.error('Ошибка при сохранении обратной связи:', error);
        res.render('feedback', {
            title: 'Обратная связь',
            error: 'Произошла ошибка при отправке сообщения. Пожалуйста, попробуйте позже.',
            success: null
        });
    }
});

// Добавление комментария к эпохе
router.post('/comment/:eraId', async (req, res) => {
    try {
        const { nickname, email, content } = req.body;
        
        if (!nickname || !email || !content) {
            return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
        }

        await pool.query(
            'INSERT INTO comments (era_id, nickname, email, content) VALUES (?, ?, ?, ?)',
            [req.params.eraId, nickname, email, content]
        );

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Удаление комментария (только для админа)
router.delete('/comment/:id', async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.is_admin) {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }

        await pool.query('DELETE FROM comments WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router; 