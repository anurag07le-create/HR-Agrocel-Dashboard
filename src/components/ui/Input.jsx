import React from 'react';

const Input = ({ label, type, icon: Icon, placeholder, value, onChange, suffix }) => {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
            <div className="relative group">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        {/* Handle both Image URL (string) and Component (Lucide) */}
                        {typeof Icon === 'string' ? (
                            <img src={Icon} alt={label} className="h-5 w-5 opacity-50 group-focus-within:opacity-100 transition-opacity" />
                        ) : (
                            <Icon className="h-5 w-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                        )}
                    </div>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    className={`block w-full pl-11 ${suffix ? 'pr-12' : 'pr-4'} py-3.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition-all outline-none placeholder-gray-400`}
                    placeholder={placeholder}
                    required
                />
                {suffix && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                        {suffix}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Input;
