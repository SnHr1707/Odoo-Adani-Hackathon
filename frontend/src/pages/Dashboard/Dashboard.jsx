import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext, API } from '../../context/AuthContext';
import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/requests').then(res => {
      let data = res.data;
      // --- FILTER LOGIC (Same as RequestList) ---
      if (user?.role === 'technician') {
          if (user?.team_id) data = data.filter(req => req.maintenance_team_id === user.team_id);
          else data = [];
      } else if (user?.role === 'user') {
          data = data.filter(req => req.created_by_id === user.id);
      }
      setRequests(data);
    });
  }, [user]);

  const pending = requests.filter(r => r.stage !== 'Repaired' && r.stage !== 'Scrap');
  const critical = requests.filter(r => r.priority === 3 && r.stage !== 'Repaired');

  return (
    <div className="p-8 animate-fade-in text-white">
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#242424] p-6 rounded-lg border border-red-900/50 shadow-lg">
          <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2"><AlertTriangle size={20}/> Critical Actions</h3>
          <div className="text-4xl font-bold text-white mb-1">{critical.length}</div>
          <p className="text-xs text-gray-500">High Priority Pending</p>
        </div>
        <div className="bg-[#242424] p-6 rounded-lg border border-blue-900/50 shadow-lg">
          <h3 className="text-blue-400 font-bold mb-2 flex items-center gap-2"><Activity size={20}/> Total Activity</h3>
          <div className="text-4xl font-bold text-white mb-1">{requests.length}</div>
          <p className="text-xs text-gray-500">All Time Requests</p>
        </div>
        <div 
          onClick={() => navigate('/requests')} 
          className="bg-[#242424] p-6 rounded-lg border border-green-900/50 shadow-lg cursor-pointer hover:bg-[#2a2a2a] transition"
        >
          <h3 className="text-green-400 font-bold mb-2 flex items-center gap-2"><Clock size={20}/> Open Requests</h3>
          <div className="text-4xl font-bold text-white mb-1">{pending.length}</div>
          <p className="text-xs text-gray-500">{pending.filter(r => r.stage==='New').length} New</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#242424] rounded-lg border border-[#333] overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#333] bg-[#1f1f1f] font-bold">Recent Requests</div>
        <table className="w-full text-left text-sm">
          <thead className="text-gray-500 border-b border-[#333]">
            <tr>
              <th className="p-4">Subject</th>
              <th className="p-4">Equipment</th>
              <th className="p-4">Stage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#333]">
            {requests.slice(0, 5).map(req => (
              <tr key={req.id} onClick={() => navigate(`/requests/${req.id}`)} className="hover:bg-[#2a2a2a] cursor-pointer">
                <td className="p-4 font-medium">{req.subject}</td>
                <td className="p-4 text-odoo-secondary">{req.equipment_name}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs border ${
                    req.stage === 'New' ? 'bg-blue-900/30 border-blue-800 text-blue-300' :
                    req.stage === 'In Progress' ? 'bg-yellow-900/30 border-yellow-800 text-yellow-300' :
                    req.stage === 'Repaired' ? 'bg-green-900/30 border-green-800 text-green-300' :
                    'bg-red-900/30 border-red-800 text-red-300'
                    
                  }`}>{req.stage}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;