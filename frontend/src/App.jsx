import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Layout from './components/Layout';

// Pages
import AuthLanding from './pages/Auth/AuthLanding';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';

// Equipment Pages
import EquipmentForm from './pages/Equipment/EquipmentForm';
import EquipmentList from './pages/Equipment/EquipmentList'; // NEW

// Request Pages
import RequestForm from './pages/Requests/RequestForm';
import RequestList from './pages/Requests/RequestList'; // NEW

// Placeholder for Calendar (or use previous code)
const CalendarView = () => <div className="p-8 text-white">Calendar View (Coming Soon)</div>;

const ProtectedRoute = () => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/auth" />;
  return <Layout><Outlet /></Layout>;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth Routes */}
          <Route path="/auth" element={<AuthLanding />} />
          <Route path="/auth/employee" element={<Login role="user" title="Employee Portal" />} />
          <Route path="/auth/technician" element={<Login role="technician" title="Technician Portal" />} />

          {/* Protected App Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            
            {/* Equipment Routes */}
            <Route path="/equipment" element={<EquipmentList />} /> 
            <Route path="/equipment/:id" element={<EquipmentForm />} />
            
            {/* Request Routes */}
            <Route path="/requests" element={<RequestList />} />
            <Route path="/requests/:id" element={<RequestForm />} />
            
            <Route path="/calendar" element={<CalendarView />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}