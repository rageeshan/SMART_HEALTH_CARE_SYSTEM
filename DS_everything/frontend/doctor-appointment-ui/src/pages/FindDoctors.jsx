import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, ArrowRight, Briefcase, DollarSign } from 'lucide-react';

const SPECIALTIES = [
  'All', 'Cardiologist', 'Dermatologist', 'Pediatrician',
  'Neurologist', 'Orthopedic', 'Psychiatrist', 'General Physician',
];

const FindDoctors = () => {
  const { doctors, bookAppointment } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingData, setBookingData] = useState({ date: '', timeSlot: '', symptoms: '' });
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const handleBook = (e) => {
    e.preventDefault();
    bookAppointment(selectedDoctor._id, bookingData);
    setBookingSuccess(true);
    setTimeout(() => {
      setSelectedDoctor(null);
      setBookingSuccess(false);
      setBookingData({ date: '', timeSlot: '', symptoms: '' });
    }, 2000);
  };

  const filteredDoctors = doctors.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'All' || d.specialty === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const getInitials = (name) =>
    name.replace('Dr. ', '').split(' ').map((n) => n[0]).join('');

  const avatarColors = ['#4F46E5', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2'];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Find a Doctor</h1>
          <p className="page-subtitle">Search by name or specialty and book your appointment</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-bar-wrapper glass-panel">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search by doctor name or specialty..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Specialty Filters */}
      <div className="filter-chips">
        {SPECIALTIES.map((spec) => (
          <button
            key={spec}
            className={`filter-chip${activeFilter === spec ? ' active' : ''}`}
            onClick={() => setActiveFilter(spec)}
          >
            {spec}
          </button>
        ))}
      </div>

      <p className="results-count">{filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} found</p>

      {/* Doctor Cards Grid */}
      <div className="grid-cards">
        {filteredDoctors.map((doctor, i) => (
          <div key={doctor._id} className="glass-panel doctor-card fade-in" style={{ animationDelay: `${i * 0.07}s` }}>
            <div className="doctor-header">
              <div className="doctor-avatar" style={{ background: avatarColors[i % avatarColors.length] }}>
                {getInitials(doctor.name)}
              </div>
              <div>
                <h3 className="doctor-name">{doctor.name}</h3>
                <span className="doctor-specialty-tag">{doctor.specialty}</span>
              </div>
            </div>

            <div className="doctor-meta">
              <div className="meta-row">
                <Briefcase size={15} />
                <span>{doctor.experienceYears} years experience</span>
              </div>
              <div className="meta-row">
                <DollarSign size={15} />
                <span>LKR {doctor.consultationFee?.toLocaleString() || '—'}</span>
              </div>
              {doctor.qualifications && (
                <div className="qualification-tags">
                  {doctor.qualifications.map((q) => (
                    <span key={q} className="qual-tag">{q}</span>
                  ))}
                </div>
              )}
            </div>

            <button className="btn btn-primary btn-block" onClick={() => setSelectedDoctor(doctor)}>
              Book Appointment <ArrowRight size={16} />
            </button>
          </div>
        ))}
      </div>

      {filteredDoctors.length === 0 && (
        <div className="empty-state">
          <Search size={48} />
          <h3>No doctors found</h3>
          <p>Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Booking Modal */}
      {selectedDoctor && (
        <div className="modal-overlay" onClick={() => !bookingSuccess && setSelectedDoctor(null)}>
          <div className="modal-content fade-in" onClick={(e) => e.stopPropagation()}>
            {bookingSuccess ? (
              <div className="booking-success">
                <div className="success-icon">✓</div>
                <h2>Appointment Booked!</h2>
                <p>Your appointment with {selectedDoctor.name} has been submitted. Check "My Appointments" to track it.</p>
              </div>
            ) : (
              <>
                <div className="modal-header">
                  <h2>Book Appointment</h2>
                  <button className="modal-close" onClick={() => setSelectedDoctor(null)}>✕</button>
                </div>
                <div className="modal-doctor-info">
                  <div className="doctor-avatar-sm" style={{ background: '#4F46E5' }}>
                    {getInitials(selectedDoctor.name)}
                  </div>
                  <div>
                    <h4>{selectedDoctor.name}</h4>
                    <span className="text-muted">{selectedDoctor.specialty}</span>
                  </div>
                </div>
                <form onSubmit={handleBook}>
                  <div className="form-group">
                    <label>Preferred Date</label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={bookingData.date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Time Slot</label>
                    <select className="form-input" required value={bookingData.timeSlot}
                      onChange={(e) => setBookingData({ ...bookingData, timeSlot: e.target.value })}>
                      <option value="">Select a time slot</option>
                      <option value="08:00 - 08:30">08:00 – 08:30 AM</option>
                      <option value="08:30 - 09:00">08:30 – 09:00 AM</option>
                      <option value="09:00 - 09:30">09:00 – 09:30 AM</option>
                      <option value="09:30 - 10:00">09:30 – 10:00 AM</option>
                      <option value="10:00 - 10:30">10:00 – 10:30 AM</option>
                      <option value="10:30 - 11:00">10:30 – 11:00 AM</option>
                      <option value="14:00 - 14:30">02:00 – 02:30 PM</option>
                      <option value="14:30 - 15:00">02:30 – 03:00 PM</option>
                      <option value="15:00 - 15:30">03:00 – 03:30 PM</option>
                      <option value="15:30 - 16:00">03:30 – 04:00 PM</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Describe Your Symptoms</label>
                    <textarea className="form-input" rows="3" placeholder="Brief description of your symptoms..."
                      required value={bookingData.symptoms}
                      onChange={(e) => setBookingData({ ...bookingData, symptoms: e.target.value })}></textarea>
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn btn-outline" onClick={() => setSelectedDoctor(null)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Confirm Booking</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FindDoctors;
