// Helper for fetch with timeout
const fetchWithTimeout = async (resource, options = {}) => {
  const { timeout = 15000 } = options; // Increased default timeout to 15s

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

// Retry utility with exponential backoff
const retryWithBackoff = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

export const fetchCoinPrice = async (coinId = 'bitcoin') => {
  try {
    // Direct CoinGecko call
    const response = await retryWithBackoff(() => fetchWithTimeout(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    console.log('[priceService] raw price data:', JSON.stringify(data));
    if (!data || typeof data !== 'object' || !data[coinId]) {
      console.warn('[priceService] Unexpected payload for', coinId, data);
      return null;
    }
    const coinInfo = data[coinId];
    if (!coinInfo || typeof coinInfo.usd !== 'number') {
      console.warn('[priceService] Missing usd field for', coinId, coinInfo);
      return null;
    }
    return {
      price: coinInfo.usd,
      change24h: coinInfo.usd_24h_change ?? coinInfo.usd_24hr_change ?? 0,
    };
  } catch (error) {
    console.error(`Error fetching ${coinId} price:`, error);
    return null;
  }
};

export const subscribeToTicker = (symbol = 'btcusdt', onMessage) => {
  let ws = null;
  let reconnectTimeout = null;
  let isManualClose = false;
  let pollInterval = null;

  const handleMessage = (data) => {
    try {
      const parsed = JSON.parse(data);
      onMessage({
        price: parseFloat(parsed.c),
        change24h: parseFloat(parsed.P),
      });
    } catch (e) {
      console.error('[priceService] WS message parse error:', e);
    }
  };

  const connect = () => {
    try {
      ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@ticker`);
      ws.onopen = () => console.log(`✅ WebSocket connected for ${symbol}`);
      ws.onmessage = (e) => handleMessage(e.data);
      ws.onerror = (err) => console.error('[priceService] WebSocket error:', err);
      ws.onclose = () => {
        console.log(`WebSocket closed for ${symbol}`);
        if (!isManualClose) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };
    } catch (err) {
      console.error('[priceService] WebSocket connection exception:', err);
      startPolling();
    }
  };

  const startPolling = () => {
    if (pollInterval) return;
    console.log('[priceService] Falling back to HTTP polling for ticker');
    pollInterval = setInterval(async () => {
      try {
        const priceData = await fetchCoinPrice(symbol.replace('usdt', ''));
        if (priceData) onMessage({ price: priceData.price, change24h: priceData.change24h });
      } catch (e) {
        console.error('[priceService] Polling error:', e);
      }
    }, 5000);
  };

  connect();

  return () => {
    isManualClose = true;
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (pollInterval) clearInterval(pollInterval);
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) ws.close();
  };
};

export const fetchFearAndGreed = async () => {
  try {
    return await retryWithBackoff(async () => {
      // Direct Alternative.me call
      const response = await fetch('https://api.alternative.me/fng/', {
        signal: AbortSignal.timeout(30000) // Increased to 30s
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.data || !data.data[0]) {
        throw new Error('Invalid data structure');
      }

      return data.data[0];
    });
  } catch (error) {
    console.error('Error fetching Fear & Greed:', error);
    // Return neutral value as fallback
    return { value: 50, value_classification: 'Neutral' };
  }
};

const historyCache = {};

const ID_TO_SYMBOL = {
  'bitcoin': 'BTCUSDT',
  'ethereum': 'ETHUSDT',
  'solana': 'SOLUSDT',
  'cardano': 'ADAUSDT',
  'polkadot': 'DOTUSDT'
};

export const fetchHistory = async (coinId = 'bitcoin', days = 365) => {
  const cacheKey = `${coinId}-${days}`;
  const now = Date.now();

  if (historyCache[cacheKey] && (now - historyCache[cacheKey].timestamp < 300000)) { // 5 minutes cache
    console.log(`[priceService] Returning cached history for ${coinId}`);
    return historyCache[cacheKey].data;
  }

  try {
    const symbol = ID_TO_SYMBOL[coinId];
    if (!symbol) throw new Error(`No symbol mapping for ${coinId}`);

    return await retryWithBackoff(async () => {
      // Binance API call (Reliable & Fast)
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1d&limit=${days}`,
        { signal: AbortSignal.timeout(10000) }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Invalid data structure from Binance');
      }

      // Map Binance format [time, open, high, low, close, volume, ...] to CoinGecko format
      const prices = data.map(item => [item[0], parseFloat(item[4])]);
      const volumes = data.map(item => [item[0], parseFloat(item[5])]);

      const result = { prices, volumes };

      historyCache[cacheKey] = {
        timestamp: Date.now(),
        data: result
      };

      return result;
    }, 2, 2000);
  } catch (error) {
    console.error(`Error fetching ${coinId} history from Binance:`, error);
    // Fallback to empty or try CoinGecko if needed, but Binance is usually solid
    return { prices: [], volumes: [] };
  }
};
