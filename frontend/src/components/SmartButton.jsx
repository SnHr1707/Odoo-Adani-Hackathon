import React from 'react';

const SmartButton = ({ icon: Icon, label, value, onClick }) => (
  <button 
    type="button" 
    onClick={onClick} 
    className="flex items-center bg-[#2a2a2a] border border-[#444] rounded shadow-sm hover:bg-[#333] transition-colors min-w-[140px] overflow-hidden"
  >
    <div className="p-3 flex items-center justify-center text-odoo-secondary bg-[#1f1f1f] border-r border-[#444]">
      <Icon size={20} />
    </div>
    <div className="flex flex-col items-start pl-3 py-1 pr-3 w-full">
      <span className="text-xl font-bold leading-none text-white">{value}</span>
      <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">{label}</span>
    </div>
  </button>
);

export default SmartButton;