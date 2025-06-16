const express = require('express');
const router = express.Router();
const pool = require('../db');

// Главная страница
router.get('/', async (req, res) => {
    try {
        const [eras] = await pool.query(`
            SELECT e.*, GROUP_CONCAT(t.name) as tags
            FROM eras e
            LEFT JOIN era_tags et ON e.id = et.era_id
            LEFT JOIN tags t ON et.tag_id = t.id
            GROUP BY e.id
        `);

        // Преобразуем строку тегов в массив
        eras.forEach(era => {
            era.tags = era.tags ? era.tags.split(',') : [];
        });

        res.render('index', {
            title: 'Главная',
            eras: eras
        });
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
        res.status(500).render('error', {
            title: 'Ошибка',
            error: 'Не удалось загрузить данные'
        });
    }
});

// Страница со списком всех эпох
router.get('/eras', async (req, res) => {
    try {
        const [eras] = await pool.query(`
            SELECT e.*, GROUP_CONCAT(t.name) as tags
            FROM eras e
            LEFT JOIN era_tags et ON e.id = et.era_id
            LEFT JOIN tags t ON et.tag_id = t.id
            GROUP BY e.id
        `);

        // Преобразуем строку тегов в массив
        eras.forEach(era => {
            era.tags = era.tags ? era.tags.split(',') : [];
        });

        res.render('eras', {
            title: 'Все эпохи',
            eras: eras
        });
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
        res.status(500).render('error', {
            title: 'Ошибка',
            error: 'Не удалось загрузить данные'
        });
    }
});

// Страница отдельной эпохи
router.get('/eras/:id', async (req, res) => {
    try {
        const [eras] = await pool.query(`
            SELECT e.*, GROUP_CONCAT(t.name) as tags
            FROM eras e
            LEFT JOIN era_tags et ON e.id = et.era_id
            LEFT JOIN tags t ON et.tag_id = t.id
            WHERE e.id = ?
            GROUP BY e.id
        `, [req.params.id]);

        if (eras.length === 0) {
            return res.status(404).render('error', {
                title: 'Ошибка',
                error: 'Эпоха не найдена'
            });
        }

        const era = eras[0];
        era.tags = era.tags ? era.tags.split(',') : [];

        // Получаем комментарии для эпохи
        const [comments] = await pool.query(
            'SELECT * FROM comments WHERE era_id = ? ORDER BY created_at DESC',
            [req.params.id]
        );

        res.render('era', {
            title: era.title,
            era: era,
            comments: comments,
            user: req.session.user
        });
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
        res.status(500).render('error', {
            title: 'Ошибка',
            error: 'Не удалось загрузить данные'
        });
    }
});

// Добавление комментария
router.post('/era/:id/comment', async (req, res) => {
    try {
        const { author, content } = req.body;
        await pool.query(
            'INSERT INTO comments (era_id, author, content) VALUES (?, ?, ?)',
            [req.params.id, author, content]
        );
        res.redirect(`/era/${req.params.id}`);
    } catch (error) {
        console.error('Ошибка при добавлении комментария:', error);
        res.status(500).render('error', { 
            title: 'Ошибка',
            message: 'Произошла ошибка при добавлении комментария' 
        });
    }
});

module.exports = router; 