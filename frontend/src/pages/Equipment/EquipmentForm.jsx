import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { AuthContext, API } from '../../context/AuthContext';
import { Calendar, CheckCircle, Clock } from 'lucide-react';

const RequestForm = () => {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [equipments, setEquipments] = useState([]);

  // Check Role
  const isTech = user?.role === 'technician';

  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      stage: 'New',
      priority: 1,
      created_by_name: user?.name,
      created_by_id: user?.id,
      request_date: new Date().toISOString().split('T')[0],
      duration: 0,
      type: "Corrective"
    }
  });

  const currentStage = watch("stage");
  const watchedEqId = watch("equipment_id");
  const watchedScheduledDate = watch("scheduled_date");

  useEffect(() => {
    API.get('/equipment').then(res => setEquipments(res.data));
    if (!isNew) {
      API.get(`/requests/${id}`).then(res => reset(res.data));
    }
  }, [id, isNew, reset]);

  // Auto-fill Logic
  useEffect(() => {
    if (isNew && watchedEqId) {
        const eq = equipments.find(e => e.id === watchedEqId);
        if (eq) {
            setValue("category", eq.category);
            setValue("maintenance_team", eq.maintenance_team);
        }
    }
  }, [watchedEqId, isNew]);

  const onSubmit = async (data) => {
    const payload = {
        ...data,
        priority: parseInt(data.priority),
        duration: parseFloat(data.duration),
    };
    
    // Safety: If user is creating, force stage to New
    if (!isTech && isNew) {
        payload.stage = "New";
        payload.technician_id = null;
        payload.scheduled_date = null;
    }

    try {
        if (isNew) {
            const res = await API.post('/requests', payload);
            navigate(`/requests/${res.data.id}`);
        } else {
            await API.put(`/requests/${id}`, payload);
            alert("Updated Successfully");
        }
    } catch (e) { alert("Error saving"); }
  };

  // --- TECHNICIAN ACTIONS ---
  
  const handleSchedule = async () => {
      if (!watchedScheduledDate) return alert("Please select a date first");
      
      setValue("stage", "In Progress");
      setValue("technician_name", user.name);
      setValue("technician_id", user.id);
      
      await API.put(`/requests/${id}`, {
          stage: "In Progress",
          technician_name: user.name,
          technician_id: user.id,
          scheduled_date: watchedScheduledDate
      });
      alert("Scheduled & Accepted!");
  };

  const handleMarkRepaired = async () => {
      setValue("stage", "Repaired");
      await API.put(`/requests/${id}`, { stage: "Repaired" });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-400">
             <span onClick={() => navigate('/requests')} className="cursor-pointer hover:text-white">Maintenance</span>
             <span className="mx-2">/</span>
             <span className="text-white font-bold">{isNew ? "New Request" : watch("subject")}</span>
        </div>
        
        {/* Status Badge */}
        <div className={`px-4 py-1 rounded-full text-sm font-bold border ${
            currentStage === 'New' ? 'bg-blue-900/30 text-blue-300 border-blue-800' :
            currentStage === 'In Progress' ? 'bg-yellow-900/30 text-yellow-300 border-yellow-800' :
            'bg-green-900/30 text-green-300 border-green-800'
        }`}>
            {currentStage}
        </div>
      </div>

      <div className="bg-odoo-card rounded-lg shadow-lg border border-odoo-border overflow-hidden">
        
        {/* ACTION BAR (Dynamic based on Role) */}
        <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
            <div>
                {/* Save Button (Always visible) */}
                <button onClick={handleSubmit(onSubmit)} className="bg-odoo-primary hover:bg-[#5d3b55] text-white px-6 py-1.5 rounded mr-4">
                    {isNew ? 'Create Request' : 'Save Changes'}
                </button>

                {/* Technician Actions */}
                {!isNew && isTech && currentStage === 'New' && (
                    <button onClick={handleSchedule} className="bg-odoo-secondary hover:bg-teal-700 text-white px-4 py-1.5 rounded flex items-center gap-2 inline-flex">
                        <Calendar size={16}/> Accept & Schedule
                    </button>
                )}
                {!isNew && isTech && currentStage === 'In Progress' && (
                     <button onClick={handleMarkRepaired} className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded flex items-center gap-2 inline-flex">
                        <CheckCircle size={16}/> Mark Repaired
                    </button>
                )}
            </div>
            
            {/* Visual Steps */}
            <div className="flex text-xs text-gray-400 gap-1">
                {["New", "In Progress", "Repaired"].map((s, i) => (
                    <div key={s} className={`px-3 py-1 rounded ${currentStage===s ? 'bg-gray-200 text-black font-bold' : 'bg-gray-700'}`}>
                        {s}
                    </div>
                ))}
            </div>
        </div>

        <div className="p-8">
            <input 
                {...register("subject")} 
                disabled={!isNew && !isTech && user.id !== watch("created_by_id")} // Only creator or Tech can edit subject
                className="text-3xl bg-transparent border-none outline-none text-white font-bold w-full mb-8 placeholder-gray-600" 
                placeholder="Subject..." 
            />
            
            <div className="grid grid-cols-2 gap-12 text-sm">
                <div className="space-y-6">
                    <div>
                        <label className="odoo-label">Equipment</label>
                        <select {...register("equipment_id")} disabled={!isNew} className="odoo-input bg-[#2a2a2a] p-2 rounded">
                            <option value="">Select Equipment...</option>
                            {equipments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="odoo-label">Type</label>
                        <div className="flex gap-4 mt-2">
                             <label><input type="radio" value="Corrective" {...register("type")} disabled={!isNew} className="mr-2"/> Corrective</label>
                             <label><input type="radio" value="Preventive" {...register("type")} disabled={!isNew} className="mr-2"/> Preventive</label>
                        </div>
                    </div>
                     <div>
                        <label className="odoo-label">Created By</label>
                        <input {...register("created_by_name")} disabled className="odoo-input text-gray-500" />
                     </div>
                </div>

                <div className="space-y-6 bg-gray-800/30 p-4 rounded border border-gray-700/50">
                     <h3 className="text-odoo-secondary font-bold uppercase text-xs mb-2 flex items-center gap-2">
                        <Clock size={14}/> Technician Zone
                     </h3>
                     
                     <div>
                        <label className="odoo-label">Assigned Technician</label>
                        <input {...register("technician_name")} disabled className="odoo-input text-gray-400" placeholder="Waiting for assignment..." />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="odoo-label text-odoo-secondary">Scheduled Date</label>
                            <input 
                                type="datetime-local" 
                                {...register("scheduled_date")} 
                                disabled={!isTech} 
                                className={`odoo-input ${!isTech ? 'text-gray-500' : 'bg-gray-800'}`} 
                            />
                        </div>
                        <div>
                            <label className="odoo-label">Duration (Hrs)</label>
                            <input 
                                type="number" step="0.5" 
                                {...register("duration")} 
                                disabled={!isTech}
                                className="odoo-input" 
                            />
                        </div>
                     </div>

                     <div>
                        <label className="odoo-label">Priority</label>
                        <select {...register("priority")} disabled={!isTech} className="odoo-input bg-[#2a2a2a] p-2 rounded">
                            <option value="1">Low</option>
                            <option value="2">Medium</option>
                            <option value="3">High</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-700">
                <label className="odoo-label mb-2">Notes</label>
                <textarea {...register("notes")} className="w-full bg-[#1f1f1f] p-4 rounded border border-gray-700 outline-none h-24 text-gray-300" placeholder="Internal notes..."/>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RequestForm;