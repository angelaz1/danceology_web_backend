const express = require('express');
const bodyParser = require('body-parser')

const http = require('http');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');

const app = express();

app.use(cors());

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const path = 'public/files';
        fs.mkdirSync(path, { recursive: true });
        cb(null, path);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: fileStorage
});

app.use(upload.single('file'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Connect to database
const models = require("./models/index.js");

models.sequelize.authenticate().then(() => {
    console.log("Connected to the database!");
}).catch(err => {
    console.log("An error occurred while connecting to the database: ", err);
    process.exit();
});

// Setting Routes
const home = require('./routes/home');
const levels = require('./routes/levels');

app.use('/', home);
app.use('/levels', levels);

const server = http.createServer(app);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});

module.exports = app;
