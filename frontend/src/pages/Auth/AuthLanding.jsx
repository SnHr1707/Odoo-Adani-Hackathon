import React from 'react';
import { Link } from 'react-router-dom';
import { User, Wrench } from 'lucide-react';

const AuthLanding = () => {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="text-center space-y-8">
        <h1 className="text-4xl font-bold mb-8 text-odoo-primary">GearGuard Portal</h1>
        <div className="flex gap-8">
          <Link to="/auth/employee" className="w-64 p-8 bg-odoo-card border border-odoo-border rounded-xl hover:border-odoo-secondary hover:bg-gray-800 transition group">
            <User size={48} className="mx-auto mb-4 text-gray-400 group-hover:text-white" />
            <h2 className="text-xl font-bold">Employee Login</h2>
            <p className="text-gray-500 text-sm mt-2">Create requests and report issues.</p>
          </Link>
          
          <Link to="/auth/technician" className="w-64 p-8 bg-odoo-card border border-odoo-border rounded-xl hover:border-odoo-primary hover:bg-gray-800 transition group">
            <Wrench size={48} className="mx-auto mb-4 text-gray-400 group-hover:text-white" />
            <h2 className="text-xl font-bold">Technician Login</h2>
            <p className="text-gray-500 text-sm mt-2">Manage repairs and equipment.</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthLanding;