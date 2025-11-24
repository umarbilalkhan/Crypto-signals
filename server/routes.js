
import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// --- External API Proxies ---

router.get('/price/:coinId', async (req, res) => {
    console.log('📊 [PRICE] Request received for:', req.params.coinId);
    try {
        const { coinId } = req.params;
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`;
        console.log('📊 [PRICE] Fetching from:', url);

        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('❌ [PRICE] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

router.get('/history/:coinId', async (req, res) => {
    console.log('📈 [HISTORY] Request received for:', req.params.coinId);
    try {
        const { coinId } = req.params;
        const { days } = req.query;
        const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days || 365}&interval=daily`;
        console.log('📈 [HISTORY] Fetching from:', url);

        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('❌ [HISTORY] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

router.get('/fear-greed', async (req, res) => {
    console.log('😨 [FEAR&GREED] Request received');
    try {
        const url = 'https://api.alternative.me/fng/';
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('❌ [FEAR&GREED] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

export default router;
