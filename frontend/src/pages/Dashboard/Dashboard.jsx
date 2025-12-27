import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext, API } from '../../context/AuthContext';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/requests').then(res => setRequests(res.data));
  }, []);

  const pending = requests.filter(r => r.stage !== 'Repaired' && r.stage !== 'Scrap');

  return (
    <div className="p-8 animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-odoo-card p-6 rounded-lg border border-red-900/30 shadow-lg">
          <h3 className="text-red-400 font-bold mb-2">Critical Actions</h3>
          <div className="text-4xl font-bold text-white mb-1">3</div>
          <p className="text-xs text-gray-500">Equipment Health &lt; 30%</p>
        </div>
        <div onClick={() => navigate('/requests')} className="bg-odoo-card p-6 rounded-lg border border-green-900/30 shadow-lg cursor-pointer hover:bg-gray-800">
          <h3 className="text-green-400 font-bold mb-2">Open Requests</h3>
          <div className="text-4xl font-bold text-white mb-1">{pending.length}</div>
          <p className="text-xs text-gray-500">{requests.length} Total</p>
        </div>
      </div>
      
      {/* Activity Table */}
      <div className="bg-odoo-card rounded-lg border border-odoo-border overflow-hidden">
        <div className="p-4 border-b border-odoo-border bg-gray-800/50 font-bold">Recent Requests</div>
        <table className="w-full text-left text-sm">
          <thead className="text-gray-500 border-b border-odoo-border">
            <tr>
              <th className="p-3">Subject</th>
              <th className="p-3">Equipment</th>
              <th className="p-3">Technician</th>
              <th className="p-3">Stage</th>
            </tr>
          </thead>
          <tbody>
            {requests.slice(0, 5).map(req => (
              <tr key={req.id} onClick={() => navigate(`/requests/${req.id}`)} className="border-b border-odoo-border hover:bg-gray-800 cursor-pointer">
                <td className="p-3 font-medium text-white">{req.subject}</td>
                <td className="p-3 text-gray-300">{req.equipment_name}</td>
                <td className="p-3 text-gray-400">{req.technician_name || '-'}</td>
                <td className="p-3"><span className="bg-gray-700 px-2 py-1 rounded text-xs">{req.stage}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;