import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Wrench, MapPin, User, Hash } from 'lucide-react';
import { API } from '../../context/AuthContext';
import SmartButton from '../../components/SmartButton';

const EquipmentForm = () => {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const { register, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm();
  const [eq, setEq] = useState(null);
  const [categories, setCategories] = useState([]); // To populate dropdown
  const [teams, setTeams] = useState([]); // To populate dropdown
  const navigate = useNavigate();

  const watchedCategoryId = watch('category_id'); // Watch for category selection

  useEffect(() => {
    // Fetch categories and teams for dropdowns
    API.get('/categories').then(res => setCategories(res.data));
    API.get('/teams').then(res => setTeams(res.data));

    if (!isNew) {
      API.get(`/equipment/${id}`).then(res => {
        setEq(res.data);
        reset(res.data);
      });
    }
  }, [id, isNew, reset]);

  // Auto-set Maintenance Team based on selected category
  useEffect(() => {
    if (watchedCategoryId && isNew && categories.length > 0 && teams.length > 0) {
      // ONLY auto-fill if it's a NEW equipment creation to prevent overwriting edits
      const selectedCategory = categories.find(cat => cat.id === watchedCategoryId);
      if (selectedCategory) {
        const responsibleTeam = teams.find(team => 
          team.responsible_categories?.some(cat => cat.id === selectedCategory.id)
        );
        // Only set if we found a match, otherwise leave it (allows manual selection)
        if (responsibleTeam) {
          setValue('maintenance_team_id', responsibleTeam.id);
        }
      }
    }
  }, [watchedCategoryId, isNew]); 


  const onSubmit = async (data) => {
    try {
        if (isNew) {
            const res = await API.post('/equipment', data);
            navigate(`/equipment/${res.data.id}`);
        } else {
            // Update logic (e.g., API.put(`/equipment/${id}`, data)) - for demo, we'll just alert
            alert("Equipment Saved (Update logic not implemented for demo)");
        }
    } catch (error) {
        alert("Error saving equipment: " + (error.response?.data?.detail || ""));
        console.error("Equipment Save Error", error.response?.data);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in text-white">
      {/* ...Header... */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-col">
            <div className="text-sm text-gray-400 mb-1">Equipment / {isNew ? 'New' : eq?.name}</div>
            <h1 className="text-3xl font-bold">{isNew ? "New Equipment" : eq?.name}</h1>
        </div>
        {!isNew && (
            <SmartButton 
                icon={Wrench} 
                label="Maintenance" 
                value={eq?.request_count || 0} 
                onClick={() => navigate(`/requests?eq=${id}`)}
            />
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-[#242424] p-8 rounded-lg shadow-lg border border-[#333]">
        <div className="grid grid-cols-2 gap-12">
            
            {/* Left Column */}
            <div className="space-y-6">
                <div>
                    <label className="odoo-label">Equipment Name</label>
                    <input {...register("name", { required: "Equipment Name is required" })} className={`odoo-input text-xl font-bold ${errors.name ? 'border-red-500' : ''}`} placeholder="e.g. Samsung Monitor" />
                    {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                </div>
                
                <div>
                    <label className="odoo-label">Category</label>
                    <select 
                      {...register("category_id", { required: "Category is required" })} 
                      className={`odoo-input bg-[#2a2a2a] text-white border border-[#444] p-2 rounded focus:border-odoo-primary ${errors.category_id ? 'border-red-500' : ''}`}
                    >
                      <option value="" className="bg-[#2a2a2a] text-gray-500">Select Category...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id} className="bg-[#2a2a2a] text-white">{cat.name}</option>
                      ))}
                    </select>
                    {errors.category_id && <span className="text-red-500 text-xs">{errors.category_id.message}</span>}
                </div>

                <div>
                    <label className="odoo-label">Maintenance Team</label>
                    <select 
                      {...register("maintenance_team_id", { required: "Maintenance Team is required" })} 
                      className={`odoo-input bg-[#2a2a2a] text-white border border-[#444] p-2 rounded focus:border-odoo-primary ${errors.maintenance_team_id ? 'border-red-500' : ''}`}
                    >
                      <option value="" className="bg-[#2a2a2a] text-gray-500">Select Team...</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id} className="bg-[#2a2a2a] text-white">{team.name}</option>
                      ))}
                    </select>
                    {errors.maintenance_team_id && <span className="text-red-500 text-xs">{errors.maintenance_team_id.message}</span>}
                </div>
                 {/* New Description field */}
                <div>
                    <label className="odoo-label">Description</label>
                    <textarea 
                        {...register("description")} 
                        className="odoo-input bg-[#1f1f1f] p-2 rounded border border-[#444] h-24" 
                        placeholder="Detailed description of the equipment..." 
                    />
                </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="odoo-label flex items-center gap-1"><Hash size={12}/> Serial Number</label>
                        <input {...register("serial_number", { required: "Serial Number is required" })} className={`odoo-input ${errors.serial_number ? 'border-red-500' : ''}`} placeholder="SN-123456" />
                        {errors.serial_number && <span className="text-red-500 text-xs">{errors.serial_number.message}</span>}
                    </div>
                    <div className="flex-1">
                        <label className="odoo-label flex items-center gap-1"><MapPin size={12}/> Location</label>
                        <input {...register("location", { required: "Location is required" })} className={`odoo-input ${errors.location ? 'border-red-500' : ''}`} placeholder="Office 1" />
                        {errors.location && <span className="text-red-500 text-xs">{errors.location.message}</span>}
                    </div>
                </div>

                <div>
                    <label className="odoo-label flex items-center gap-1"><User size={12}/> Assigned Employee (Optional)</label>
                    <input {...register("used_by")} className="odoo-input" placeholder="Employee Name" />
                </div>

                <div>
                    <label className="odoo-label">Department</label>
                    <input {...register("department")} className="odoo-input" placeholder="e.g. Engineering" defaultValue="Admin" />
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-[#333] flex justify-end">
            <button type="submit" className="bg-odoo-primary hover:bg-[#5d3b55] text-white px-8 py-2 rounded shadow-lg font-bold">
                {isNew ? 'Create Equipment' : 'Save Changes'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default EquipmentForm;