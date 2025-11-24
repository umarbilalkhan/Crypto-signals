import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import IndicatorsDetail from '../components/IndicatorsDetail';
import FuturesSignal from '../components/FuturesSignal';
import AllCoinsSignal from '../components/AllCoinsSignal';
import { calculateRSI, getSignal, getMACD, calculateBollingerBands, calculateEMA, calculateOBV, calculateSupportResistance } from '../utils/indicators';

const COINS = [
    { id: 'bitcoin', symbol: 'btcusdt', name: 'Bitcoin', short: 'BTC' },
    { id: 'ethereum', symbol: 'ethusdt', name: 'Ethereum', short: 'ETH' },
    { id: 'solana', symbol: 'solusdt', name: 'Solana', short: 'SOL' },
];

const IndicatorsPage = () => {
    const [selectedCoin, setSelectedCoin] = useState(COINS[0]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [signalData, setSignalData] = useState(null);
    const [priceData, setPriceData] = useState(null);
    const [showAllSignals, setShowAllSignals] = useState(false);
    const [historicalData, setHistoricalData] = useState(null); // Store historical data for recalculation
    const [timeframe, setTimeframe] = useState('1h'); // 15m, 1h, 4h, 1d

    const TIMEFRAMES = [
        { value: '15m', label: '15 Min', limit: 500 },
        { value: '1h', label: '1 Hour', limit: 365 },
        { value: '4h', label: '4 Hours', limit: 365 },
        { value: '1d', label: '1 Day', limit: 365 }
    ];

    // Fetch initial data (historical + indicators)
    useEffect(() => {
        // Reset state immediately when coin changes
        setLoading(true);
        setError(null);
        setPriceData(null);
        setSignalData(null);

        let isCancelled = false; // Prevent race conditions

        const fetchData = async () => {
            try {
                console.log(`📊 [INDICATORS] Fetching data for ${selectedCoin.name}...`);

                const coinSymbolMap = {
                    'bitcoin': 'BTCUSDT',
                    'ethereum': 'ETHUSDT',
                    'solana': 'SOLUSDT'
                };

                // 1. Fetch initial Price from CoinGecko
                console.log(`[API] Fetching price for ${selectedCoin.id}...`);
                const priceResponse = await fetch(
                    `https://api.coingecko.com/api/v3/simple/price?ids=${selectedCoin.id}&vs_currencies=usd&include_24hr_change=true`,
                    { signal: AbortSignal.timeout(10000) }
                );

                if (!priceResponse.ok) {
                    throw new Error(`CoinGecko API error: ${priceResponse.status}`);
                }

                const priceJson = await priceResponse.json();
                console.log(`[API] Price response:`, priceJson);

                const price = {
                    price: priceJson[selectedCoin.id]?.usd,
                    change24h: priceJson[selectedCoin.id]?.usd_24h_change || 0
                };

                if (isCancelled) return;

                if (!price.price) {
                    throw new Error(`Failed to fetch price for ${selectedCoin.id}`);
                }

                setPriceData(price);
                console.log(`[API] ✅ Price set: $${price.price}`);

                // 2. Fetch Fear & Greed from Alternative.me
                console.log(`[API] Fetching Fear & Greed...`);
                const fgResponse = await fetch('https://api.alternative.me/fng/', {
                    signal: AbortSignal.timeout(10000)
                });

                if (!fgResponse.ok) {
                    console.warn(`Fear & Greed API error: ${fgResponse.status}, using default`);
                }

                const fgJson = await fgResponse.json();
                const fgData = fgJson.data?.[0] || { value: 50, value_classification: 'Neutral' };
                console.log(`[API] ✅ Fear & Greed: ${fgData.value}`);

                if (isCancelled) return;

                // 3. Fetch Historical Data from Binance
                const symbol = coinSymbolMap[selectedCoin.id];
                const selectedTimeframeData = TIMEFRAMES.find(tf => tf.value === timeframe);
                console.log(`[API] Fetching history for ${symbol} at ${timeframe} interval...`);
                const historyResponse = await fetch(
                    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=${selectedTimeframeData.limit}`,
                    { signal: AbortSignal.timeout(10000) }
                );

                if (!historyResponse.ok) {
                    throw new Error(`Binance API error: ${historyResponse.status}`);
                }

                const historyData = await historyResponse.json();
                console.log(`[API] History data points: ${historyData.length}`);

                if (isCancelled) return;

                if (Array.isArray(historyData) && historyData.length > 0) {
                    const prices = historyData.map(item => parseFloat(item[4]));
                    const volumes = historyData.map(item => parseFloat(item[5]));

                    // Store historical data for real-time recalculation
                    if (!isCancelled) {
                        setHistoricalData({
                            prices,
                            volumes,
                            fearGreed: fgData
                        });
                    }

                    const livePrices = [...prices, price.price];
                    const liveVolumes = [...volumes, 0];

                    const rsi = calculateRSI(livePrices);
                    const macd = getMACD(livePrices);
                    const bb = calculateBollingerBands(livePrices);
                    const ema50 = calculateEMA(livePrices, 50);
                    const ema200 = calculateEMA(livePrices, 200);
                    const obvLine = calculateOBV(livePrices, liveVolumes);
                    const obvTrend = obvLine[obvLine.length - 1] > obvLine[obvLine.length - 10] ? 'UP' : 'DOWN';
                    const levels = calculateSupportResistance(livePrices);
                    const nearestSupport = levels.filter(l => l.type === 'SUPPORT' && l.price < price.price)[0]?.price;
                    const nearestResistance = levels.filter(l => l.type === 'RESISTANCE' && l.price > price.price).reverse()[0]?.price;

                    if (!isCancelled) {
                        setSignalData({
                            rsi: rsi.toFixed(1),
                            macd,
                            bb,
                            ema50,
                            ema200,
                            obvTrend,
                            nearestSupport,
                            nearestResistance,
                            fearGreed: fgData
                        });
                        console.log(`[API] ✅ All indicators calculated successfully`);
                    }
                } else {
                    console.warn('Insufficient history data for indicators');
                    if (!isCancelled) {
                        setSignalData(null);
                    }
                }

            } catch (err) {
                if (!isCancelled) {
                    console.error('❌ Error fetching indicators data:', err);
                    console.error('Error details:', err.message);
                    setError(`Failed to load indicator data: ${err.message}`);
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isCancelled = true;
        };
    }, [selectedCoin, timeframe]);

    // Recalculate indicators when price updates in real-time
    useEffect(() => {
        if (!priceData || !historicalData || !priceData.price) return;

        console.log(`🔄 [INDICATORS] Recalculating with live price: $${priceData.price}`);

        try {
            const { prices, volumes, fearGreed } = historicalData;

            const livePrices = [...prices, priceData.price];
            const liveVolumes = [...volumes, 0];

            const rsi = calculateRSI(livePrices);
            const macd = getMACD(livePrices);
            const bb = calculateBollingerBands(livePrices);
            const ema50 = calculateEMA(livePrices, 50);
            const ema200 = calculateEMA(livePrices, 200);
            const obvLine = calculateOBV(livePrices, liveVolumes);
            const obvTrend = obvLine[obvLine.length - 1] > obvLine[obvLine.length - 10] ? 'UP' : 'DOWN';
            const levels = calculateSupportResistance(livePrices);
            const nearestSupport = levels.filter(l => l.type === 'SUPPORT' && l.price < priceData.price)[0]?.price;
            const nearestResistance = levels.filter(l => l.type === 'RESISTANCE' && l.price > priceData.price).reverse()[0]?.price;

            setSignalData({
                rsi: rsi.toFixed(1),
                macd,
                bb,
                ema50,
                ema200,
                obvTrend,
                nearestSupport,
                nearestResistance,
                fearGreed
            });

            console.log(`✅ [INDICATORS] Updated - RSI: ${rsi.toFixed(1)}, Price: $${priceData.price}`);
        } catch (err) {
            console.error('Error recalculating indicators:', err);
        }
    }, [priceData?.price, historicalData]);

    // Real-time WebSocket price updates
    useEffect(() => {
        console.log(`🔌 [WEBSOCKET] Connecting to ${selectedCoin.symbol}...`);

        let ws = null;
        let reconnectTimeout = null;
        let isActive = true;

        const connect = () => {
            if (!isActive) return;

            try {
                ws = new WebSocket(`wss://stream.binance.com:9443/ws/${selectedCoin.symbol}@ticker`);

                ws.onopen = () => {
                    if (isActive) {
                        console.log(`✅ [WEBSOCKET] Connected for ${selectedCoin.name}`);
                    }
                };

                ws.onmessage = (event) => {
                    if (!isActive) return;

                    try {
                        const data = JSON.parse(event.data);

                        // Verify the symbol matches the current coin to prevent flickering
                        if (data.s && data.s.toLowerCase() !== selectedCoin.symbol) {
                            console.warn(`[WEBSOCKET] Ignoring data for ${data.s}, expecting ${selectedCoin.symbol}`);
                            return;
                        }

                        setPriceData(prev => {
                            if (!prev) return prev;
                            return {
                                ...prev,
                                price: parseFloat(data.c),
                                change24h: parseFloat(data.P)
                            };
                        });
                    } catch (e) {
                        console.error('[WEBSOCKET] Parse error:', e);
                    }
                };

                ws.onerror = (err) => {
                    console.error('[WEBSOCKET] Error:', err);
                };

                ws.onclose = () => {
                    if (isActive) {
                        console.log(`🔌 [WEBSOCKET] Disconnected for ${selectedCoin.name}`);
                        reconnectTimeout = setTimeout(connect, 3000);
                    }
                };
            } catch (err) {
                console.error('[WEBSOCKET] Connection error:', err);
            }
        };

        connect();

        return () => {
            console.log(`🔌 [WEBSOCKET] Cleaning up for ${selectedCoin.name}`);
            isActive = false;
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            if (ws) {
                if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                    ws.close();
                }
                ws = null; // Clear reference
            }
        };
    }, [selectedCoin]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-black flex flex-col items-center py-8 px-4 md:py-12">
            <header className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/" className="text-gray-400 hover:text-white transition">
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Technical Indicators</h1>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Coin Selector */}
                    <div className="flex bg-black/30 rounded-full p-1 gap-1">
                        {COINS.map(coin => (
                            <button
                                key={coin.id}
                                onClick={() => setSelectedCoin(coin)}
                                className={`px-4 py-1.5 rounded-full text-sm transition whitespace-nowrap ${selectedCoin.id === coin.id ? 'bg-accent text-white font-bold shadow-lg' : 'hover:text-white text-gray-400'}`}
                            >
                                {coin.short}
                            </button>
                        ))}
                    </div>

                    {/* Timeframe Selector */}
                    <div className="flex bg-black/30 rounded-full p-1 gap-1">
                        {TIMEFRAMES.map(tf => (
                            <button
                                key={tf.value}
                                onClick={() => setTimeframe(tf.value)}
                                className={`px-4 py-1.5 rounded-full text-sm transition whitespace-nowrap ${timeframe === tf.value ? 'bg-purple-600 text-white font-bold shadow-lg' : 'hover:text-white text-gray-400'}`}
                            >
                                {tf.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="w-full max-w-6xl">
                {loading && !signalData ? (
                    <div className="w-full h-64 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
                    </div>
                ) : (
                    <>
                        {priceData ? (
                            <div className="mb-8 p-6 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                                <div>
                                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                                        {selectedCoin.name}
                                        <span className="flex items-center gap-1 text-xs font-normal bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/50">
                                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                            LIVE
                                        </span>
                                    </h2>
                                    <p className="text-gray-400 text-sm">
                                        Real-time Technical Analysis • {TIMEFRAMES.find(tf => tf.value === timeframe)?.label} Timeframe
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-mono font-bold text-white">
                                        ${priceData.price?.toLocaleString()}
                                    </div>
                                    <div className={`text-sm font-bold ${priceData.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {priceData.change24h >= 0 ? '+' : ''}{priceData.change24h?.toFixed(2)}%
                                    </div>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="text-center text-red-400 py-12">
                                <p>{error}</p>
                                <button onClick={() => setSelectedCoin({ ...selectedCoin })} className="mt-4 px-4 py-2 bg-white/10 rounded hover:bg-white/20">Retry</button>
                            </div>
                        ) : null}

                        {signalData ? (
                            <>
                                <FuturesSignal data={signalData} price={priceData?.price} />
                                <IndicatorsDetail data={signalData} />
                            </>
                        ) : priceData ? (
                            <div className="text-center text-gray-500 py-12 bg-white/5 rounded-xl">
                                <p className="mb-2">⚠️ Technical indicators unavailable</p>
                                <p className="text-xs">Insufficient historical data to calculate indicators. This may be due to API rate limits.</p>
                            </div>
                        ) : null}
                    </>
                )}
            </main>

            {/* Floating Button - All Coins Signals */}
            <button
                onClick={() => setShowAllSignals(true)}
                className="fixed right-6 top-1/2 -translate-y-1/2 bg-gradient-to-r from-accent to-purple-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-40 group"
                title="View All Coins Signals"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-black text-white text-xs px-3 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    All Coins Signals
                </span>
            </button>

            {/* All Coins Signal Modal */}
            <AllCoinsSignal
                isOpen={showAllSignals}
                onClose={() => setShowAllSignals(false)}
                coins={COINS}
            />
        </div>
    );
};

export default IndicatorsPage;
