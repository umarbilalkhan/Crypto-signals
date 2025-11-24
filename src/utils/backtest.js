import { calculateRSI, getMACD, calculateBollingerBands, calculateEMA, calculateOBV, calculateSupportResistance, getSignal } from './indicators';

export const runBacktest = (prices, volumes) => {
    if (!prices || prices.length < 200) return null;

    let trades = [];
    let currentTrade = null;
    let wins = 0;
    let losses = 0;
    let totalPnL = 0; // Percentage

    // We need at least 200 data points for EMA200
    const startIndex = 200;

    for (let i = startIndex; i < prices.length; i++) {
        // Slice data up to current point 'i' to simulate real-time
        const currentPrices = prices.slice(0, i + 1);
        const currentVolumes = volumes.slice(0, i + 1);
        const price = prices[i];

        // Calculate Indicators
        const rsi = calculateRSI(currentPrices);
        const macd = getMACD(currentPrices);
        const bb = calculateBollingerBands(currentPrices);
        const ema50 = calculateEMA(currentPrices, 50);
        const ema200 = calculateEMA(currentPrices, 200);

        const obvLine = calculateOBV(currentPrices, currentVolumes);
        const obvTrend = obvLine[obvLine.length - 1] > obvLine[obvLine.length - 10] ? 'UP' : 'DOWN';

        const levels = calculateSupportResistance(currentPrices);
        const nearestSupport = levels.filter(l => l.type === 'SUPPORT' && l.price < price)[0]?.price;
        const nearestResistance = levels.filter(l => l.type === 'RESISTANCE' && l.price > price).reverse()[0]?.price;

        // Get Signal
        // Note: We don't have Fear & Greed history easily available for every day in this simple backtest, 
        // so we'll simulate a neutral F&G (50) or omit it.
        // We also pass 'HOLD' as previous signal to avoid hysteresis blocking initial entries in this simple loop,
        // or we could track the previous simulated signal.
        const signal = getSignal(rsi, 50, macd, ema50, ema200, price, obvTrend, nearestSupport, nearestResistance, bb);

        // Trading Logic (Futures: Long & Short)
        if (currentTrade) {
            // Check for exit or reversal
            if (currentTrade.type === 'LONG') {
                if (signal.type.includes('SELL')) {
                    // Close Long
                    const pnl = ((price - currentTrade.entryPrice) / currentTrade.entryPrice) * 100;
                    trades.push({ ...currentTrade, exitPrice: price, exitDate: i, pnl });
                    totalPnL += pnl;
                    if (pnl > 0) wins++; else losses++;
                    currentTrade = null;

                    // Open Short if Strong Sell
                    if (signal.type === 'STRONG SELL') {
                        currentTrade = { type: 'SHORT', entryPrice: price, entryDate: i };
                    }
                }
            } else if (currentTrade.type === 'SHORT') {
                if (signal.type.includes('BUY')) {
                    // Close Short
                    const pnl = ((currentTrade.entryPrice - price) / currentTrade.entryPrice) * 100;
                    trades.push({ ...currentTrade, exitPrice: price, exitDate: i, pnl });
                    totalPnL += pnl;
                    if (pnl > 0) wins++; else losses++;
                    currentTrade = null;

                    // Open Long if Strong Buy
                    if (signal.type === 'STRONG BUY') {
                        currentTrade = { type: 'LONG', entryPrice: price, entryDate: i };
                    }
                }
            }
        } else {
            // No current trade, look for entry
            if (signal.type.includes('BUY')) {
                currentTrade = { type: 'LONG', entryPrice: price, entryDate: i };
            } else if (signal.type.includes('SELL')) {
                currentTrade = { type: 'SHORT', entryPrice: price, entryDate: i };
            }
        }
    }

    // Calculate Metrics
    const totalTrades = trades.length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

    // Current Position Status
    let currentStatus = 'NEUTRAL';
    let currentPnL = 0;
    let lastSignalDate = 'N/A';
    let entryPrice = 0;

    if (currentTrade) {
        const currentPrice = prices[prices.length - 1];
        currentStatus = currentTrade.type;
        entryPrice = currentTrade.entryPrice;
        if (currentTrade.type === 'LONG') {
            currentPnL = ((currentPrice - currentTrade.entryPrice) / currentTrade.entryPrice) * 100;
        } else {
            currentPnL = ((currentTrade.entryPrice - currentPrice) / currentTrade.entryPrice) * 100;
        }
        // Estimate date (assuming daily data, counting back from today)
        const daysAgo = prices.length - 1 - currentTrade.entryDate;
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        lastSignalDate = date.toLocaleDateString();
    } else if (trades.length > 0) {
        const lastTrade = trades[trades.length - 1];
        const daysAgo = prices.length - 1 - lastTrade.exitDate;
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        lastSignalDate = date.toLocaleDateString();
    }

    return {
        winRate: winRate.toFixed(1),
        totalTrades,
        totalPnL: totalPnL.toFixed(1),
        currentStatus,
        currentPnL: currentPnL.toFixed(2),
        lastSignalDate,
        entryPrice,
        trades // Return full trade list if needed for charts
    };
};
