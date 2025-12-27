import React from 'react';

const SmartButton = ({ icon: Icon, label, value, onClick }) => (
  <button onClick={onClick} className="flex items-center bg-gray-800 border border-gray-600 rounded shadow-sm hover:bg-gray-700 transition-colors min-w-[120px] overflow-hidden">
    <div className="p-3 flex items-center justify-center text-odoo-secondary bg-gray-900/50">
      <Icon size={20} />
    </div>
    <div className="flex flex-col items-start border-l border-gray-600 pl-3 py-1 pr-2 w-full">
      <span className="text-lg font-bold leading-none text-white">{value}</span>
      <span className="text-[10px] uppercase text-gray-400 font-semibold">{label}</span>
    </div>
  </button>
);

export default SmartButton;