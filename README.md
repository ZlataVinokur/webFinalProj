# Эволюция игрового дизайна

Интерактивный учебник, демонстрирующий эволюцию игрового дизайна через три ключевые эпохи.

## Требования

- Node.js (версия 14 или выше)
- MySQL (версия 5.7 или выше)
- npm или yarn

## Установка

1. Клонируйте репозиторий:
```bash
git clone <url-репозитория>
cd game-design-evolution
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл .env в корневой директории проекта:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=game_design_evolution
PORT=3000
```

4. Создайте базу данных и таблицы:
```bash
mysql -u root -p < database.sql
```

5. Создайте администратора:
```bash
node scripts/create-admin.js
```

## Запуск

Для запуска в режиме разработки:
```bash
npm run dev
```

Для запуска в продакшн режиме:
```bash
npm start
```

Приложение будет доступно по адресу: http://localhost:3000

## Функциональность

- Просмотр эпох игрового дизайна
- Фильтрация и поиск по эпохам
- Комментарии к эпохам
- Форма обратной связи
- Административная панель для управления контентом

## Структура проекта

```
game-design-evolution/
├── config/
│   └── database.js
├── public/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
├── routes/
│   ├── admin.js
│   ├── feedback.js
│   └── main.js
├── views/
│   ├── admin/
│   │   ├── dashboard.ejs
│   │   └── login.ejs
│   ├── partials/
│   │   ├── footer.ejs
│   │   └── header.ejs
│   ├── 404.ejs
│   ├── era.ejs
│   ├── eras.ejs
│   ├── feedback.ejs
│   └── index.ejs
├── .env
├── app.js
├── database.sql
├── package.json
└── README.md
```

## Технологии

- Node.js
- Express
- MySQL
- EJS
- JavaScript (ES6+)
- CSS3
- HTML5 