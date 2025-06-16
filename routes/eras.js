const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Получение всех эпох
router.get('/', async (req, res) => {
    try {
        // Получаем все эпохи
        const [eras] = await pool.query(`
            SELECT e.*, GROUP_CONCAT(t.name) as tags
            FROM eras e
            LEFT JOIN era_tags et ON e.id = et.era_id
            LEFT JOIN tags t ON et.tag_id = t.id
            GROUP BY e.id
            ORDER BY e.created_at DESC
        `);

        // Преобразуем строку тегов в массив
        const erasWithTags = eras.map(era => ({
            ...era,
            tags: era.tags ? era.tags.split(',') : []
        }));

        res.render('eras', {
            title: 'Все эпохи',
            eras: erasWithTags
        });
    } catch (error) {
        console.error('Ошибка при получении эпох:', error);
        res.status(500).send('Ошибка сервера');
    }
});

// Получение одной эпохи
router.get('/:id', async (req, res) => {
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
            return res.status(404).send('Эпоха не найдена');
        }

        const era = {
            ...eras[0],
            tags: eras[0].tags ? eras[0].tags.split(',') : []
        };

        // Получаем комментарии
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
        console.error('Ошибка при получении эпохи:', error);
        res.status(500).send('Ошибка сервера');
    }
});

module.exports = router; 