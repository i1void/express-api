const axios = require('axios');

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini'; // change the model here
const MAX_TEXT_LENGTH = 4000;

async function chat({ text, systemPrompt, history }) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        const err = new Error('OPENAI_API_KEY is not set on the server');
        err.statusCode = 500;
        throw err;
    }

    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push(...history, { role: 'user', content: text });

    try {
        const { data } = await axios.post(
            OPENAI_URL,
            { model: MODEL, messages },
            {
                headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                timeout: 30000
            }
        );
        return {
            model: data.model,
            response: data.choices?.[0]?.message?.content ?? '',
            usage: data.usage
        };
    } catch (e) {
        const err = new Error(e.response?.data?.error?.message || e.message);
        err.statusCode = e.response?.status === 429 ? 429 : 502;
        throw err;
    }
}

// Accepts a JSON array like [{"role":"user","content":"hi"},{"role":"assistant","content":"hello"}]
function parseHistory(raw) {
    if (!raw) return [];
    let list;
    try { list = JSON.parse(raw); } catch { return null; }
    if (!Array.isArray(list)) return null;
    const valid = list.every(
        (m) => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string'
    );
    return valid ? list.map(({ role, content }) => ({ role, content })) : null;
}

module.exports = function (app) {
    app.get('/ai/chatgpt', async (req, res) => {
        const { text, system_prompt: systemPrompt, conversation } = req.query;

        if (!text) {
            return res.status(400).json({ status: false, error: 'Parameter "text" is required' });
        }
        if (text.length > MAX_TEXT_LENGTH) {
            return res.status(400).json({ status: false, error: `"text" must be at most ${MAX_TEXT_LENGTH} characters` });
        }
        const history = parseHistory(conversation);
        if (history === null) {
            return res.status(400).json({
                status: false,
                error: '"conversation" must be a JSON array of {role: "user"|"assistant", content: string}'
            });
        }

        try {
            const result = await chat({ text, systemPrompt, history });
            res.status(200).json({ status: true, result });
        } catch (e) {
            console.error('ChatGPT error:', e.message);
            res.status(e.statusCode || 500).json({ status: false, error: e.message });
        }
    });
};
