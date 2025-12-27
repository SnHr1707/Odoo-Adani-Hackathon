import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Wrench, MapPin, User, Hash } from 'lucide-react';
import { API } from '../../context/AuthContext';
import SmartButton from '../../components/SmartButton'; // Ensure you have this component

const EquipmentForm = () => {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const { register, handleSubmit, reset } = useForm();
  const [eq, setEq] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNew) {
      API.get(`/equipment/${id}`).then(res => {
        setEq(res.data);
        reset(res.data);
      });
    }
  }, [id, isNew, reset]);

  const onSubmit = async (data) => {
    if (isNew) {
      const res = await API.post('/equipment', data);
      navigate(`/equipment/${res.data.id}`);
    } else {
      // Basic update logic (optional for now)
      alert("Equipment Saved");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in text-white">
      {/* Header */}
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
                    <input {...register("name", { required: true })} className="odoo-input text-xl font-bold" placeholder="e.g. Samsung Monitor" />
                </div>
                
                <div>
                    <label className="odoo-label">Category</label>
                    <input {...register("category")} className="odoo-input" placeholder="e.g. Computers" />
                </div>

                <div>
                    <label className="odoo-label">Maintenance Team</label>
                    <input {...register("maintenance_team")} className="odoo-input" defaultValue="Internal Maintenance" />
                </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="odoo-label flex items-center gap-1"><Hash size={12}/> Serial Number</label>
                        <input {...register("serial_number")} className="odoo-input" placeholder="SN-123456" />
                    </div>
                    <div className="flex-1">
                        <label className="odoo-label flex items-center gap-1"><MapPin size={12}/> Location</label>
                        <input {...register("location")} className="odoo-input" placeholder="Office 1" />
                    </div>
                </div>

                <div>
                    <label className="odoo-label flex items-center gap-1"><User size={12}/> Assigned Employee</label>
                    <input {...register("used_by")} className="odoo-input" placeholder="Employee Name" />
                </div>

                <div>
                    <label className="odoo-label">Department</label>
                    <input {...register("department")} className="odoo-input" placeholder="e.g. Engineering" />
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-[#333] flex justify-end">
            <button className="bg-odoo-primary hover:bg-[#5d3b55] text-white px-8 py-2 rounded shadow-lg font-bold">
                {isNew ? 'Create Equipment' : 'Save Changes'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default EquipmentForm;