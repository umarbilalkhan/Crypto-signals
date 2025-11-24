import React from 'react';
import { getSignal } from '../utils/indicators';

const FuturesSignal = ({ data, price }) => {
    if (!data) return null;

    const { rsi, macd, bb, ema50, ema200, obvTrend, nearestSupport, nearestResistance, fearGreed } = data;

    const signal = getSignal(
        parseFloat(rsi),
        fearGreed?.value || 50,
        macd,
        ema50,
        ema200,
        price,
        obvTrend,
        nearestSupport,
        nearestResistance,
        bb
    );

    const getPositionColor = (position) => {
        if (position === 'LONG') return 'from-green-600 to-green-500';
        if (position === 'SHORT') return 'from-red-600 to-red-500';
        return 'from-gray-600 to-gray-500';
    };

    const getRiskColor = (risk) => {
        if (risk === 'HIGH') return 'text-red-400';
        if (risk === 'LOW') return 'text-green-400';
        return 'text-yellow-400';
    };

    return (
        <div className="w-full mb-8">
            {/* Main Signal Card */}
            <div className={`bg-gradient-to-r ${getPositionColor(signal.position)} rounded-2xl p-6 shadow-2xl`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                        <div className="text-white/80 text-sm font-medium mb-1">Futures Trading Signal</div>
                        <div className="text-4xl font-bold text-white mb-2">{signal.type}</div>
                        <div className="text-white/90 text-sm">{signal.reason}</div>
                    </div>

                    <div className="flex flex-col gap-3 bg-black/20 rounded-xl p-4 min-w-[200px]">
                        <div className="flex justify-between items-center">
                            <span className="text-white/70 text-xs">Confidence</span>
                            <span className="text-white font-bold text-lg">{signal.confidence}%</span>
                        </div>
                        <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-500"
                                style={{ width: `${signal.confidence}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Trading Details */}
                {signal.position !== 'NEUTRAL' && (
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-black/20 rounded-lg p-3">
                            <div className="text-white/60 text-xs mb-1">Recommended Leverage</div>
                            <div className="text-white font-bold text-lg">{signal.leverage}</div>
                        </div>

                        {signal.stopLoss && (
                            <div className="bg-black/20 rounded-lg p-3">
                                <div className="text-white/60 text-xs mb-1">Stop Loss</div>
                                <div className="text-white font-bold text-sm">${signal.stopLoss.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                            </div>
                        )}

                        {signal.takeProfit && (
                            <div className="bg-black/20 rounded-lg p-3">
                                <div className="text-white/60 text-xs mb-1">Take Profit</div>
                                <div className="text-white font-bold text-sm">${signal.takeProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                            </div>
                        )}

                        <div className="bg-black/20 rounded-lg p-3">
                            <div className="text-white/60 text-xs mb-1">Risk Level</div>
                            <div className={`font-bold text-lg ${getRiskColor(signal.riskLevel)}`}>{signal.riskLevel}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Market Conditions */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-2">Momentum</div>
                    <div className={`text-xl font-bold ${signal.momentum === 'BULLISH' ? 'text-green-400' :
                            signal.momentum === 'BEARISH' ? 'text-red-400' :
                                'text-gray-400'
                        }`}>
                        {signal.momentum}
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-2">Volatility</div>
                    <div className={`text-xl font-bold ${signal.volatility === 'HIGH' ? 'text-red-400' :
                            signal.volatility === 'LOW' ? 'text-green-400' :
                                'text-yellow-400'
                        }`}>
                        {signal.volatility}
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-2">Signal Score</div>
                    <div className={`text-xl font-bold ${signal.score > 0 ? 'text-green-400' :
                            signal.score < 0 ? 'text-red-400' :
                                'text-gray-400'
                        }`}>
                        {signal.score > 0 ? '+' : ''}{signal.score}
                    </div>
                </div>
            </div>

            {/* Analysis Breakdown */}
            <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-6">
                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Analysis Breakdown
                </h4>
                <div className="space-y-2">
                    {signal.analysis.map((item, index) => (
                        <div key={index} className="text-gray-300 text-sm flex items-start gap-2">
                            <span className="text-accent mt-0.5">•</span>
                            <span>{item}</span>
                        </div>
                    ))}
                </div>

                {signal.riskFactors && signal.riskFactors.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="text-yellow-400 font-semibold text-sm mb-2">⚠️ Risk Factors:</div>
                        <div className="space-y-1">
                            {signal.riskFactors.map((risk, index) => (
                                <div key={index} className="text-gray-400 text-sm flex items-start gap-2">
                                    <span className="text-yellow-400 mt-0.5">▸</span>
                                    <span>{risk}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FuturesSignal;
