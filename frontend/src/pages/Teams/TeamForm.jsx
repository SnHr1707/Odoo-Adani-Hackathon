import React, { useState, useEffect , useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { API, AuthContext } from '../../context/AuthContext';
import { Users as UsersIcon, Plus, X } from 'lucide-react';

const TeamForm = () => {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const [allTechnicians, setAllTechnicians] = useState([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState([]);

  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const techsRes = await API.get('/users/technicians');
        setAllTechnicians(techsRes.data);

        if (!isNew) {
          const teamRes = await API.get(`/teams/${id}`); // Need a GET /teams/{id} endpoint (add to backend)
          reset(teamRes.data);
          setSelectedTechnicians(teamRes.data.technician_ids.map(techId => 
            techsRes.data.find(t => t.id === techId)
          ).filter(Boolean));
        }
      } catch (error) {
        console.error("Failed to fetch team dependencies or team data:", error);
      }
    };
    fetchDependencies();
  }, [id, isNew, reset]);

  // Handle technician selection
  const handleAddTechnician = (techId) => {
    const tech = allTechnicians.find(t => t.id === techId);
    if (tech && !selectedTechnicians.some(t => t.id === techId)) {
      setSelectedTechnicians([...selectedTechnicians, tech]);
    }
  };

  const handleRemoveTechnician = (techId) => {
    setSelectedTechnicians(selectedTechnicians.filter(t => t.id !== techId));
  };

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      technician_ids: selectedTechnicians.map(t => t.id),
    };

    try {
      if (isNew) {
        const res = await API.post('/teams', payload);
        navigate(`/teams`); // Go back to list after creation
      } else {
        await API.put(`/teams/${id}`, payload); // Need a PUT /teams/{id} endpoint (add to backend)
        alert("Team updated successfully!");
        navigate(`/teams`);
      }
    } catch (e) {
      alert("Error saving team: " + (e.response?.data?.detail || "Unknown error"));
    }
  };

  // Dummy endpoint for GET /teams/{id} and PUT /teams/{id} needs to be added to backend/main.py
  // For GET /teams/{id}
  // @app.get("/teams/{id}")
  // async def get_team(id: str):
  //     if not ObjectId.is_valid(id): raise HTTPException(status_code=400, detail="Invalid ID")
  //     team = await db.maintenanceteams.find_one({"_id": ObjectId(id)})
  //     if not team: raise HTTPException(status_code=404, detail="Team not found")
  //     return fix_id(team)

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in text-white">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-2xl font-bold">{isNew ? "New Maintenance Team" : `Edit ${watch('name')}`}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-[#242424] p-8 rounded-lg shadow-lg border border-[#333]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="odoo-label">Team Name</label>
            <input {...register("name", { required: "Team Name is required" })} className={`odoo-input bg-[#1f1f1f] p-2 rounded ${errors.name ? 'border-red-500' : ''}`} />
            {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
          </div>
          <div>
            <label className="odoo-label">Equipment Category Handled</label>
            <input {...register("category_name", { required: "Category is required" })} className={`odoo-input bg-[#1f1f1f] p-2 rounded ${errors.category_name ? 'border-red-500' : ''}`} placeholder="e.g., Computers, Machinery" />
            {errors.category_name && <span className="text-red-500 text-xs">{errors.category_name.message}</span>}
          </div>
        </div>

        <div className="mt-8">
          <label className="odoo-label flex items-center gap-2 mb-3">
            <UsersIcon size={16} /> Team Members (Technicians)
          </label>
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedTechnicians.map(tech => (
              <span key={tech.id} className="inline-flex items-center bg-blue-900/40 text-blue-200 px-3 py-1 rounded-full text-sm font-medium border border-blue-700">
                {tech.name}
                <button type="button" onClick={() => handleRemoveTechnician(tech.id)} className="ml-2 text-blue-200 hover:text-white">
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>

          <select 
            onChange={(e) => handleAddTechnician(e.target.value)} 
            value="" // Reset select after adding
            className="odoo-input bg-[#1f1f1f] text-white border border-[#444] p-2 rounded w-full mt-2"
          >
            <option value="" className="bg-[#1f1f1f] text-gray-500">Add Technician...</option>
            {allTechnicians.filter(tech => !selectedTechnicians.some(sTech => sTech.id === tech.id)).map(tech => (
              <option key={tech.id} value={tech.id} className="bg-[#1f1f1f] text-white">
                {tech.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-8 pt-6 border-t border-[#333] flex justify-end">
          <button type="submit" className="bg-odoo-primary hover:bg-[#5d3b55] text-white px-8 py-2 rounded shadow-lg font-bold">
            {isNew ? 'Create Team' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeamForm;