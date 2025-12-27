import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { AuthContext, API } from '../../context/AuthContext';

const RequestForm = () => {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [equipments, setEquipments] = useState([]);

  // 1. FIXED: Set proper default values, including Date and User ID
  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      stage: 'New',
      priority: 1,
      created_by_name: user?.name || "Unknown",
      created_by_id: user?.id || "", // Fix: Use user.id, not user.user_id
      request_date: new Date().toISOString().split('T')[0], // Default to today
      duration: 0,
      type: "Corrective" // Default radio selection
    }
  });

  const stages = ["New", "In Progress", "Repaired", "Scrap"];
  const currentStage = watch("stage");
  const watchedEqId = watch("equipment_id");

  useEffect(() => {
    // Load Equipments
    API.get('/equipment').then(res => setEquipments(res.data));
    
    // Load Request if editing
    if (!isNew) {
      API.get(`/requests/${id}`).then(res => reset(res.data));
    }
  }, [id, isNew, reset]);

  // Auto-fill Logic: When Equipment is selected
  useEffect(() => {
    if (isNew && watchedEqId) {
        const eq = equipments.find(e => e.id === watchedEqId);
        if (eq) {
            setValue("category", eq.category);
            setValue("maintenance_team", eq.maintenance_team);
        }
    }
  }, [watchedEqId, isNew, equipments, setValue]);

  // 2. FIXED: Payload Construction
  const onSubmit = async (data) => {
    try {
        // Explicitly format the payload to match Backend Pydantic models
        const payload = {
            subject: data.subject,
            created_by_name: user.name,
            created_by_id: user.id, // Ensure this exists
            equipment_id: data.equipment_id,
            category: data.category || "General", // Fallback if empty
            maintenance_team: data.maintenance_team || "Internal Maintenance",
            request_date: data.request_date,
            type: data.type,
            priority: parseInt(data.priority), // Convert String "1" to Int 1
            technician_name: data.technician_name || null,
            technician_id: data.technician_id || null,
            scheduled_date: data.scheduled_date || null,
            duration: parseFloat(data.duration || 0), // Convert String to Float
            stage: data.stage,
            notes: data.notes || ""
        };

        if (isNew) {
            const res = await API.post('/requests', payload);
            navigate(`/requests/${res.data.id}`);
        } else {
            await API.put(`/requests/${id}`, payload);
            alert("Request Updated Successfully");
        }
    } catch (error) {
        console.error("Submission Error:", error.response?.data);
        alert(`Error: ${JSON.stringify(error.response?.data?.detail || "Check console")}`);
    }
  };

  const updateStage = async (s) => {
      // Role Check
      if (user.role === 'user' && s !== 'New') {
          return alert("Only Technicians can change the stage.");
      }
      
      setValue("stage", s);
      
      // Auto-assign Technician if moving to "In Progress"
      if (s === 'In Progress' && !watch('technician_id')) {
          setValue('technician_name', user.name);
          setValue('technician_id', user.id);
      }

      if(!isNew) {
          // If we are editing, save the stage change immediately
          await API.put(`/requests/${id}`, { 
              stage: s,
              technician_name: user.name,
              technician_id: user.id 
          });
      }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center text-sm text-gray-400 mb-4">
        <span onClick={() => navigate('/requests')} className="cursor-pointer hover:text-white">Maintenance</span>
        <span className="mx-2">/</span>
        <span className="text-white font-bold">{watch("subject") || "New Request"}</span>
      </div>

      <div className="bg-odoo-card rounded-lg shadow-lg border border-odoo-border overflow-hidden">
        {/* Status Bar Header */}
        <div className="flex justify-between items-center p-2 bg-gray-800 border-b border-gray-700">
            <button 
                onClick={handleSubmit(onSubmit)} 
                className="ml-4 bg-odoo-primary hover:bg-[#5d3b55] text-white text-sm px-6 py-1.5 rounded shadow transition-colors"
            >
                {isNew ? 'Create Request' : 'Save Changes'}
            </button>
            
            {/* Stage Buttons */}
            <div className="flex rounded-full overflow-hidden border border-gray-600 mr-2">
                {stages.map(s => (
                    <button 
                        key={s} 
                        type="button"
                        onClick={() => updateStage(s)} 
                        className={`px-4 py-1.5 text-sm font-medium transition-colors border-r border-gray-600 last:border-0 ${
                            currentStage === s 
                            ? 'bg-odoo-secondary text-white' 
                            : 'bg-[#2a2a2a] text-gray-400 hover:bg-gray-700'
                        }`}
                    >
                        {s}
                    </button>
                ))}
            </div>
        </div>

        {/* Form Body */}
        <div className="p-8">
            <div className="mb-8">
                 <input 
                    {...register("subject", { required: true })} 
                    className="text-3xl bg-transparent border-none outline-none text-white font-bold w-full placeholder-gray-600" 
                    placeholder="Subject (e.g. Leaking Oil)..." 
                 />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-sm">
                {/* Left Column */}
                <div className="space-y-6">
                    <div>
                        <label className="odoo-label">Equipment</label>
                        <select 
                            {...register("equipment_id", { required: true })} 
                            disabled={!isNew} 
                            className="odoo-input bg-[#2a2a2a] p-2 rounded"
                        >
                            <option value="">Select Equipment...</option>
                            {equipments.map(e => (
                                <option key={e.id} value={e.id}>{e.name} ({e.serial_number})</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="odoo-label">Request Date</label>
                        <input type="date" {...register("request_date")} className="odoo-input" />
                    </div>

                    <div>
                        <label className="odoo-label">Type</label>
                        <div className="flex gap-4 mt-2">
                             <label className="flex items-center text-gray-300 cursor-pointer">
                                <input type="radio" value="Corrective" {...register("type")} className="mr-2 accent-odoo-secondary"/> 
                                Corrective
                             </label>
                             <label className="flex items-center text-gray-300 cursor-pointer">
                                <input type="radio" value="Preventive" {...register("type")} className="mr-2 accent-odoo-secondary"/> 
                                Preventive
                             </label>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                     <div>
                        <label className="odoo-label">Maintenance Team</label>
                        <input {...register("maintenance_team")} className="odoo-input text-gray-300" readOnly />
                     </div>
                     
                     <div>
                        <label className="odoo-label">Technician</label>
                        <input {...register("technician_name")} className="odoo-input text-gray-400" placeholder="Unassigned" readOnly />
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="odoo-label">Scheduled Date</label>
                            <input type="datetime-local" {...register("scheduled_date")} className="odoo-input" />
                        </div>
                        <div>
                            <label className="odoo-label">Duration (Hours)</label>
                            <input type="number" step="0.5" {...register("duration")} className="odoo-input" />
                        </div>
                     </div>

                     <div>
                        <label className="odoo-label">Priority</label>
                        <select {...register("priority")} className="odoo-input bg-[#2a2a2a] p-2 rounded">
                            <option value="1">★ Low</option>
                            <option value="2">★★ Medium</option>
                            <option value="3">★★★ High</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Notes Section */}
            <div className="mt-8 border-t border-gray-700 pt-6">
                <label className="odoo-label mb-2 block">Description / Notes</label>
                <textarea 
                    {...register("notes")} 
                    className="w-full bg-[#1f1f1f] p-4 rounded border border-gray-700 focus:border-odoo-primary outline-none h-32 text-gray-300 transition-colors" 
                    placeholder="Add details..." 
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default RequestForm;