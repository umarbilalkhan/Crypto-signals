export const calculateRSI = (prices, period = 14) => {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
        const change = prices[i] - prices[i - 1];
        if (change > 0) gains += change;
        else losses += Math.abs(change);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1];
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? Math.abs(change) : 0;

        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
};

export const calculateEMA = (prices, period) => {
    if (prices.length < period) return null;
    const k = 2 / (period + 1);
    let ema = prices[0];
    for (let i = 1; i < prices.length; i++) {
        ema = prices[i] * k + ema * (1 - k);
    }
    return ema;
};

export const calculateMACD = (prices) => {
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    return {
        macd: ema12 - ema26,
        signal: ema12 - ema26,
        histogram: 0
    };
};

export const getMACD = (prices) => {
    const ema12 = [];
    const ema26 = [];
    const k12 = 2 / (12 + 1);
    const k26 = 2 / (26 + 1);

    let e12 = prices[0];
    let e26 = prices[0];

    for (let i = 0; i < prices.length; i++) {
        e12 = prices[i] * k12 + e12 * (1 - k12);
        e26 = prices[i] * k26 + e26 * (1 - k26);
        ema12.push(e12);
        ema26.push(e26);
    }

    const macdLine = ema12.map((v, i) => v - ema26[i]);

    const k9 = 2 / (9 + 1);
    let signal = macdLine[0];
    const signalLine = [];

    for (let i = 0; i < macdLine.length; i++) {
        signal = macdLine[i] * k9 + signal * (1 - k9);
        signalLine.push(signal);
    }

    const currentMACD = macdLine[macdLine.length - 1];
    const currentSignal = signalLine[signalLine.length - 1];

    return {
        macd: currentMACD,
        signal: currentSignal,
        histogram: currentMACD - currentSignal
    };
};

export const calculateBollingerBands = (prices, period = 20) => {
    if (prices.length < period) return null;

    const slice = prices.slice(-period);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const squaredDiffs = slice.map(p => Math.pow(p - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    const stdDev = Math.sqrt(variance);

    return {
        upper: mean + 2 * stdDev,
        middle: mean,
        lower: mean - 2 * stdDev
    };
};

export const calculateOBV = (prices, volumes) => {
    if (!prices || !volumes || prices.length !== volumes.length) return [];

    let obv = 0;
    const obvLine = [0];

    for (let i = 1; i < prices.length; i++) {
        if (prices[i] > prices[i - 1]) {
            obv += volumes[i];
        } else if (prices[i] < prices[i - 1]) {
            obv -= volumes[i];
        }
        obvLine.push(obv);
    }
    return obvLine;
};

export const calculateSupportResistance = (prices) => {
    const levels = [];
    const window = 14;

    for (let i = window; i < prices.length - window; i++) {
        const slice = prices.slice(i - window, i + window + 1);
        const max = Math.max(...slice);
        const min = Math.min(...slice);

        if (prices[i] === max) levels.push({ price: max, type: 'RESISTANCE' });
        if (prices[i] === min) levels.push({ price: min, type: 'SUPPORT' });
    }

    const uniqueLevels = [];
    levels.forEach(l => {
        const existing = uniqueLevels.find(u => Math.abs(u.price - l.price) / l.price < 0.02);
        if (!existing) uniqueLevels.push(l);
    });

    return uniqueLevels.sort((a, b) => b.price - a.price);
};

/**
 * Advanced Futures Trading Signal Algorithm
 * Analyzes multiple technical indicators and market conditions to generate
 * sophisticated BUY (LONG) or SELL (SHORT) signals for futures trading
 */
export const getSignal = (rsi, fg, macd, ema50, ema200, price, obvTrend, nearestSupport, nearestResistance, bb, previousSignalType = 'HOLD') => {
    let score = 0;
    const analysis = [];
    const riskFactors = [];
    let confidence = 0;
    let volatility = 'MEDIUM';
    let momentum = 'NEUTRAL';

    // ========== TREND ANALYSIS ==========
    const trendStrength = { strong: 0, weak: 0 };

    if (price > ema50 && ema50 > ema200) {
        score += 3;
        trendStrength.strong++;
        analysis.push("📈 Strong Uptrend: Price > EMA50 > EMA200 (Golden Cross)");
        momentum = 'BULLISH';
    } else if (price < ema50 && ema50 < ema200) {
        score -= 3;
        trendStrength.strong++;
        analysis.push("📉 Strong Downtrend: Price < EMA50 < EMA200 (Death Cross)");
        momentum = 'BEARISH';
    } else if (price > ema200) {
        score += 1;
        trendStrength.weak++;
        analysis.push("↗️ Price above EMA200 (Long-term bullish)");
    } else {
        score -= 1;
        trendStrength.weak++;
        analysis.push("↘️ Price below EMA200 (Long-term bearish)");
    }

    // ========== RSI ANALYSIS ==========
    if (rsi < 30) {
        score += 3;
        confidence += 15;
        analysis.push(`🔥 RSI Oversold (${rsi.toFixed(1)}) - Strong reversal potential`);
    } else if (rsi < 40) {
        score += 2;
        confidence += 10;
        analysis.push(`⚡ RSI Low (${rsi.toFixed(1)}) - Bullish momentum building`);
    } else if (rsi > 70) {
        score -= 3;
        confidence += 15;
        analysis.push(`❄️ RSI Overbought (${rsi.toFixed(1)}) - Correction likely`);
    } else if (rsi > 60) {
        score -= 2;
        confidence += 10;
        analysis.push(`⚠️ RSI High (${rsi.toFixed(1)}) - Bearish pressure increasing`);
    } else {
        analysis.push(`➖ RSI Neutral (${rsi.toFixed(1)})`);
    }

    // ========== MACD ANALYSIS ==========
    const macdStrength = Math.abs(macd.histogram);
    if (macd.histogram > 0) {
        if (macd.macd > macd.signal && macdStrength > 0.5) {
            score += 3;
            confidence += 20;
            analysis.push("🚀 MACD Bullish Crossover - Strong buy momentum");
        } else {
            score += 1;
            confidence += 10;
            analysis.push("✅ MACD Positive - Bullish momentum");
        }
    } else {
        if (macd.macd < macd.signal && macdStrength > 0.5) {
            score -= 3;
            confidence += 20;
            analysis.push("💥 MACD Bearish Crossover - Strong sell momentum");
        } else {
            score -= 1;
            confidence += 10;
            analysis.push("❌ MACD Negative - Bearish momentum");
        }
    }

    // ========== BOLLINGER BANDS ==========
    if (bb) {
        const bbWidth = ((bb.upper - bb.lower) / bb.middle) * 100;
        const pricePosition = ((price - bb.lower) / (bb.upper - bb.lower)) * 100;

        if (bbWidth > 8) {
            volatility = 'HIGH';
            riskFactors.push("High volatility - Use wider stop-loss");
        } else if (bbWidth < 4) {
            volatility = 'LOW';
            riskFactors.push("Low volatility - Breakout imminent");
        }

        if (price < bb.lower) {
            score += 4;
            confidence += 25;
            analysis.push("🎯 Price below Lower BB - Oversold, strong reversal signal");
        } else if (pricePosition < 20) {
            score += 2;
            confidence += 15;
            analysis.push("📊 Price near Lower BB - Potential bounce");
        } else if (price > bb.upper) {
            score -= 4;
            confidence += 25;
            analysis.push("⚡ Price above Upper BB - Overbought, reversal expected");
        } else if (pricePosition > 80) {
            score -= 2;
            confidence += 15;
            analysis.push("📊 Price near Upper BB - Potential rejection");
        }

        if (bbWidth < 3) {
            analysis.push("🔒 Bollinger Squeeze detected - Major move incoming");
            confidence += 10;
        }
    }

    // ========== VOLUME ==========
    if (obvTrend === 'UP') {
        score += 2;
        confidence += 15;
        analysis.push("📊 Volume Increasing (OBV Up) - Confirms upward pressure");
    } else if (obvTrend === 'DOWN') {
        score -= 2;
        confidence += 15;
        analysis.push("📉 Volume Decreasing (OBV Down) - Confirms distribution");
    }

    // ========== SUPPORT & RESISTANCE ==========
    const supportDistance = nearestSupport ? ((price - nearestSupport) / price) * 100 : null;
    const resistanceDistance = nearestResistance ? ((nearestResistance - price) / price) * 100 : null;

    if (supportDistance !== null && supportDistance < 2) {
        score += 3;
        confidence += 20;
        analysis.push(`🛡️ Strong Support at $${nearestSupport.toLocaleString()} (${supportDistance.toFixed(1)}% away)`);
    } else if (supportDistance !== null && supportDistance < 5) {
        score += 1;
        confidence += 10;
        analysis.push(`🛡️ Support nearby at $${nearestSupport.toLocaleString()}`);
    }

    if (resistanceDistance !== null && resistanceDistance < 2) {
        score -= 3;
        confidence += 20;
        analysis.push(`🚧 Strong Resistance at $${nearestResistance.toLocaleString()} (${resistanceDistance.toFixed(1)}% away)`);
    } else if (resistanceDistance !== null && resistanceDistance < 5) {
        score -= 1;
        confidence += 10;
        analysis.push(`🚧 Resistance nearby at $${nearestResistance.toLocaleString()}`);
    }

    // ========== MARKET SENTIMENT ==========
    if (fg < 20) {
        score += 3;
        confidence += 15;
        analysis.push(`😱 Extreme Fear (${fg}) - Contrarian BUY opportunity`);
    } else if (fg < 35) {
        score += 2;
        confidence += 10;
        analysis.push(`😰 Fear (${fg}) - Market oversold`);
    } else if (fg > 80) {
        score -= 3;
        confidence += 15;
        analysis.push(`🤑 Extreme Greed (${fg}) - Contrarian SELL opportunity`);
    } else if (fg > 65) {
        score -= 2;
        confidence += 10;
        analysis.push(`😎 Greed (${fg}) - Market overbought`);
    } else {
        analysis.push(`😐 Neutral Sentiment (${fg})`);
    }

    // ========== RISK ASSESSMENT ==========
    let riskLevel = 'MEDIUM';
    if (volatility === 'HIGH' || (rsi > 70 || rsi < 30)) {
        riskLevel = 'HIGH';
        riskFactors.push("High risk due to extreme conditions");
    } else if (volatility === 'LOW' && trendStrength.strong > 0) {
        riskLevel = 'LOW';
    }

    // ========== SIGNAL GENERATION ==========
    confidence = Math.min(confidence, 100);

    let signal = {
        type: 'HOLD',
        color: 'text-gray-400',
        position: 'NEUTRAL',
        leverage: '1x-3x',
        stopLoss: null,
        takeProfit: null
    };

    const hysteresisBonus = previousSignalType === 'HOLD' ? 0 : 1;

    if (score >= 8 + hysteresisBonus) {
        signal = {
            type: 'STRONG LONG',
            color: 'text-green-500',
            position: 'LONG',
            leverage: '5x-10x',
            stopLoss: nearestSupport ? nearestSupport * 0.98 : price * 0.97,
            takeProfit: nearestResistance ? nearestResistance * 1.02 : price * 1.08
        };
    } else if (score >= 4 + hysteresisBonus) {
        signal = {
            type: 'LONG',
            color: 'text-success',
            position: 'LONG',
            leverage: '3x-5x',
            stopLoss: nearestSupport ? nearestSupport * 0.99 : price * 0.98,
            takeProfit: nearestResistance || price * 1.05
        };
    } else if (score <= -8 - hysteresisBonus) {
        signal = {
            type: 'STRONG SHORT',
            color: 'text-red-600',
            position: 'SHORT',
            leverage: '5x-10x',
            stopLoss: nearestResistance ? nearestResistance * 1.02 : price * 1.03,
            takeProfit: nearestSupport ? nearestSupport * 0.98 : price * 0.92
        };
    } else if (score <= -4 - hysteresisBonus) {
        signal = {
            type: 'SHORT',
            color: 'text-danger',
            position: 'SHORT',
            leverage: '3x-5x',
            stopLoss: nearestResistance ? nearestResistance * 1.01 : price * 1.02,
            takeProfit: nearestSupport || price * 0.95
        };
    }

    return {
        ...signal,
        score,
        confidence,
        momentum,
        volatility,
        riskLevel,
        reason: analysis[0] || "Market conditions neutral",
        analysis,
        riskFactors: riskFactors.length > 0 ? riskFactors : ['Normal market conditions']
    };
};
