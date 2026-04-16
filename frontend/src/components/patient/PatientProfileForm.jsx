import { Input } from '../ui/Input.jsx'
import { Select } from '../ui/Select.jsx'
import { emptyPatientProfile } from './models.js'

export function PatientProfileForm({ value, onChange, errors = {} }) {
  const v = value ?? emptyPatientProfile

  const set = (key, next) => onChange?.({ ...v, [key]: next })
  const setEmergency = (key, next) =>
    onChange?.({ ...v, emergencyContact: { ...(v.emergencyContact ?? {}), [key]: next } })

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input
        label="Full name"
        name="fullName"
        value={v.fullName}
        onChange={(e) => set('fullName', e.target.value)}
        error={errors.fullName}
      />
      <Input
        label="Phone"
        name="phone"
        value={v.phone}
        onChange={(e) => set('phone', e.target.value)}
        error={errors.phone}
      />
      <Input
        label="Date of birth"
        name="dob"
        type="date"
        value={v.dob}
        onChange={(e) => set('dob', e.target.value)}
        error={errors.dob}
      />
      <Select
        label="Gender"
        name="gender"
        value={v.gender}
        onChange={(e) => set('gender', e.target.value)}
        error={errors.gender}
      >
        <option value="">Select</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </Select>
      <Input
        label="Address"
        name="address"
        value={v.address}
        onChange={(e) => set('address', e.target.value)}
        error={errors.address}
        className="sm:col-span-2"
      />
      <Select
        label="Blood group"
        name="bloodGroup"
        value={v.bloodGroup}
        onChange={(e) => set('bloodGroup', e.target.value)}
        error={errors.bloodGroup}
      >
        <option value="">Select</option>
        <option value="A+">A+</option>
        <option value="A-">A-</option>
        <option value="B+">B+</option>
        <option value="B-">B-</option>
        <option value="AB+">AB+</option>
        <option value="AB-">AB-</option>
        <option value="O+">O+</option>
        <option value="O-">O-</option>
      </Select>
      <Input
        label="Allergies"
        name="allergies"
        value={v.allergies}
        onChange={(e) => set('allergies', e.target.value)}
        hint="Comma-separated (optional)"
      />

      <div className="sm:col-span-2">
        <div className="mt-2 text-sm font-semibold text-slate-900">
          Emergency contact
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Input
            label="Name"
            name="emergencyContact.name"
            value={v.emergencyContact?.name ?? ''}
            onChange={(e) => setEmergency('name', e.target.value)}
          />
          <Input
            label="Relationship"
            name="emergencyContact.relationship"
            value={v.emergencyContact?.relationship ?? ''}
            onChange={(e) => setEmergency('relationship', e.target.value)}
          />
          <Input
            label="Phone"
            name="emergencyContact.phone"
            value={v.emergencyContact?.phone ?? ''}
            onChange={(e) => setEmergency('phone', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}

