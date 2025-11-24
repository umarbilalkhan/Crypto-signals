import React, { useEffect } from 'react';

const Notification = ({ message, type = 'info', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);

        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColors = {
        success: 'bg-green-500/20 border-green-500/50 text-green-200',
        error: 'bg-red-500/20 border-red-500/50 text-red-200',
        info: 'bg-blue-500/20 border-blue-500/50 text-blue-200',
    };

    return (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-xl border backdrop-blur-md shadow-2xl animate-slide-in ${bgColors[type]}`}>
            <div className={`w-2 h-2 rounded-full ${type === 'success' ? 'bg-green-400' : type === 'error' ? 'bg-red-400' : 'bg-blue-400'} animate-pulse`}></div>
            <span className="font-medium">{message}</span>
            <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100 transition">
                ✕
            </button>
        </div>
    );
};

export default Notification;
