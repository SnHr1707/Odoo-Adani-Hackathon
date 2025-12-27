import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, LayoutGrid, List as ListIcon, User, Trash2 } from 'lucide-react';
import { API, AuthContext } from '../../context/AuthContext';

const RequestList = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [viewMode, setViewMode] = useState('kanban'); 
  const [search, setSearch] = useState("");
  const [filterMy, setFilterMy] = useState(false);
  const navigate = useNavigate();

  const STAGES = ["New", "In Progress", "Repaired", "Scrap"];

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = () => {
    API.get('/requests').then(res => setRequests(res.data));
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevent opening the detail view
    if (window.confirm("Are you sure you want to delete this request?")) {
        await API.delete(`/requests/${id}`);
        fetchRequests(); // Refresh list
    }
  };

  // --- Filtering ---
  const filtered = requests.filter(r => {
    const matchesSearch = r.subject.toLowerCase().includes(search.toLowerCase()) || 
                          (r.equipment_name && r.equipment_name.toLowerCase().includes(search.toLowerCase()));
    const matchesUser = filterMy ? r.created_by_id === user.id : true;
    return matchesSearch && matchesUser;
  });

  const renderPriority = (p) => (
    <div className="flex text-yellow-500 text-xs">
      {[...Array(3)].map((_, i) => (
        <span key={i} className={i < p ? "opacity-100" : "opacity-20"}>★</span>
      ))}
    </div>
  );

  const getStageColor = (stage) => {
    switch(stage) {
        case 'New': return 'border-t-4 border-t-blue-500';
        case 'In Progress': return 'border-t-4 border-t-yellow-500';
        case 'Repaired': return 'border-t-4 border-t-green-500';
        case 'Scrap': return 'border-t-4 border-t-red-500';
        default: return 'border-t-4 border-t-gray-500';
    }
  };

  return (
    <div className="p-8 h-full flex flex-col animate-fade-in text-white">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold">Maintenance Requests</h1>
            <div className="text-xs text-gray-500 mt-1">
                {filtered.length} Requests Found
            </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
                <input 
                    type="text" 
                    placeholder="Search..." 
                    className="w-full bg-[#2a2a2a] border border-[#333] pl-10 pr-4 py-2 rounded-lg focus:border-odoo-primary outline-none transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="flex bg-[#2a2a2a] rounded-lg border border-[#333] p-1">
                <button onClick={() => setViewMode('kanban')} className={`p-2 rounded ${viewMode === 'kanban' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>
                    <LayoutGrid size={18} />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>
                    <ListIcon size={18} />
                </button>
            </div>

            <button onClick={() => setFilterMy(!filterMy)} className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${filterMy ? 'bg-odoo-secondary border-odoo-secondary' : 'bg-[#2a2a2a] border-[#333] text-gray-400 hover:text-white'}`}>
                <User size={18} /> <span className="hidden md:inline">My Requests</span>
            </button>
            
            <button onClick={() => navigate('/requests/new')} className="bg-odoo-primary hover:bg-[#5d3b55] px-4 py-2 rounded-lg shadow-md flex items-center gap-2 font-bold whitespace-nowrap">
                <Plus size={18} /> New
            </button>
        </div>
      </div>

      {/* --- KANBAN VIEW --- */}
      {viewMode === 'kanban' && (
        <div className="flex-1 overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-[1000px] h-full">
                {STAGES.map(stage => (
                    <div key={stage} className="flex-1 min-w-[250px] flex flex-col bg-[#1a1a1a] rounded-xl border border-[#333]">
                        <div className="p-3 border-b border-[#333] flex justify-between items-center bg-[#242424] rounded-t-xl">
                            <h3 className="font-bold text-gray-300">{stage}</h3>
                            <span className="bg-gray-700 text-xs px-2 py-0.5 rounded-full text-gray-300">
                                {filtered.filter(r => r.stage === stage).length}
                            </span>
                        </div>
                        <div className="p-2 flex-1 overflow-y-auto space-y-3 bg-[#111]/50">
                            {filtered.filter(r => r.stage === stage).map(req => (
                                <div key={req.id} onClick={() => navigate(`/requests/${req.id}`)} className={`bg-[#242424] p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md hover:bg-[#2a2a2a] transition-all group relative ${getStageColor(stage)}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-sm text-white line-clamp-2">{req.subject}</h4>
                                        {req.priority > 0 && renderPriority(req.priority)}
                                    </div>
                                    <div className="text-xs text-gray-400 mb-3 space-y-1">
                                        <div className="flex items-center gap-1 text-odoo-secondary">
                                            <span className="font-semibold">{req.equipment_name}</span>
                                        </div>
                                        <div className="opacity-75">{req.category}</div>
                                    </div>
                                    <div className="flex justify-between items-center mt-3 border-t border-gray-700 pt-2">
                                        <div className="text-[10px] text-gray-500">{req.request_date || 'No Date'}</div>
                                        <div className="flex items-center gap-2">
                                            {req.technician_name && (
                                                <div className="w-6 h-6 rounded-full bg-blue-900/50 border border-blue-800 flex items-center justify-center text-[10px] text-blue-200" title={`Tech: ${req.technician_name}`}>
                                                    {req.technician_name[0]}
                                                </div>
                                            )}
                                            {/* Delete Button */}
                                            <button onClick={(e) => handleDelete(e, req.id)} className="text-gray-600 hover:text-red-500 p-1">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* --- LIST VIEW --- */}
      {viewMode === 'list' && (
        <div className="bg-[#242424] rounded-xl border border-[#333] flex-1 overflow-hidden shadow-xl">
            <div className="overflow-x-auto h-full">
            <table className="w-full text-left text-sm">
                <thead className="bg-[#1f1f1f] text-gray-400 font-semibold border-b border-[#333]">
                    <tr>
                        <th className="p-4 w-1/3">Subject</th>
                        <th className="p-4">Equipment</th>
                        <th className="p-4">Technician</th>
                        <th className="p-4">Priority</th>
                        <th className="p-4">Stage</th>
                        <th className="p-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#333]">
                    {filtered.map(req => (
                        <tr key={req.id} onClick={() => navigate(`/requests/${req.id}`)} className="hover:bg-[#2a2a2a] cursor-pointer transition-colors">
                            <td className="p-4">
                                <div className="font-bold text-white mb-0.5">{req.subject}</div>
                                <div className="text-xs text-gray-500">Created by: {req.created_by_name}</div>
                            </td>
                            <td className="p-4 text-odoo-secondary">{req.equipment_name}</td>
                            <td className="p-4 text-gray-300">{req.technician_name || '-'}</td>
                            <td className="p-4">{renderPriority(req.priority)}</td>
                            <td className="p-4"><span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-700 text-gray-300">{req.stage}</span></td>
                            <td className="p-4 text-right">
                                <button onClick={(e) => handleDelete(e, req.id)} className="text-gray-500 hover:text-red-400 p-2">
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
        </div>
      )}
    </div>
  );
};

export default RequestList;