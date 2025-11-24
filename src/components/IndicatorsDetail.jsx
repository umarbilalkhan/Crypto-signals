import React from 'react';

const IndicatorCard = ({ title, value, status, children }) => (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex flex-col gap-2 hover:bg-white/10 transition">
        <div className="flex justify-between items-start">
            <span className="text-gray-400 text-sm font-medium">{title}</span>
            {status && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${status === 'BULLISH' || status === 'UP' ? 'bg-green-500/20 text-green-400' :
                    status === 'BEARISH' || status === 'DOWN' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                    }`}>
                    {status}
                </span>
            )}
        </div>
        <div className="text-2xl font-bold text-white font-mono">
            {value}
        </div>
        {children && <div className="mt-2">{children}</div>}
    </div>
);

const IndicatorsDetail = ({ data }) => {
    if (!data) return null;

    const { rsi, macd, bb, ema50, ema200, obvTrend, nearestSupport, nearestResistance } = data;

    // Helper to determine RSI status
    const getRsiStatus = (val) => {
        const v = parseFloat(val);
        if (v > 70) return 'OVERBOUGHT';
        if (v < 30) return 'OVERSOLD';
        return 'NEUTRAL';
    };

    return (
        <section className="w-full mt-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Technical Indicators
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* RSI */}
                <IndicatorCard
                    title="RSI (14)"
                    value={rsi}
                    status={getRsiStatus(rsi)}
                >
                    <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden mt-1">
                        <div
                            className={`h-full ${parseFloat(rsi) > 70 ? 'bg-red-500' : parseFloat(rsi) < 30 ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(Math.max(parseFloat(rsi), 0), 100)}%` }}
                        />
                    </div>
                </IndicatorCard>

                {/* MACD */}
                <IndicatorCard
                    title="MACD"
                    value={macd.histogram.toFixed(2)}
                    status={macd.histogram > 0 ? 'BULLISH' : 'BEARISH'}
                >
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Signal: {macd.signal.toFixed(2)}</span>
                        <span>MACD: {macd.macd.toFixed(2)}</span>
                    </div>
                </IndicatorCard>

                {/* Bollinger Bands */}
                <IndicatorCard
                    title="Bollinger Bands"
                    value={bb.middle.toFixed(2)}
                    status="VOLATILITY"
                >
                    <div className="flex flex-col gap-1 text-xs text-gray-500 mt-1">
                        <div className="flex justify-between">
                            <span>Upper</span>
                            <span className="text-gray-300">{bb.upper.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Lower</span>
                            <span className="text-gray-300">{bb.lower.toFixed(2)}</span>
                        </div>
                    </div>
                </IndicatorCard>

                {/* OBV Trend */}
                <IndicatorCard
                    title="OBV Trend"
                    value={obvTrend}
                    status={obvTrend === 'UP' ? 'BULLISH' : 'BEARISH'}
                />

                {/* EMA 50 */}
                <IndicatorCard
                    title="EMA (50)"
                    value={ema50.toFixed(2)}
                />

                {/* EMA 200 */}
                <IndicatorCard
                    title="EMA (200)"
                    value={ema200.toFixed(2)}
                />

                {/* Support */}
                <IndicatorCard
                    title="Nearest Support"
                    value={nearestSupport ? `$${nearestSupport.toLocaleString()}` : 'N/A'}
                    status="SUPPORT"
                />

                {/* Resistance */}
                <IndicatorCard
                    title="Nearest Resistance"
                    value={nearestResistance ? `$${nearestResistance.toLocaleString()}` : 'N/A'}
                    status="RESISTANCE"
                />
            </div>
        </section>
    );
};

export default IndicatorsDetail;
