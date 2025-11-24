import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AllCoinsSignal from './AllCoinsSignal';

const COINS = [
    { id: 'bitcoin', symbol: 'btcusdt', name: 'Bitcoin', short: 'BTC' },
    { id: 'ethereum', symbol: 'ethusdt', name: 'Ethereum', short: 'ETH' },
    { id: 'solana', symbol: 'solusdt', name: 'Solana', short: 'SOL' },
];

const Dashboard = () => {
    const [showAllSignals, setShowAllSignals] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-black flex flex-col items-center justify-center px-4">
            {/* Hero Section */}
            <div className="max-w-4xl w-full text-center space-y-8">
                {/* Logo/Icon */}
                <div className="flex justify-center mb-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-accent to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <div className="space-y-4">
                    <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
                        Crypto Signals
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
                        Real-time technical analysis for Bitcoin, Ethereum, and Solana
                    </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                    <Link
                        to="/indicators"
                        className="group relative px-8 py-4 bg-gradient-to-r from-accent to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all hover:scale-105"
                    >
                        <span className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            View Technical Indicators
                        </span>
                    </Link>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
                        <div className="text-accent text-3xl mb-3">📊</div>
                        <h3 className="text-white font-bold text-lg mb-2">Advanced Indicators</h3>
                        <p className="text-gray-400 text-sm">RSI, MACD, Bollinger Bands, EMA, and more</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
                        <div className="text-accent text-3xl mb-3">⚡</div>
                        <h3 className="text-white font-bold text-lg mb-2">Real-Time Data</h3>
                        <p className="text-gray-400 text-sm">Live price updates via WebSocket connections</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
                        <div className="text-accent text-3xl mb-3">🎯</div>
                        <h3 className="text-white font-bold text-lg mb-2">Trading Signals</h3>
                        <p className="text-gray-400 text-sm">AI-powered LONG/SHORT recommendations</p>
                    </div>
                </div>

                {/* Footer Note */}
                <div className="pt-12 text-gray-500 text-sm">
                    <p>Data sourced from CoinGecko, Binance, and Alternative.me</p>
                </div>
            </div>

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

export default Dashboard;
