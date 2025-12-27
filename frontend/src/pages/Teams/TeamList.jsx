import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users as UsersIcon, Settings } from 'lucide-react';
import { API } from '../../context/AuthContext';

const TeamList = () => {
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await API.get('/teams');
      setTeams(res.data);
    } catch (error) {
      console.error("Failed to fetch teams:", error);
    }
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(search.toLowerCase()) ||
    team.category_name.toLowerCase().includes(search.toLowerCase()) ||
    team.technician_names.some(name => name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-8 h-full flex flex-col animate-fade-in text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Maintenance Teams</h1>
        <div className="flex items-center gap-4">
            <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
                <input 
                    type="text" 
                    placeholder="Search teams..." 
                    className="w-full bg-[#2a2a2a] border border-[#333] pl-10 pr-4 py-2 rounded-lg focus:border-odoo-primary outline-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <button 
                onClick={() => navigate('/teams/new')} 
                className="bg-odoo-primary hover:bg-[#5d3b55] text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2"
            >
                <Plus size={18} /> New Team
            </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#242424] rounded-xl border border-[#333] flex-1 overflow-hidden shadow-xl">
        <div className="overflow-x-auto h-full">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1f1f1f] text-gray-400 font-semibold border-b border-[#333]">
                <tr>
                    <th className="p-4 w-1/4">Team Name</th>
                    <th className="p-4 w-1/4">Category</th>
                    <th className="p-4 w-2/4">Technicians</th>
                    <th className="p-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-[#333]">
                {filteredTeams.length === 0 ? (
                    <tr>
                        <td colSpan="4" className="p-8 text-center text-gray-500 italic">No teams found.</td>
                    </tr>
                ) : filteredTeams.map(team => (
                    <tr key={team.id} onClick={() => navigate(`/teams/${team.id}`)} className="hover:bg-[#2a2a2a] cursor-pointer transition-colors group">
                        <td className="p-4 font-bold text-odoo-primary">{team.name}</td>
                        <td className="p-4">
                            <span className="px-2 py-1 bg-gray-700 rounded text-xs">{team.category_name}</span>
                        </td>
                        <td className="p-4 flex flex-wrap gap-2">
                            {team.technician_names.length === 0 ? (
                                <span className="text-gray-500 italic">No technicians</span>
                            ) : (
                                team.technician_names.map(name => (
                                    <span key={name} className="flex items-center gap-1 bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded-full text-xs">
                                        <UsersIcon size={12} /> {name}
                                    </span>
                                ))
                            )}
                        </td>
                        <td className="p-4 text-right">
                             <span className="text-gray-500 group-hover:text-odoo-primary text-xs">Edit &rarr;</span>
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

export default TeamList;