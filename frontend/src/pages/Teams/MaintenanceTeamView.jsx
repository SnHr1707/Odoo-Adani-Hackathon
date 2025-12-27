import React, { useState, useEffect, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { API, AuthContext } from '../../context/AuthContext';
import { Loader2, User as UserIcon, Building2, UserPlus, X } from 'lucide-react';

const MaintenanceTeamView = () => {
  const { user } = useContext(AuthContext);
  const [teams, setTeams] = useState([]);
  const [technicians, setTechnicians] = useState([]); // List of all techs
  const [loading, setLoading] = useState(true);
  const [assignModalTeam, setAssignModalTeam] = useState(null); // Which team is adding a member?

  const { register, handleSubmit, reset } = useForm();

  const isTech = user?.role === 'technician';

  useEffect(() => {
    if (isTech) fetchData();
    else setLoading(false);
  }, [isTech]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teamsRes, techsRes] = await Promise.all([
        API.get('/teams'),
        API.get('/users?role=technician') // Fetch all technicians
      ]);
      setTeams(teamsRes.data);
      setTechnicians(techsRes.data);
    } catch (error) {
      alert("Error loading data");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (data) => {
    try {
      await API.post(`/teams/${assignModalTeam.id}/assign`, { user_id: data.user_id });
      alert("Member assigned!");
      setAssignModalTeam(null);
      fetchData(); // Refresh list
    } catch (error) {
      alert("Failed to assign member");
    }
  };

  if (!isTech) return <div className="p-8 text-white text-center">Access Denied</div>;
  if (loading) return <div className="p-8 text-white flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 h-full flex flex-col animate-fade-in text-white">
      <h1 className="text-2xl font-bold mb-6">Maintenance Teams Overview</h1>

      <div className="bg-[#242424] rounded-lg border border-[#333] overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm">
            <thead className="bg-[#1f1f1f] text-gray-400 font-semibold border-b border-[#333]">
                <tr>
                    <th className="p-4 w-1/3">Team Name</th>
                    <th className="p-4 w-1/3">Company</th>
                    <th className="p-4 w-1/3">Team Members</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-[#333]">
                {teams.length === 0 ? (
                    <tr><td colSpan="3" className="p-6 text-center text-gray-500">No teams found.</td></tr>
                ) : (
                    teams.map(team => (
                        <tr key={team.id} className="hover:bg-[#2a2a2a] transition-colors group">
                            <td className="p-4 font-bold text-white text-lg">{team.name}</td>
                            <td className="p-4 text-gray-400 flex items-center gap-2">
                                <Building2 size={16} /> My Company (San Francisco)
                            </td>
                            <td className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-wrap gap-2">
                                        {team.members && team.members.length > 0 ? (
                                            team.members.map(m => (
                                                <span key={m.id} className="bg-odoo-primary/20 text-odoo-primary px-2 py-1 rounded text-xs border border-odoo-primary/30 flex items-center gap-1">
                                                    <UserIcon size={10} /> {m.name}
                                                </span>
                                            ))
                                        ) : <span className="text-gray-600 italic">No members assigned</span>}
                                    </div>
                                    
                                    {/* ASSIGN BUTTON */}
                                    <button 
                                        onClick={() => setAssignModalTeam(team)}
                                        className="text-gray-500 hover:text-white bg-[#333] hover:bg-odoo-primary p-1.5 rounded transition opacity-0 group-hover:opacity-100"
                                        title="Add Member"
                                    >
                                        <UserPlus size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>

      {/* ASSIGN MODAL */}
      {assignModalTeam && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <form onSubmit={handleSubmit(handleAssign)} className="bg-[#242424] p-6 rounded-lg w-96 border border-[#333] shadow-lg relative">
                <button type="button" onClick={() => setAssignModalTeam(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
                
                <h3 className="text-lg font-bold text-white mb-1">Add Member</h3>
                <p className="text-gray-400 text-sm mb-4">Assign technician to <span className="text-odoo-primary">{assignModalTeam.name}</span></p>
                
                <label className="odoo-label">Select Technician</label>
                <select {...register("user_id")} className="odoo-input bg-[#1f1f1f] p-2 rounded mb-6">
                    {technicians.map(t => (
                        <option key={t.id} value={t.id}>{t.name} {t.team_id ? '(Already in a team)' : ''}</option>
                    ))}
                </select>

                <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setAssignModalTeam(null)} className="bg-gray-700 text-white px-4 py-2 rounded">Cancel</button>
                    <button type="submit" className="bg-odoo-primary text-white px-4 py-2 rounded hover:bg-[#5d3b55]">Assign</button>
                </div>
            </form>
        </div>
      )}
    </div>
  );
};

export default MaintenanceTeamView;