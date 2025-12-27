import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { AuthContext, API } from '../../context/AuthContext';
import { Calendar, CheckCircle, Clock, AlertTriangle, Monitor, Factory } from 'lucide-react';

const RequestForm = () => {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation(); 
  const [equipments, setEquipments] = useState([]);
  const [workCenters, setWorkCenters] = useState([]);
  const [targetType, setTargetType] = useState('equipment'); // 'equipment' or 'work_center'
  
  const isTech = user?.role === 'technician';
  const prefillDate = location.state?.prefillDate;

  const { register, handleSubmit, watch, setValue, reset, getValues, formState: { errors } } = useForm({
    defaultValues: {
      stage: 'New',
      priority: 1,
      created_by_name: user?.name,
      created_by_id: user?.id,
      request_date: prefillDate ? prefillDate.split('T')[0] : new Date().toISOString().split('T')[0],
      scheduled_date: isTech && prefillDate ? prefillDate : "", 
      duration: 0,
      type: "Corrective"
    }
  });

  const currentStage = watch("stage");
  const watchedEqId = watch("equipment_id");
  const watchedScheduledDate = watch("scheduled_date");

  useEffect(() => {
    API.get('/equipment').then(res => setEquipments(res.data));
    API.get('/work-centers').then(res => setWorkCenters(res.data));
    
    if (!isNew) {
      API.get(`/requests/${id}`).then(res => {
        reset(res.data);
        if (res.data.work_center_id) setTargetType('work_center');
        else setTargetType('equipment');
      });
    }
  }, [id, isNew, reset]);

  // Auto-fill Equipment Details
  useEffect(() => {
    if (isNew && targetType === 'equipment' && watchedEqId) {
        const eq = equipments.find(e => e.id === watchedEqId);
        if (eq) {
            setValue("category", eq.category || "-");
            setValue("maintenance_team", eq.maintenance_team || "-");
            setValue("maintenance_team_id", eq.maintenance_team_id);
        }
    }
  }, [watchedEqId, isNew, targetType, equipments, setValue]);

  const onSubmit = async (data) => {
    // Clear the non-selected type
    if (targetType === 'equipment') data.work_center_id = null;
    if (targetType === 'work_center') data.equipment_id = null;

    const payload = { ...data, priority: parseInt(data.priority), duration: parseFloat(data.duration) };
    if (!isTech && isNew) payload.stage = "New";

    try {
        if (isNew) {
            const res = await API.post('/requests', payload);
            navigate(`/requests/${res.data.id}`);
        } else {
            await API.put(`/requests/${id}`, payload);
            alert("Updated Successfully");
        }
    } catch (e) { alert("Error: " + e.response?.data?.detail); }
  };

  // --- ACTIONS ---
  const handleSchedule = async () => {
      if (!watchedScheduledDate) return alert("Please set a Scheduled Date first.");
      setValue("stage", "In Progress");
      setValue("technician_name", user.name);
      setValue("technician_id", user.id);
      await API.put(`/requests/${id}`, {
          stage: "In Progress",
          technician_name: user.name,
          technician_id: user.id,
          scheduled_date: watchedScheduledDate
      });
      alert("Request Accepted & Scheduled!");
  };

  const handleMarkRepaired = async () => {
      setValue("stage", "Repaired");
      await API.put(`/requests/${id}`, { stage: "Repaired" });
  };

  const handleScrap = async () => {
      const reason = window.prompt("SCRAP REASON:\nWhy is this equipment being scrapped?");
      if (!reason) return; 
      const currentNotes = getValues("notes") || "";
      const newNotes = `${currentNotes}\n\n[SCRAPPED by ${user?.name} on ${new Date().toLocaleDateString()}]: ${reason}`;
      setValue("stage", "Scrap");
      setValue("notes", newNotes);
      await API.put(`/requests/${id}`, { stage: "Scrap", notes: newNotes });
      alert("Request marked as Scrapped.");
  };

  if (!user) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl text-gray-400">Request / <span className="text-white font-bold">{isNew ? "New" : watch("subject")}</span></h1>
        <div className="px-4 py-1 rounded-full text-sm font-bold border border-blue-800 bg-blue-900/30 text-blue-300">{currentStage}</div>
      </div>

      <div className="bg-[#242424] rounded-lg shadow-lg border border-[#333] overflow-hidden">
        {/* Action Bar */}
        <div className="p-4 bg-[#1f1f1f] border-b border-[#333] flex justify-between items-center">
            <div className="flex gap-3">
                <button onClick={handleSubmit(onSubmit)} className="bg-odoo-primary hover:bg-[#5d3b55] text-white px-6 py-1.5 rounded shadow">{isNew ? 'Create' : 'Save'}</button>
                {!isNew && isTech && currentStage === 'New' && (
                    <button onClick={handleSchedule} className="bg-odoo-secondary hover:bg-teal-700 text-white px-4 py-1.5 rounded flex items-center gap-2 shadow"><Calendar size={16}/> Accept & Schedule</button>
                )}
                {!isNew && isTech && currentStage === 'In Progress' && (
                     <button onClick={handleMarkRepaired} className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded flex items-center gap-2 shadow"><CheckCircle size={16}/> Mark Repaired</button>
                )}
                {!isNew && isTech && currentStage !== 'Scrap' && (
                    <button onClick={handleScrap} className="bg-red-900/20 hover:bg-red-900/50 text-red-400 border border-red-900 px-4 py-1.5 rounded flex items-center gap-2 shadow ml-2"><AlertTriangle size={16}/> Scrap</button>
                )}
            </div>
        </div>

        <div className="p-8">
            <input {...register("subject", { required: true })} className="text-3xl bg-transparent border-none outline-none text-white font-bold w-full mb-6 placeholder-gray-600 focus:ring-0" placeholder="Subject..." />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-sm">
                <div className="space-y-6">
                    {/* TARGET TOGGLE */}
                    <div className="flex items-center gap-4 mb-2">
                        <label className="text-gray-400 text-xs font-bold uppercase">Target:</label>
                        <div className="flex bg-[#1a1a1a] rounded p-1 border border-[#444]">
                            <button 
                                type="button"
                                onClick={() => { setTargetType('equipment'); setValue('work_center_id', null); }}
                                className={`flex items-center gap-2 px-3 py-1 rounded text-xs transition ${targetType === 'equipment' ? 'bg-odoo-secondary text-white' : 'text-gray-400'}`}
                            >
                                <Monitor size={14}/> Equipment
                            </button>
                            <button 
                                type="button"
                                onClick={() => { setTargetType('work_center'); setValue('equipment_id', null); }}
                                className={`flex items-center gap-2 px-3 py-1 rounded text-xs transition ${targetType === 'work_center' ? 'bg-odoo-secondary text-white' : 'text-gray-400'}`}
                            >
                                <Factory size={14}/> Work Center
                            </button>
                        </div>
                    </div>

                    {/* CONDITIONAL DROPDOWNS - FIXED COLORS */}
                    {targetType === 'equipment' ? (
                        <div>
                            <label className="odoo-label">Equipment</label>
                            <select 
                                {...register("equipment_id")} 
                                disabled={!isNew} 
                                className="odoo-input bg-[#2a2a2a] text-white border border-[#444] p-2 rounded focus:border-odoo-primary outline-none"
                            >
                                <option value="" className="bg-[#2a2a2a] text-gray-400">Select Equipment...</option>
                                {equipments.map(e => (
                                    <option key={e.id} value={e.id} className="bg-[#2a2a2a] text-white font-medium">
                                        {e.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label className="odoo-label">Work Center</label>
                            <select 
                                {...register("work_center_id")} 
                                disabled={!isNew} 
                                className="odoo-input bg-[#2a2a2a] text-white border border-[#444] p-2 rounded focus:border-odoo-primary outline-none"
                            >
                                <option value="" className="bg-[#2a2a2a] text-gray-400">Select Work Center...</option>
                                {workCenters.map(wc => (
                                    <option key={wc.id} value={wc.id} className="bg-[#2a2a2a] text-white font-medium">
                                        {wc.name} ({wc.code})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {targetType === 'equipment' && (
                        <div className="flex gap-4 p-3 bg-[#1a1a1a] rounded border border-[#333]">
                            <div className="flex-1"><label className="text-xs text-gray-500 block">Category</label><input {...register("category")} readOnly className="bg-transparent text-gray-300 w-full outline-none" placeholder="-"/></div>
                            <div className="flex-1"><label className="text-xs text-gray-500 block">Team</label><input {...register("maintenance_team")} readOnly className="bg-transparent text-odoo-secondary font-bold w-full outline-none" placeholder="-"/></div>
                        </div>
                    )}

                    <div><label className="odoo-label">Requested Date</label><input type="date" {...register("request_date")} className="odoo-input bg-[#2a2a2a] border border-[#444] p-2 rounded" /></div>
                    
                    <div className="flex gap-4 mt-2 text-gray-300">
                        <label className="flex gap-2 items-center cursor-pointer"><input type="radio" value="Corrective" {...register("type")} disabled={!isNew} className="accent-odoo-secondary"/> Corrective</label>
                        <label className="flex gap-2 items-center cursor-pointer"><input type="radio" value="Preventive" {...register("type")} disabled={!isNew} className="accent-odoo-secondary"/> Preventive</label>
                    </div>
                </div>

                <div className="space-y-6 bg-[#2a2a2a] p-5 rounded border border-[#333]">
                     <h3 className="text-odoo-secondary font-bold uppercase text-xs mb-4 flex items-center gap-2 border-b border-[#444] pb-2"><Clock size={14}/> Technician Scheduling</h3>
                     <div><label className="odoo-label">Technician</label><input {...register("technician_name")} disabled className="odoo-input text-gray-400" placeholder="Unassigned" /></div>
                     <div className="grid grid-cols-2 gap-4">
                        <div><label className="odoo-label">Scheduled</label><input type="datetime-local" {...register("scheduled_date")} disabled={!isTech} className="odoo-input bg-[#1f1f1f] p-2 rounded" /></div>
                        <div><label className="odoo-label">Duration</label><input type="number" step="0.5" {...register("duration")} disabled={!isTech} className="odoo-input bg-[#1f1f1f] p-2 rounded" /></div>
                     </div>
                     <div>
                        <label className="odoo-label">Priority</label>
                        <select {...register("priority")} disabled={!isTech && !isNew} className="odoo-input bg-[#1f1f1f] p-2 rounded text-white border border-[#444]">
                            <option value="1" className="bg-[#1f1f1f]">Low</option>
                            <option value="2" className="bg-[#1f1f1f]">Medium</option>
                            <option value="3" className="bg-[#1f1f1f]">High</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-[#333]">
                <label className="odoo-label mb-2">Notes</label>
                <textarea {...register("notes")} className="w-full bg-[#1f1f1f] p-4 rounded border border-[#444] h-32 text-gray-300 outline-none focus:border-odoo-primary" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default RequestForm;