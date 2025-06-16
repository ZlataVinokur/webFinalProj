const express = require('express');
const path = require('path');
const session = require('express-session');
const mysql = require('mysql2');
const expressLayouts = require('express-ejs-layouts');
const multer = require('multer');
require('dotenv').config();

const app = express();

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

// Настройка подключения к базе данных
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'game_design_evolution',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Middleware для передачи глобальных переменных в шаблоны
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.title = 'Эволюция игрового дизайна';
    res.locals.error = null;
    next();
});

// Настройка шаблонизатора
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Маршруты
const mainRoutes = require('./routes/main');
const adminRoutes = require('./routes/admin');
const feedbackRoutes = require('./routes/feedback');

app.use('/', mainRoutes);
app.use('/admin', adminRoutes);
app.use('/feedback', feedbackRoutes);

// Обработка 404
app.use((req, res) => {
    res.status(404).render('404', { title: '404 - Страница не найдена' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('\x1b[32m%s\x1b[0m', 'Сервер запущен!');
    console.log('\x1b[36m%s\x1b[0m', `Локальный URL: http://localhost:${PORT}`);
    console.log('\x1b[33m%s\x1b[0m', 'Для остановки сервера нажмите Ctrl+C');
}); 