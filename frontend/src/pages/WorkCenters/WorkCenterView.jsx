import React, { useState, useEffect, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { API, AuthContext } from '../../context/AuthContext';
import { Plus, Factory, Activity } from 'lucide-react';

const WorkCenterView = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => API.get('/work-centers').then(res => setData(res.data));

  const onSubmit = async (formData) => {
    await API.post('/work-centers', formData);
    setShowModal(false);
    reset();
    fetchData();
  };

  return (
    <div className="p-8 h-full flex flex-col animate-fade-in text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Factory /> Work Centers</h1>
        {user?.role === 'technician' && (
            <button onClick={() => setShowModal(true)} className="bg-odoo-primary hover:bg-[#5d3b55] text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow">
                <Plus size={18} /> New
            </button>
        )}
      </div>

      <div className="bg-[#242424] rounded-lg border border-[#333] overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm">
            <thead className="bg-[#1f1f1f] text-gray-400 font-semibold border-b border-[#333]">
                <tr>
                    <th className="p-4">Work Center</th>
                    <th className="p-4">Code</th>
                    <th className="p-4">Tag</th>
                    <th className="p-4">Cost/Hr</th>
                    <th className="p-4">Capacity</th>
                    <th className="p-4">Efficiency</th>
                    <th className="p-4">OEE Target</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-[#333]">
                {data.map(wc => (
                    <tr key={wc.id} className="hover:bg-[#2a2a2a] transition-colors">
                        <td className="p-4 font-bold text-white">{wc.name}</td>
                        <td className="p-4 text-gray-400">{wc.code}</td>
                        <td className="p-4 text-gray-500">{wc.tag || '-'}</td>
                        <td className="p-4">${wc.cost_per_hour}</td>
                        <td className="p-4">{wc.capacity}</td>
                        <td className="p-4">{wc.time_efficiency}%</td>
                        <td className="p-4 text-odoo-secondary font-bold">{wc.oee_target}%</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <form onSubmit={handleSubmit(onSubmit)} className="bg-[#242424] p-8 rounded-lg w-[600px] border border-[#333] shadow-lg">
                <h2 className="text-xl font-bold text-white mb-6">New Work Center</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div><label className="odoo-label">Name</label><input {...register("name")} className="odoo-input bg-[#1f1f1f] p-2 rounded" /></div>
                    <div><label className="odoo-label">Code</label><input {...register("code")} className="odoo-input bg-[#1f1f1f] p-2 rounded" /></div>
                    <div><label className="odoo-label">Tag</label><input {...register("tag")} className="odoo-input bg-[#1f1f1f] p-2 rounded" /></div>
                    <div><label className="odoo-label">Cost per Hour</label><input type="number" {...register("cost_per_hour")} className="odoo-input bg-[#1f1f1f] p-2 rounded" /></div>
                    <div><label className="odoo-label">Capacity</label><input type="number" {...register("capacity")} defaultValue={1} className="odoo-input bg-[#1f1f1f] p-2 rounded" /></div>
                    <div><label className="odoo-label">Time Efficiency</label><input type="number" {...register("time_efficiency")} defaultValue={100} className="odoo-input bg-[#1f1f1f] p-2 rounded" /></div>
                    <div><label className="odoo-label">OEE Target</label><input type="number" {...register("oee_target")} defaultValue={90} className="odoo-input bg-[#1f1f1f] p-2 rounded" /></div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button type="button" onClick={() => setShowModal(false)} className="bg-gray-700 text-white px-4 py-2 rounded">Cancel</button>
                    <button type="submit" className="bg-odoo-primary text-white px-4 py-2 rounded">Create</button>
                </div>
            </form>
        </div>
      )}
    </div>
  );
};

export default WorkCenterView;