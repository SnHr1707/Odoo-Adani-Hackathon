import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, LayoutGrid, List as ListIcon, User, Trash2, Factory, Monitor } from 'lucide-react';
import { API, AuthContext } from '../../context/AuthContext';

const RequestList = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [viewMode, setViewMode] = useState('kanban'); 
  const [search, setSearch] = useState("");
  const [filterMy, setFilterMy] = useState(false); 
  const [draggedId, setDraggedId] = useState(null);
  const navigate = useNavigate();

  const STAGES = ["New", "In Progress", "Repaired", "Scrap"];
  const isTech = user?.role === 'technician';

  useEffect(() => {
    fetchRequests();
  }, [filterMy, user]);

  const fetchRequests = async () => {
    try {
      const res = await API.get('/requests');
      let data = res.data;

      // --- NEW VISIBILITY LOGIC ---
      if (isTech) {
          data = data.filter(req => {
              // 1. ALWAYS show Work Center requests (Global visibility)
              if (req.work_center_id || req.work_center_name) return true;

              // 2. ALWAYS show requests assigned specifically to this technician
              if (req.technician_id === user.id) return true;

              // 3. For Equipment Requests: Show ONLY if matches Tech's Team
              if (req.maintenance_team_id && user.team_id) {
                  return req.maintenance_team_id === user.team_id;
              }

              return false; // Hide equipment requests if no team match
          });
      } 
      else if (user?.role === 'user') {
          // Users only see what they created
          data = data.filter(req => req.created_by_id === user.id);
      }

      // "My Requests" Toggle (Further filters the allowed list)
      if (filterMy) {
        data = data.filter(req => req.created_by_id === user.id || req.technician_id === user.id);
      }

      setRequests(data);
    } catch (error) {
      console.error("Failed to fetch requests", error);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!isTech) return;
    if (window.confirm("Delete this request?")) {
        await API.delete(`/requests/${id}`);
        fetchRequests();
    }
  };

  // --- DRAG AND DROP ---
  const handleDragStart = (e, id) => {
      setDraggedId(id);
      e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = async (e, newStage) => {
      e.preventDefault();
      if (!draggedId) return;
      const updatedRequests = requests.map(r => r.id === draggedId ? { ...r, stage: newStage } : r);
      setRequests(updatedRequests);
      try { await API.put(`/requests/${draggedId}`, { stage: newStage }); } 
      catch (err) { fetchRequests(); }
      setDraggedId(null);
  };

  const filtered = requests.filter(r => 
    r.subject.toLowerCase().includes(search.toLowerCase()) || 
    (r.target_name && r.target_name.toLowerCase().includes(search.toLowerCase()))
  );

  const renderPriority = (p) => (<div className="flex text-yellow-500 text-xs">{[...Array(3)].map((_, i) => <span key={i} className={i < p ? "opacity-100" : "opacity-20"}>★</span>)}</div>);
  
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
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold">Maintenance Requests</h1>
            <div className="text-xs text-gray-500 mt-1">
                {isTech ? 'Showing Team Equipment & All Work Centers' : 'Your Requests'}
            </div>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
                <input type="text" placeholder="Search..." className="w-full bg-[#2a2a2a] border border-[#333] pl-10 pr-4 py-2 rounded-lg outline-none" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex bg-[#2a2a2a] rounded-lg border border-[#333] p-1">
                <button onClick={() => setViewMode('kanban')} className={`p-2 rounded ${viewMode === 'kanban' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}><LayoutGrid size={18} /></button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}><ListIcon size={18} /></button>
            </div>
            <button onClick={() => setFilterMy(!filterMy)} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${filterMy ? 'bg-odoo-secondary border-odoo-secondary' : 'bg-[#2a2a2a] border-[#333] text-gray-400'}`}>
                <User size={18} /> <span className="hidden md:inline">Me</span>
            </button>
            <button onClick={() => navigate('/requests/new')} className="bg-odoo-primary hover:bg-[#5d3b55] px-4 py-2 rounded-lg shadow-md flex items-center gap-2 font-bold">
                <Plus size={18} /> New
            </button>
        </div>
      </div>

      {viewMode === 'kanban' && (
        <div className="flex-1 overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-[1000px] h-full">
                {STAGES.map(stage => (
                    <div key={stage} onDragOver={handleDragOver} onDrop={(e) => isTech && handleDrop(e, stage)} className="flex-1 min-w-[250px] flex flex-col bg-[#1a1a1a] rounded-xl border border-[#333]">
                        <div className="p-3 border-b border-[#333] flex justify-between items-center bg-[#242424] rounded-t-xl">
                            <h3 className="font-bold text-gray-300">{stage}</h3>
                            <span className="bg-gray-700 text-xs px-2 py-0.5 rounded-full text-gray-300">{filtered.filter(r => r.stage === stage).length}</span>
                        </div>
                        <div className="p-2 flex-1 overflow-y-auto space-y-3 bg-[#111]/50">
                            {filtered.filter(r => r.stage === stage).map(req => (
                                <div key={req.id} draggable={isTech} onDragStart={(e) => handleDragStart(e, req.id)} onClick={() => navigate(`/requests/${req.id}`)} className={`bg-[#242424] p-4 rounded-lg shadow-sm cursor-pointer hover:bg-[#2a2a2a] group ${getStageColor(stage)}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-sm text-white line-clamp-2">{req.subject}</h4>
                                        {req.priority > 0 && renderPriority(req.priority)}
                                    </div>
                                    <div className="text-xs text-gray-400 mb-3 space-y-1">
                                        {req.work_center_id ? (
                                            <div className="text-odoo-primary font-bold flex items-center gap-1"><Factory size={12}/> {req.work_center_name}</div>
                                        ) : (
                                            <div className="text-odoo-secondary font-semibold flex items-center gap-1"><Monitor size={12}/> {req.equipment_name}</div>
                                        )}
                                        <div className="opacity-75">{req.category}</div>
                                    </div>
                                    <div className="flex justify-between items-center mt-3 border-t border-gray-700 pt-2 text-[10px] text-gray-500">
                                        <div>{req.request_date}</div>
                                        {req.technician_name && <div className="w-5 h-5 bg-blue-900 rounded-full flex items-center justify-center text-white">{req.technician_name[0]}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="bg-[#242424] rounded-xl border border-[#333] flex-1 overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm">
                <thead className="bg-[#1f1f1f] text-gray-400 font-semibold border-b border-[#333]">
                    <tr><th className="p-4">Subject</th><th className="p-4">Target</th><th className="p-4">Technician</th><th className="p-4">Priority</th><th className="p-4">Stage</th></tr>
                </thead>
                <tbody className="divide-y divide-[#333]">
                    {filtered.map(req => (
                        <tr key={req.id} onClick={() => navigate(`/requests/${req.id}`)} className="hover:bg-[#2a2a2a] cursor-pointer">
                            <td className="p-4 font-bold text-white">{req.subject}</td>
                            <td className="p-4">
                                {req.work_center_id ? 
                                    <span className="text-odoo-primary flex items-center gap-2"><Factory size={14}/> {req.work_center_name}</span> : 
                                    <span className="text-odoo-secondary flex items-center gap-2"><Monitor size={14}/> {req.equipment_name}</span>
                                }
                            </td>
                            <td className="p-4 text-gray-300">{req.technician_name || '-'}</td>
                            <td className="p-4">{renderPriority(req.priority)}</td>
                            <td className="p-4"><span className="px-2 py-1 rounded-full text-xs bg-gray-700 text-gray-300">{req.stage}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}
    </div>
  );
};

export default RequestList;