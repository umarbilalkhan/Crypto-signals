import React from 'react';

const PriceCard = ({ price, change24h, name, symbol }) => {
    const isPositive = change24h >= 0;

    return (
        <div className="glass-card flex flex-col items-center justify-center p-8 min-w-[300px]">
            <h2 className="text-2xl font-bold text-gray-300 mb-2">{name} ({symbol})</h2>
            <div className="text-5xl font-extrabold text-white mb-4">
                ${price ? price.toLocaleString() : '---'}
            </div>
            <div
                className={`text-lg font-semibold px-4 py-1 rounded-full ${isPositive ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
                    }`}
            >
                {change24h ? `${isPositive ? '+' : ''}${change24h.toFixed(2)}%` : '---'}
            </div>
        </div>
    );
};

export default PriceCard;
