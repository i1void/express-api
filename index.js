require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const settings = require('./src/settings.json');
const app = express();
const PORT = process.env.PORT || 4000;

app.enable('trust proxy');
app.set('json spaces', 2);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add `creator` to every JSON response.
app.use((req, res, next) => {
    const json = res.json.bind(res);
    res.json = (data) =>
        json(data && typeof data === 'object' && !Array.isArray(data)
            ? { status: data.status, creator: settings.creator, ...data }
            : data);
    next();
});

// Docs (Swagger-style UI) + OpenAPI spec
app.use(express.static(path.join(__dirname, 'public')));
app.get('/openapi.json', (req, res) => res.sendFile(path.join(__dirname, 'src', 'openapi.json')));
app.get('/docs', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Auto-load every route file: src/api/<category>/<name>.js
const apiDir = path.join(__dirname, 'src', 'api');
let total = 0;
for (const category of fs.readdirSync(apiDir)) {
    const dir = path.join(apiDir, category);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
        require(path.join(dir, file))(app);
        total++;
        console.log(`Loaded route: ${category}/${file}`);
    }
}
console.log(`Total route files: ${total}`);

// 404 & 500
app.use((req, res) => res.status(404).json({ status: false, error: 'Not found' }));
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ status: false, error: 'Internal server error' });
});

if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
