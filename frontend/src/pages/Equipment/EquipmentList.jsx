import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Trash2, Monitor, Server } from 'lucide-react';
import { API } from '../../context/AuthContext';

const EquipmentList = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/equipment').then(res => setData(res.data));
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if(window.confirm("Are you sure? This will delete the equipment and all associated maintenance requests.")) {
        try {
            await API.delete(`/equipment/${id}`);
            setData(data.filter(item => item.id !== id));
        } catch (err) { alert("Error deleting equipment."); console.error(err); }
    }
  };

  const filtered = data.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    e.serial_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 h-full flex flex-col animate-fade-in text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Equipment</h1>
        <div className="flex items-center gap-4">
            <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
                <input 
                    type="text" 
                    placeholder="Search equipment..." 
                    className="w-full bg-[#2a2a2a] border border-[#333] pl-10 pr-4 py-2 rounded-lg focus:border-odoo-primary outline-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <button 
                onClick={() => navigate('/equipment/new')} 
                className="bg-odoo-primary hover:bg-[#5d3b55] text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2"
            >
                <Plus size={18} /> New Equipment
            </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#242424] rounded-xl border border-[#333] flex-1 overflow-hidden shadow-xl">
        <div className="overflow-x-auto h-full">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1f1f1f] text-gray-400 font-semibold border-b border-[#333]">
                <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Serial No</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Assigned To</th>
                    <th className="p-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-[#333]">
                {filtered.map(e => (
                    <tr key={e.id} onClick={() => navigate(`/equipment/${e.id}`)} className="hover:bg-[#2a2a2a] cursor-pointer transition-colors group">
                        <td className="p-4 font-bold text-white">{e.name}</td>
                        <td className="p-4 text-gray-400 font-mono text-xs">{e.serial_number}</td>
                        <td className="p-4"><span className="px-2 py-1 bg-gray-700 rounded text-xs">{e.category}</span></td>
                        <td className="p-4">{e.department}</td>
                        <td className="p-4 text-odoo-secondary">{e.used_by || '-'}</td>
                        <td className="p-4 text-right">
                             <button onClick={(ev) => handleDelete(ev, e.id)} className="text-gray-500 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={16} />
                            </button>
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