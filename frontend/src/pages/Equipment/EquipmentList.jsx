import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Monitor, Server, Wrench } from 'lucide-react'; // Icons for visual flair
import { API } from '../../context/AuthContext';

const EquipmentList = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // Fetch data on load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get('/equipment');
        setData(res.data);
      } catch (error) {
        console.error("Failed to load equipment", error);
      }
    };
    fetchData();
  }, []);

  // Filter logic
  const filtered = data.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    e.serial_number.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 h-full flex flex-col animate-fade-in">
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Equipment</h1>
        
        <div className="flex items-center gap-4 w-1/2 justify-end">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md group">
                <Search className="absolute left-3 top-2.5 text-gray-500 group-focus-within:text-odoo-primary transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder="Search name, serial, category..." 
                    className="w-full bg-odoo-card border border-odoo-border pl-10 pr-4 py-2 rounded-lg text-white focus:border-odoo-primary outline-none transition-all shadow-sm focus:shadow-md"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            
            {/* New Button */}
            <button 
                onClick={() => navigate('/equipment/new')} 
                className="bg-odoo-primary hover:bg-[#5d3b55] text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2 transition-transform active:scale-95"
            >
                <Plus size={18} /> New
            </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-odoo-card rounded-xl border border-odoo-border flex-1 overflow-hidden shadow-xl">
        <div className="overflow-x-auto h-full">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1f1f1f] text-gray-400 font-semibold border-b border-odoo-border sticky top-0 z-10">
                <tr>
                    <th className="p-4 w-1/4">Equipment Name</th>
                    <th className="p-4">Assigned To</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Serial Number</th>
                    <th className="p-4">Category</th>
                    <th className="p-4 text-right">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-odoo-border">
                {filtered.length === 0 ? (
                    <tr>
                        <td colSpan="6" className="p-8 text-center text-gray-500 italic">No equipment found.</td>
                    </tr>
                ) : filtered.map(e => (
                    <tr 
                        key={e.id} 
                        onClick={() => navigate(`/equipment/${e.id}`)} 
                        className="hover:bg-gray-800/50 cursor-pointer transition-colors group"
                    >
                        <td className="p-4">
                            <div className="font-bold text-white group-hover:text-odoo-secondary transition-colors">{e.name}</div>
                            <div className="text-xs text-gray-500">{e.company}</div>
                        </td>
                        <td className="p-4">
                            {e.used_by ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-900/50 text-blue-200 flex items-center justify-center text-xs font-bold">
                                        {e.used_by[0]}
                                    </div>
                                    {e.used_by}
                                </span>
                            ) : <span className="text-gray-600">-</span>}
                        </td>
                        <td className="p-4 text-gray-400">{e.department || 'Admin'}</td>
                        <td className="p-4 font-mono text-xs text-gray-500 bg-gray-900/30 rounded w-fit px-2 py-1">{e.serial_number}</td>
                        <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                                {e.category === 'Computers' ? <Monitor size={12}/> : <Server size={12}/>}
                                {e.category}
                            </span>
                        </td>
                        <td className="p-4 text-right">
                             <span className="text-gray-500 group-hover:text-odoo-primary text-xs">View &rarr;</span>
                        </td>
                    </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EquipmentList;