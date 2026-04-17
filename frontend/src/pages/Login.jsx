import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setRole, setUserId } from '../services/api';
import { Shield, User, LogIn } from 'lucide-react';

const Login = () => {
  const [role, setUserRole] = useState('Patient');
  const [userId, setLocalUserId] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (!userId.trim()) return;
    
    setRole(role);
    setUserId(userId.trim());
    
    if (role === 'Patient') {
      navigate('/');
    } else {
      navigate('/doctor/dashboard');
    }
    
    // Hard refresh to reload contexts
    window.location.reload();
  };

  return (
    <div className="fade-in" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
    }}>
      <div className="glass-panel" style={{ width: '400px', padding: '40px', borderRadius: '16px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ 
            background: '#16a34a', color: 'white', width: '60px', height: '60px', 
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 15px auto'
          }}>
            <Shield size={30} />
          </div>
          <h2 style={{ fontSize: '1.8rem', color: '#166534', margin: 0 }}>SmartCare Auth</h2>
          <p className="text-muted" style={{ marginTop: '5px' }}>Sign in to continue</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Select Role</label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
              <button 
                type="button" 
                className={`btn ${role === 'Patient' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1 }}
                onClick={() => setUserRole('Patient')}
              >
                <User size={16} /> Patient
              </button>
              <button 
                type="button" 
                className={`btn ${role === 'Doctor' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1 }}
                onClick={() => setUserRole('Doctor')}
              >
                <Shield size={16} /> Doctor
              </button>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '20px' }}>
            <label>User ID</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder={role === 'Doctor' ? 'e.g., doc-001' : 'e.g., patient-xyz'}
              value={userId}
              onChange={(e) => setLocalUserId(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '30px', padding: '12px' }}>
            <LogIn size={18} style={{ marginRight: '8px' }} /> Sign In
          </button>
        </form>
        
        {role === 'Doctor' && (
          <div style={{ marginTop: '20px', fontSize: '0.85rem', color: '#666', background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
            <strong style={{ display: 'block', marginBottom: '5px' }}>Sample Doctor IDs:</strong>
            Standard: <code>doc-001</code>, <code>doc-002</code>, <code>doc-003</code>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
