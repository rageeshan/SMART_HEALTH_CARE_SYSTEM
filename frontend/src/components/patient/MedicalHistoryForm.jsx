import { Input } from '../ui/Input.jsx'
import { Select } from '../ui/Select.jsx'
import { emptyMedicalRecord } from './models.js'

export function MedicalHistoryForm({ value, onChange, errors = {} }) {
  const v = value ?? emptyMedicalRecord
  const set = (key, next) => onChange?.({ ...v, [key]: next })

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input
        label="Condition"
        name="condition"
        value={v.condition}
        onChange={(e) => set('condition', e.target.value)}
        error={errors.condition}
      />
      <Input
        label="Diagnosis date"
        name="diagnosisDate"
        type="date"
        value={v.diagnosisDate}
        onChange={(e) => set('diagnosisDate', e.target.value)}
        error={errors.diagnosisDate}
      />
      <Input
        label="Treatment"
        name="treatment"
        value={v.treatment}
        onChange={(e) => set('treatment', e.target.value)}
      />
      <Input
        label="Medications"
        name="medications"
        value={v.medications}
        onChange={(e) => set('medications', e.target.value)}
      />
      <Input
        label="Notes"
        name="notes"
        value={v.notes}
        onChange={(e) => set('notes', e.target.value)}
        className="sm:col-span-2"
      />
      <Select
        label="Status"
        name="status"
        value={v.status}
        onChange={(e) => set('status', e.target.value)}
      >
        <option value="active">Active</option>
        <option value="resolved">Resolved</option>
        <option value="chronic">Chronic</option>
      </Select>
    </div>
  )
}

