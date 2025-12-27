import React, { useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext, API } from '../../context/AuthContext';

const Login = ({ role, title }) => {
  const { register, handleSubmit } = useForm();
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    try {
      if (isSignup) {
        // Force role based on the page
        await API.post('/auth/signup', { ...data, role });
        setIsSignup(false);
        alert("Account created! Please log in.");
      } else {
        const res = await API.post('/auth/login', data);
        if (res.data.user.role !== role) {
             setError(`This account is not a ${role}.`);
             return;
        }
        login(res.data.user);
        navigate('/');
      }
    } catch (e) {
      setError(e.response?.data?.detail || "Authentication failed");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-odoo-card p-8 rounded-lg shadow-2xl w-96 border border-odoo-border">
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-gray-500 text-sm mb-6 uppercase tracking-wide">{isSignup ? 'Create Account' : 'Secure Login'}</p>
        
        {error && <div className="bg-red-900/50 text-red-200 p-3 rounded text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isSignup && (
            <input {...register("name")} placeholder="Full Name" className="w-full p-2 bg-gray-800 rounded border border-gray-600 text-white" />
          )}
          <input {...register("email")} placeholder="Email Address" className="w-full p-2 bg-gray-800 rounded border border-gray-600 text-white" />
          <input type="password" {...register("password")} placeholder="Password" className="w-full p-2 bg-gray-800 rounded border border-gray-600 text-white" />
          
          <button className={`w-full py-2 rounded font-bold text-white transition ${role === 'technician' ? 'bg-odoo-primary hover:bg-purple-900' : 'bg-odoo-secondary hover:bg-teal-700'}`}>
            {isSignup ? "Sign Up" : "Log In"}
          </button>
        </form>

        <div className="mt-4 flex flex-col gap-2 text-center">
          <button onClick={() => { setIsSignup(!isSignup); setError(''); }} className="text-sm text-gray-400 hover:text-white underline">
            {isSignup ? "Already have an account? Log In" : "Create an account"}
          </button>
          <Link to="/auth" className="text-xs text-gray-500 hover:text-gray-300">← Back to selection</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;