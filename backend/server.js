const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

app.get('/proxy', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL obrigatória' });

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        res.send(response.data);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar a URL', details: err.message });
    }
});

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Proxy rodando em http://localhost:${PORT}`);
});
