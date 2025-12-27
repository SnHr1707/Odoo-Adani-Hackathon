import React, { useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext, API } from '../../context/AuthContext';
import { AlertCircle } from 'lucide-react';

const Login = ({ role, title }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [apiError, setApiError] = useState('');

  const onSubmit = async (data) => {
    setApiError('');
    try {
      if (isSignup) {
        // As per instructions, only role='user' is created on signup via this form
        await API.post('/auth/signup', { ...data, role: 'user' });
        setIsSignup(false);
        alert("Account created! Please log in.");
      } else {
        const res = await API.post('/auth/login', data);
        if (role === 'technician' && res.data.user.role !== 'technician') {
             setApiError("Access Denied: You are not a technician.");
             return;
        }
        login(res.data.user);
        navigate('/');
      }
    } catch (e) {
      setApiError(e.response?.data?.detail || "Authentication failed");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#0f0f0f]">
      <div className="bg-[#1e1e1e] p-8 rounded-lg shadow-2xl w-96 border border-[#333]">
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-gray-500 text-sm mb-6 uppercase tracking-wide">{isSignup ? 'Create Account' : 'Secure Login'}</p>
        
        {apiError && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 p-3 rounded text-sm mb-4 flex items-start gap-2 animate-fade-in">
                <AlertCircle size={18} className="mt-0.5 shrink-0"/> 
                <span>{apiError}</span>
            </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isSignup && (
            <div>
                <input 
                    {...register("name", { required: "Full Name is required" })} 
                    placeholder="Full Name" 
                    className={`odoo-input bg-[#2a2a2a] p-2 rounded ${errors.name ? 'border-red-500' : ''}`} 
                />
                {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
            </div>
          )}
          
          <div>
            <input 
                {...register("email", { required: "Email is required" })} 
                placeholder="Email Address" 
                className={`odoo-input bg-[#2a2a2a] p-2 rounded ${errors.email ? 'border-red-500' : ''}`} 
            />
            {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
          </div>

          <div>
            <input 
                type="password" 
                {...register("password", { 
                    required: "Password is required",
                    minLength: { value: 9, message: "Length should be more than 8 characters" },
                    pattern: isSignup ? {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{9,}$/,
                        message: "Must contain lowercase, uppercase, and special character"
                    } : undefined
                })} 
                placeholder="Password" 
                className={`odoo-input bg-[#2a2a2a] p-2 rounded ${errors.password ? 'border-red-500' : ''}`} 
            />
            {errors.password && <span className="text-red-500 text-xs block mt-1">{errors.password.message}</span>}
          </div>
          
          <button className={`w-full py-2 rounded font-bold text-white transition ${role === 'technician' ? 'bg-odoo-primary hover:bg-purple-900' : 'bg-odoo-secondary hover:bg-teal-700'}`}>
            {isSignup ? "Sign Up" : "Log In"}
          </button>
        </form>

        <div className="mt-4 flex flex-col gap-2 text-center">
          {!isSignup && <button onClick={() => alert("Please contact admin to reset password")} className="text-xs text-gray-500 hover:text-gray-300">Forgot Password?</button>}
          {role === 'user' && (
              <button onClick={() => { setIsSignup(!isSignup); setApiError(''); }} className="text-sm text-odoo-secondary hover:underline">
                {isSignup ? "Already have an account? Log In" : "Create an account"}
              </button>
          )}
          <Link to="/auth" className="text-xs text-gray-600 hover:text-gray-400 mt-2">← Back to selection</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;