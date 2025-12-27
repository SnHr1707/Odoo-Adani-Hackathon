import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { AuthContext, API } from '../../context/AuthContext';
import { Calendar, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const RequestForm = () => {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation(); // Required for reading Calendar data
  const [equipments, setEquipments] = useState([]);

  // Check Role safely
  const isTech = user?.role === 'technician';

  // Get pre-filled date safely
  const prefillDate = location.state?.prefillDate;

  const { register, handleSubmit, watch, setValue, reset, getValues, formState: { errors } } = useForm({
    defaultValues: {
      stage: 'New',
      priority: 1,
      // Safety check: ensure user exists before accessing name
      created_by_name: user?.name || "Unknown",
      created_by_id: user?.id || "",
      // If prefill exists, use it (YYYY-MM-DD), else today
      request_date: prefillDate ? prefillDate.split('T')[0] : new Date().toISOString().split('T')[0],
      // If Tech clicked calendar, pre-fill scheduled datetime
      scheduled_date: isTech && prefillDate ? prefillDate : "", 
      duration: 0,
      type: "Corrective"
    }
  });

  const currentStage = watch("stage");
  const watchedEqId = watch("equipment_id");
  const watchedScheduledDate = watch("scheduled_date");

  useEffect(() => {
    // Fetch Equipment List
    API.get('/equipment')
      .then(res => setEquipments(res.data || [])) // Ensure it's always an array
      .catch(err => console.error("Eq Load Error", err));

    // Fetch Request Data if editing
    if (!isNew) {
      API.get(`/requests/${id}`)
        .then(res => reset(res.data))
        .catch(err => console.error("Req Load Error", err));
    }
  }, [id, isNew, reset]);

  // Auto-fill Logic
  useEffect(() => {
    if (isNew && watchedEqId && equipments.length > 0) {
        const eq = equipments.find(e => e.id === watchedEqId);
        if (eq) {
            setValue("category", eq.category);
            setValue("maintenance_team", eq.maintenance_team);
        }
    }
  }, [watchedEqId, isNew, equipments, setValue]);

  const onSubmit = async (data) => {
    const payload = {
        ...data,
        priority: parseInt(data.priority),
        duration: parseFloat(data.duration),
        created_by_name: user?.name, // Ensure user name is fresh
        created_by_id: user?.id,
    };

    // Force stage 'New' for users creating new requests
    if (!isTech && isNew) {
        payload.stage = "New";
    }

    try {
        if (isNew) {
            const res = await API.post('/requests', payload);
            navigate(`/requests/${res.data.id}`);
        } else {
            await API.put(`/requests/${id}`, payload);
            alert("Updated Successfully");
        }
    } catch (e) { 
        alert("Error saving: " + (e.response?.data?.detail || "Unknown error")); 
    }
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
      const reason = window.prompt("SCRAP EQUIPMENT\n\nPlease enter the reason why this cannot be repaired:");
      if (!reason) return; 

      const currentNotes = getValues("notes") || "";
      const newNotes = `${currentNotes}\n\n[SCRAPPED by ${user?.name} on ${new Date().toLocaleDateString()}]: ${reason}`;
      
      setValue("stage", "Scrap");
      setValue("notes", newNotes);

      await API.put(`/requests/${id}`, { 
          stage: "Scrap",
          notes: newNotes 
      });
      alert("Request marked as Scrapped.");
  };

  if (!user) return <div className="p-8 text-white">Loading User Profile...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-400">
             <span onClick={() => navigate('/requests')} className="cursor-pointer hover:text-white">Maintenance</span>
             <span className="mx-2">/</span>
             <span className="text-white font-bold">{isNew ? "New Request" : watch("subject")}</span>
        </div>
        <div className={`px-4 py-1 rounded-full text-sm font-bold border ${
            currentStage === 'New' ? 'bg-blue-900/30 text-blue-300 border-blue-800' :
            currentStage === 'In Progress' ? 'bg-yellow-900/30 text-yellow-300 border-yellow-800' :
            currentStage === 'Repaired' ? 'bg-green-900/30 text-green-300 border-green-800' :
            'bg-red-900/30 text-red-300 border-red-800'
        }`}>
            {currentStage}
        </div>
      </div>

      <div className="bg-[#242424] rounded-lg shadow-lg border border-[#333] overflow-hidden">
        
        {/* ACTION BAR */}
        <div className="p-4 bg-[#1f1f1f] border-b border-[#333] flex justify-between items-center">
            <div className="flex gap-3">
                <button onClick={handleSubmit(onSubmit)} className="bg-odoo-primary hover:bg-[#5d3b55] text-white px-6 py-1.5 rounded font-medium shadow">
                    {isNew ? 'Create Request' : 'Save Changes'}
                </button>

                {!isNew && isTech && currentStage === 'New' && (
                    <button onClick={handleSchedule} className="bg-odoo-secondary hover:bg-teal-700 text-white px-4 py-1.5 rounded flex items-center gap-2 shadow">
                        <Calendar size={16}/> Accept & Schedule
                    </button>
                )}
                {!isNew && isTech && currentStage === 'In Progress' && (
                     <button onClick={handleMarkRepaired} className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded flex items-center gap-2 shadow">
                        <CheckCircle size={16}/> Mark Repaired
                    </button>
                )}
                {!isNew && isTech && currentStage !== 'Scrap' && (
                    <button onClick={handleScrap} className="bg-red-900/20 hover:bg-red-900/50 text-red-400 border border-red-900 px-4 py-1.5 rounded flex items-center gap-2 shadow ml-2">
                        <AlertTriangle size={16}/> Scrap
                    </button>
                )}
            </div>
        </div>

        <div className="p-8">
            <input 
                {...register("subject", { required: "Subject is required" })} 
                disabled={!isNew && !isTech && user.id !== watch("created_by_id")}
                className={`text-3xl bg-transparent border-none outline-none text-white font-bold w-full mb-2 placeholder-gray-600 focus:ring-0 ${errors.subject ? 'border-b border-red-500' : ''}`} 
                placeholder="Subject (e.g. Printer Overheating)..." 
            />
            {errors.subject && <div className="text-red-500 text-sm mb-6">{errors.subject.message}</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-sm">
                
                {/* --- LEFT COLUMN: USER INFO --- */}
                <div className="space-y-6">
                    <div>
                        <label className="odoo-label">Equipment</label>
                        <select 
                            {...register("equipment_id", { required: "Equipment is required" })} 
                            disabled={!isNew} 
                            className={`odoo-input bg-[#2a2a2a] text-white border border-[#444] p-2 rounded focus:border-odoo-primary ${errors.equipment_id ? 'border-red-500' : ''}`}
                        >
                            <option value="" className="bg-[#2a2a2a] text-gray-500">Select Equipment...</option>
                            {equipments.map(e => (
                                <option key={e.id} value={e.id} className="bg-[#2a2a2a] text-white">
                                    {e.name}
                                </option>
                            ))}
                        </select>
                        {errors.equipment_id && <span className="text-red-500 text-xs">{errors.equipment_id.message}</span>}
                    </div>
                    
                    <div>
                        <label className="odoo-label">Requested Date</label>
                        <input 
                            type="date" 
                            {...register("request_date", { 
                                required: "Requested Date is required",
                                validate: (value) => {
                                    // User cannot select past dates for NEW requests
                                    if(isNew) {
                                        const selected = new Date(value);
                                        const today = new Date();
                                        today.setHours(0,0,0,0);
                                        if(selected < today) return "Cannot select a past date";
                                    }
                                    return true;
                                }
                            })} 
                            disabled={!isNew && !isTech} 
                            className={`odoo-input bg-[#2a2a2a] border border-[#444] p-2 rounded ${errors.request_date ? 'border-red-500' : ''}`}
                        />
                        <p className="text-[10px] text-gray-500 mt-1">Date you prefer the maintenance to happen.</p>
                        {errors.request_date && <span className="text-red-500 text-xs block">{errors.request_date.message}</span>}
                    </div>

                    <div>
                        <label className="odoo-label">Type</label>
                        <div className="flex gap-4 mt-2 text-gray-300">
                             <label className="flex items-center gap-2 cursor-pointer">
                                 <input type="radio" value="Corrective" {...register("type")} disabled={!isNew} className="accent-odoo-secondary"/> Corrective
                             </label>
                             <label className="flex items-center gap-2 cursor-pointer">
                                 <input type="radio" value="Preventive" {...register("type")} disabled={!isNew} className="accent-odoo-secondary"/> Preventive
                             </label>
                        </div>
                    </div>
                     <div>
                        <label className="odoo-label">Created By</label>
                        <input {...register("created_by_name")} disabled className="odoo-input text-gray-500" />
                     </div>
                </div>

                {/* --- RIGHT COLUMN: TECH / SCHEDULING --- */}
                <div className="space-y-6 bg-[#2a2a2a] p-5 rounded border border-[#333]">
                     <h3 className="text-odoo-secondary font-bold uppercase text-xs mb-4 flex items-center gap-2 border-b border-[#444] pb-2">
                        <Clock size={14}/> Technician Scheduling
                     </h3>
                     
                     <div>
                        <label className="odoo-label">Assigned Technician</label>
                        <input {...register("technician_name")} disabled className="odoo-input text-gray-400 italic" placeholder="Waiting for assignment..." />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="odoo-label text-odoo-secondary">Scheduled Date</label>
                            <input 
                                type="datetime-local" 
                                {...register("scheduled_date")} 
                                disabled={!isTech} 
                                className={`odoo-input border border-[#444] p-2 rounded ${isTech ? 'bg-[#1f1f1f] text-white' : 'bg-[#222] text-gray-500'}`} 
                            />
                        </div>
                        <div>
                            <label className="odoo-label">Duration (Hrs)</label>
                            <input 
                                type="number" step="0.5" 
                                {...register("duration")} 
                                disabled={!isTech}
                                className="odoo-input bg-[#1f1f1f] p-2 rounded border border-[#444]" 
                            />
                        </div>
                     </div>

                     <div>
                        <label className="odoo-label">Priority</label>
                        <select {...register("priority")} disabled={!isTech && !isNew} className="odoo-input bg-[#1f1f1f] text-white p-2 rounded border border-[#444]">
                            <option value="1" className="bg-[#2a2a2a]">Low</option>
                            <option value="2" className="bg-[#2a2a2a]">Medium</option>
                            <option value="3" className="bg-[#2a2a2a]">High</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-[#333]">
                <label className="odoo-label mb-2">Notes & Instructions</label>
                <textarea 
                    {...register("notes")} 
                    className="w-full bg-[#1f1f1f] p-4 rounded border border-[#444] outline-none h-32 text-gray-300 focus:border-odoo-primary custom-scrollbar" 
                    placeholder="Describe the issue in detail..."
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default RequestForm;