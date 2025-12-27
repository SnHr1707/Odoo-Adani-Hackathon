import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wrench, Search, Calendar as CalIcon, LogOut } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
  const { logout, user } = useContext(AuthContext);
  const location = useLocation();

  const menus = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Maintenance', icon: Wrench, path: '/requests' },
    { name: 'Equipment', icon: Search, path: '/equipment' },
    { name: 'Calendar', icon: CalIcon, path: '/calendar' },
  ];

  return (
    <div className="w-64 bg-[#111] border-r border-odoo-border flex flex-col flex-none h-screen">
      <div className="p-6 text-2xl font-bold text-white flex items-center gap-2">
        <div className="w-8 h-8 bg-odoo-primary rounded flex items-center justify-center">G</div>
        GearGuard
      </div>
      
      <div className="flex-1 px-2 space-y-1 mt-4">
        {menus.map(m => (
          <Link 
            key={m.name} 
            to={m.path} 
            className={`flex items-center gap-3 px-4 py-3 rounded transition-colors ${
              location.pathname === m.path 
              ? 'bg-odoo-primary text-white' 
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <m.icon size={18} /> {m.name}
          </Link>
        ))}
      </div>

      <div className="p-4 border-t border-odoo-border">
         <div className="flex items-center gap-3 mb-4">
            <div className="bg-odoo-secondary w-8 h-8 rounded-full flex items-center justify-center font-bold text-white">
                {user?.name?.[0]}
            </div>
            <div className="text-xs">
                <div className="text-white font-bold">{user?.name}</div>
                <div className="text-gray-500 capitalize">{user?.role}</div>
            </div>
         </div>
         <button onClick={logout} className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 w-full">
           <LogOut size={14}/> Log Out
         </button>
      </div>
    </div>
  );
};

export default Sidebar;