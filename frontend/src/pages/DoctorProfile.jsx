import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Save, UserCog, Stethoscope, Phone, DollarSign, Award, Briefcase, AlertCircle } from 'lucide-react';

const DoctorProfile = () => {
  const { getCurrentDoctor, updateDoctor } = useApp();
  const currentDoc = getCurrentDoctor();

  const [profile, setProfile] = useState({
    name: '',
    specialty: '',
    qualifications: '',
    experienceYears: '',
    contactNumber: '',
    consultationFee: '',
  });
  const [saved, setSaved] = useState(false);

  // Pre-fill form with current doctor's data whenever the selected doctor changes
  useEffect(() => {
    if (currentDoc) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfile({
        name: currentDoc.name || '',
        specialty: currentDoc.specialty || '',
        qualifications: Array.isArray(currentDoc.qualifications) 
          ? currentDoc.qualifications.join(', ') 
          : (currentDoc.qualifications || ''),
        experienceYears: currentDoc.experienceYears || '',
        contactNumber: currentDoc.contactNumber || '',
        consultationFee: currentDoc.consultationFee || '',
      });
    }
  }, [currentDoc]);

  const handleSave = async (e) => {
    e.preventDefault();

    const updatedFields = {
      name: profile.name,
      specialty: profile.specialty,
      qualifications: profile.qualifications.split(',').map((q) => q.trim()).filter(Boolean),
      experienceYears: Number(profile.experienceYears),
      contactNumber: profile.contactNumber,
      consultationFee: Number(profile.consultationFee),
    };

    // Update in shared context (persists to backend via AppContext)
    await updateDoctor(null, updatedFields);

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };



  const getInitials = (name) => {
    if (!name) return '?';
    return name.replace('Dr. ', '').split(' ').map(n => n[0]).join('');
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your professional information</p>
        </div>
      </div>

      <div className="glass-panel profile-form-card">
        <div className="profile-avatar-section">
          <div className="profile-avatar-lg">
            {getInitials(profile.name)}
          </div>
          <div>
            <h2>{profile.name || 'Your Name'}</h2>
            <p className="text-muted">{profile.specialty || 'Specialty'}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label><UserCog size={15} /> Full Name</label>
              <input type="text" className="form-input" placeholder="Dr. John Doe" required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label><Stethoscope size={15} /> Specialty</label>
              <input type="text" className="form-input" placeholder="e.g. Cardiologist" required
                value={profile.specialty}
                onChange={(e) => setProfile({ ...profile, specialty: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label><Award size={15} /> Qualifications</label>
              <input type="text" className="form-input" placeholder="MBBS, MD (comma separated)"
                value={profile.qualifications}
                onChange={(e) => setProfile({ ...profile, qualifications: e.target.value })} />
            </div>
            <div className="form-group">
              <label><Briefcase size={15} /> Years of Experience</label>
              <input type="number" className="form-input" placeholder="e.g. 10" min="0"
                value={profile.experienceYears}
                onChange={(e) => setProfile({ ...profile, experienceYears: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label><Phone size={15} /> Contact Number</label>
              <input type="text" className="form-input" placeholder="+94 77 123 4567"
                value={profile.contactNumber}
                onChange={(e) => setProfile({ ...profile, contactNumber: e.target.value })} />
            </div>
            <div className="form-group">
              <label><DollarSign size={15} /> Consultation Fee (LKR)</label>
              <input type="number" className="form-input" placeholder="e.g. 3500" min="0"
                value={profile.consultationFee}
                onChange={(e) => setProfile({ ...profile, consultationFee: e.target.value })} />
            </div>
          </div>

          <div className="profile-actions">
            {saved && <span className="save-success-msg">✓ Profile updated successfully!</span>}
            <button type="submit" className="btn btn-primary btn-lg">
              <Save size={18} /> Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorProfile;
