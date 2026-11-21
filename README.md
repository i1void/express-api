# Express API

Simple REST API base built with Express.js. Routes are plugin-style, docs are generated automatically.

### Features

- Plugin routing (drop a file in `src/api`, it's loaded)
- Swagger-style docs page, no build step
- Try-it-out from the docs
- OpenAPI 3 spec at `/openapi.json`
- Vercel ready

### Installation

```bash
npm install
cp .env.example .env
npm start
```

Docs: `http://localhost:4000`

### Route

Create a file in `src/api/<category>/`:

```js
module.exports = (app) => {
    app.get('/tools/hello', (req, res) => {
        const { name } = req.query;
        if (!name) return res.status(400).json({ status: false, error: 'name is required' });
        res.json({ status: true, result: `Hello, ${name}!` });
    });
};
```

Then add it to `src/openapi.json` so it shows up in the docs:

```json
"/tools/hello": {
  "get": {
    "tags": ["Tools"],
    "summary": "Say hello",
    "parameters": [
      { "name": "name", "in": "query", "required": true, "schema": { "type": "string" } }
    ],
    "responses": { "200": { "description": "Success" } }
  }
}
```

### Environment

| Key | Description |
| --- | --- |
| `PORT` | Server port (default `4000`) |
| `OPENAI_API_KEY` | Needed by `/ai/chatgpt` |

### Example endpoint

`GET /ai/chatgpt?text=hello` (official OpenAI API). Model is set in `src/api/ai/chatgpt.js`.
