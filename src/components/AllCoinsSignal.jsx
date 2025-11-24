import React, { useState, useEffect } from 'react';
import { getSignal } from '../utils/indicators';

const TIMEFRAMES = ['15m', '1h', '4h', '1d'];

const AllCoinsSignal = ({ isOpen, onClose, coins }) => {
    const [signals, setSignals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (!isOpen) return;

        fetchAllSignals();
        const interval = setInterval(() => {
            console.log('🔄 Auto-refreshing signals...');
            fetchAllSignals();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [isOpen]);

    // Real-time price updates via WebSocket
    useEffect(() => {
        if (!isOpen || signals.length === 0) return;

        const websockets = [];

        coins.forEach(coin => {
            try {
                const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${coin.symbol}@ticker`);

                ws.onopen = () => {
                    // console.log(`✅ [WS] Connected to ${coin.symbol}`);
                };

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        const newPrice = parseFloat(data.c);
                        const newChange = parseFloat(data.P);

                        setSignals(prev => prev.map(signal => {
                            if (signal.coinId === coin.id) {
                                return {
                                    ...signal,
                                    price: newPrice,
                                    change24h: newChange
                                };
                            }
                            return signal;
                        }));
                    } catch (e) {
                        console.error(`[WS] Parse error for ${coin.symbol}:`, e);
                    }
                };

                websockets.push(ws);
            } catch (err) {
                console.error(`[WS] Connection error for ${coin.symbol}:`, err);
            }
        });

        return () => {
            websockets.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                    ws.close();
                }
            });
        };
    }, [isOpen, coins]); // Removed signals dependency to avoid reconnect loops

    const fetchAllSignals = async () => {
        setLoading(true);
        const newSignals = [];

        // Fetch Fear & Greed once
        let fearGreed = { value: 50 };
        try {
            const fgRes = await fetch('https://api.alternative.me/fng/');
            const fgData = await fgRes.json();
            fearGreed = fgData.data?.[0] || { value: 50 };
        } catch (e) {
            console.error("Error fetching Fear & Greed:", e);
        }

        const promises = [];

        for (const coin of coins) {
            for (const tf of TIMEFRAMES) {
                promises.push((async () => {
                    try {
                        // Fetch price and history
                        const [priceRes, historyRes] = await Promise.all([
                            fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin.id}&vs_currencies=usd&include_24hr_change=true`),
                            fetch(`https://api.binance.com/api/v3/klines?symbol=${coin.symbol.toUpperCase()}&interval=${tf}&limit=365`)
                        ]);

                        const priceData = await priceRes.json();
                        const historyData = await historyRes.json();

                        const price = priceData[coin.id]?.usd;
                        const change24h = priceData[coin.id]?.usd_24h_change || 0;

                        if (price && Array.isArray(historyData) && historyData.length > 0) {
                            const prices = historyData.map(item => parseFloat(item[4]));
                            const volumes = historyData.map(item => parseFloat(item[5]));

                            const { calculateRSI, getMACD, calculateBollingerBands, calculateEMA, calculateOBV, calculateSupportResistance } = await import('../utils/indicators');

                            const livePrices = [...prices, price];
                            const liveVolumes = [...volumes, 0];

                            const rsi = calculateRSI(livePrices);
                            const macd = getMACD(livePrices);
                            const bb = calculateBollingerBands(livePrices);
                            const ema50 = calculateEMA(livePrices, 50);
                            const ema200 = calculateEMA(livePrices, 200);
                            const obvLine = calculateOBV(livePrices, liveVolumes);
                            const obvTrend = obvLine[obvLine.length - 1] > obvLine[obvLine.length - 10] ? 'UP' : 'DOWN';
                            const levels = calculateSupportResistance(livePrices);
                            const nearestSupport = levels.filter(l => l.type === 'SUPPORT' && l.price < price)[0]?.price;
                            const nearestResistance = levels.filter(l => l.type === 'RESISTANCE' && l.price > price).reverse()[0]?.price;

                            const signal = getSignal(rsi, fearGreed.value, macd, ema50, ema200, price, obvTrend, nearestSupport, nearestResistance, bb);

                            if (signal.type.includes('LONG') || signal.type.includes('SHORT')) {
                                newSignals.push({
                                    ...signal,
                                    id: `${coin.id}-${tf}`,
                                    coinId: coin.id,
                                    price,
                                    change24h,
                                    name: coin.name,
                                    short: coin.short,
                                    timeframe: tf
                                });
                            }
                        }
                    } catch (error) {
                        console.error(`Error fetching signal for ${coin.name} ${tf}:`, error);
                    }
                })());
            }
        }

        await Promise.all(promises);

        // Sort by confidence (highest to lowest)
        newSignals.sort((a, b) => b.confidence - a.confidence);

        setSignals(newSignals);
        setLastUpdate(new Date());
        setLoading(false);
    };

    if (!isOpen) return null;

    const getSignalColor = (type) => {
        if (type.includes('LONG')) return 'bg-green-500/20 border-green-500/50 text-green-400';
        if (type.includes('SHORT')) return 'bg-red-500/20 border-red-500/50 text-red-400';
        return 'bg-gray-500/20 border-gray-500/50 text-gray-400';
    };

    const getSignalIcon = (type) => {
        if (type.includes('LONG')) return '📈';
        if (type.includes('SHORT')) return '📉';
        return '⏸️';
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gradient-to-br from-gray-900 to-black border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-gradient-to-r from-accent to-purple-600 p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            All Coins Signals
                            <span className="flex items-center gap-1 text-sm font-normal">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                LIVE
                            </span>
                        </h2>
                        <p className="text-white/80 text-sm mt-1">
                            Showing strong signals across all timeframes • Sorted by confidence
                        </p>
                        {lastUpdate && (
                            <p className="text-white/60 text-xs mt-1">
                                Last updated: {lastUpdate.toLocaleTimeString()}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition p-2 hover:bg-white/10 rounded-lg"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent mb-4"></div>
                            <p className="text-gray-400">Scanning all markets & timeframes...</p>
                        </div>
                    ) : signals.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <p className="text-xl">No strong signals found right now.</p>
                            <p className="text-sm mt-2">Try refreshing or checking back later.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {signals.map((signal) => (
                                <div
                                    key={signal.id}
                                    className={`border rounded-xl p-4 transition hover:scale-105 cursor-pointer ${getSignalColor(signal.type)}`}
                                >
                                    {/* Coin Header */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-lg text-white">{signal.short}</h3>
                                                <span className="text-xs bg-black/40 px-2 py-0.5 rounded text-white/80 font-mono">
                                                    {signal.timeframe}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400">{signal.name}</p>
                                        </div>
                                        <div className="text-2xl">{getSignalIcon(signal.type)}</div>
                                    </div>

                                    {/* Price */}
                                    {signal.price && (
                                        <div className="mb-3">
                                            <div className="text-xl font-mono font-bold text-white">
                                                ${signal.price.toLocaleString()}
                                            </div>
                                            <div className={`text-sm font-bold ${signal.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {signal.change24h >= 0 ? '+' : ''}{signal.change24h?.toFixed(2)}%
                                            </div>
                                        </div>
                                    )}

                                    {/* Signal */}
                                    <div className="bg-black/30 rounded-lg p-3 mb-3">
                                        <div className="text-xs text-gray-400 mb-1">Signal</div>
                                        <div className="font-bold text-lg">{signal.type}</div>
                                        {signal.confidence && (
                                            <div className="mt-2">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-gray-400">Confidence</span>
                                                    <span className="font-bold">{signal.confidence}%</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-white transition-all"
                                                        style={{ width: `${signal.confidence}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="bg-black/30 rounded p-2">
                                            <div className="text-gray-400">Leverage</div>
                                            <div className="font-bold">{signal.leverage}</div>
                                        </div>
                                        <div className="bg-black/30 rounded p-2">
                                            <div className="text-gray-400">Risk</div>
                                            <div className={`font-bold ${signal.riskLevel === 'HIGH' ? 'text-red-400' :
                                                signal.riskLevel === 'LOW' ? 'text-green-400' :
                                                    'text-yellow-400'
                                                }`}>
                                                {signal.riskLevel}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reason */}
                                    {signal.reason && (
                                        <div className="mt-3 text-xs text-gray-300 line-clamp-2">
                                            {signal.reason}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Refresh Button */}
                    {!loading && (
                        <div className="mt-6 flex justify-center">
                            <button
                                onClick={fetchAllSignals}
                                className="px-6 py-3 bg-accent hover:bg-accent/80 text-white font-bold rounded-lg transition flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Refresh Signals
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AllCoinsSignal;
