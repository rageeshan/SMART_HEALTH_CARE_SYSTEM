import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Clock, Plus, Trash2, Save } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ManageAvailability = () => {
  const [slots, setSlots] = useState([]);
  const [, setLoading] = useState(true);
  const [newSlot, setNewSlot] = useState({ dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00' });
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    // Fetch doctor's availability via their profile
    api
      .get('/doctors/me')
      .then((res) => {
        if (res.data && res.data.availability) {
          setSlots(res.data.availability);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch availability', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAddSlot = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/doctors/availability', newSlot);
      setSlots([...slots, res.data]);
      setShowAdd(false);
      setNewSlot({ dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/doctors/availability/${id}`);
      setSlots(slots.filter((s) => s._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Group slots by day
  const grouped = DAYS.reduce((acc, day) => {
    acc[day] = slots.filter((s) => s.dayOfWeek === day);
    return acc;
  }, {});

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Availability</h1>
          <p className="page-subtitle">Set your weekly schedule so patients can book slots</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={18} /> Add Slot
        </button>
      </div>

      <div className="availability-grid">
        {DAYS.map((day) => (
          <div key={day} className={`glass-panel avail-day-card${grouped[day].length > 0 ? ' has-slots' : ''}`}>
            <h3 className="avail-day-title">{day}</h3>
            {grouped[day].length === 0 ? (
              <p className="text-muted avail-empty">No slots</p>
            ) : (
              <div className="avail-slots">
                {grouped[day].map((slot) => (
                  <div key={slot._id} className="avail-slot-chip">
                    <Clock size={14} />
                    <span>{slot.startTime} – {slot.endTime}</span>
                    <button className="slot-delete" onClick={() => handleDelete(slot._id)} title="Remove">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Availability Slot</h2>
              <button className="modal-close" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <form onSubmit={handleAddSlot}>
              <div className="form-group">
                <label>Day of Week</label>
                <select className="form-input" value={newSlot.dayOfWeek} onChange={(e) => setNewSlot({ ...newSlot, dayOfWeek: e.target.value })}>
                  {DAYS.map((d) => (<option key={d} value={d}>{d}</option>))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Start Time</label>
                  <input type="time" className="form-input" value={newSlot.startTime} onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input type="time" className="form-input" value={newSlot.endTime} onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })} required />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Save size={16} /> Save Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAvailability;
