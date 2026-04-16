const validGenders = ["male", "female", "other"];
const validBloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const validMedicalStatus = ["active", "resolved"];

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const isValidDate = (value) => !isNaN(Date.parse(value));

export const validateCreatePatientProfile = (data) => {
  const errors = [];

  if (!isNonEmptyString(data.fullName)) {
    errors.push("fullName is required and must be a non-empty string");
  }

  if (data.phone !== undefined && typeof data.phone !== "string") {
    errors.push("phone must be a string");
  }

  if (data.dob !== undefined && !isValidDate(data.dob)) {
    errors.push("dob must be a valid date");
  }

  if (data.gender !== undefined && !validGenders.includes(data.gender)) {
    errors.push("gender must be one of: male, female, other");
  }

  if (data.address !== undefined && typeof data.address !== "string") {
    errors.push("address must be a string");
  }

  if (
    data.bloodGroup !== undefined &&
    !validBloodGroups.includes(data.bloodGroup)
  ) {
    errors.push("bloodGroup must be a valid blood group");
  }

  if (data.allergies !== undefined && !Array.isArray(data.allergies)) {
    errors.push("allergies must be an array of strings");
  }

  if (
    Array.isArray(data.allergies) &&
    data.allergies.some((item) => typeof item !== "string")
  ) {
    errors.push("allergies must contain only strings");
  }

  if (data.emergencyContact !== undefined) {
    if (typeof data.emergencyContact !== "object" || data.emergencyContact === null) {
      errors.push("emergencyContact must be an object");
    } else {
      const { name, relationship, phone } = data.emergencyContact;

      if (name !== undefined && typeof name !== "string") {
        errors.push("emergencyContact.name must be a string");
      }

      if (relationship !== undefined && typeof relationship !== "string") {
        errors.push("emergencyContact.relationship must be a string");
      }

      if (phone !== undefined && typeof phone !== "string") {
        errors.push("emergencyContact.phone must be a string");
      }
    }
  }

  return errors;
};

export const validateUpdatePatientProfile = (data) => {
  const errors = [];
  const allowedFields = [
    "fullName",
    "phone",
    "dob",
    "gender",
    "address",
    "bloodGroup",
    "allergies",
    "emergencyContact",
  ];

  const receivedFields = Object.keys(data);

  if (receivedFields.length === 0) {
    errors.push("At least one field is required to update profile");
  }

  receivedFields.forEach((field) => {
    if (!allowedFields.includes(field)) {
      errors.push(`${field} is not allowed to be updated`);
    }
  });

  if (data.fullName !== undefined && !isNonEmptyString(data.fullName)) {
    errors.push("fullName must be a non-empty string");
  }

  if (data.phone !== undefined && typeof data.phone !== "string") {
    errors.push("phone must be a string");
  }

  if (data.dob !== undefined && !isValidDate(data.dob)) {
    errors.push("dob must be a valid date");
  }

  if (data.gender !== undefined && !validGenders.includes(data.gender)) {
    errors.push("gender must be one of: male, female, other");
  }

  if (data.address !== undefined && typeof data.address !== "string") {
    errors.push("address must be a string");
  }

  if (
    data.bloodGroup !== undefined &&
    !validBloodGroups.includes(data.bloodGroup)
  ) {
    errors.push("bloodGroup must be a valid blood group");
  }

  if (data.allergies !== undefined && !Array.isArray(data.allergies)) {
    errors.push("allergies must be an array of strings");
  }

  if (
    Array.isArray(data.allergies) &&
    data.allergies.some((item) => typeof item !== "string")
  ) {
    errors.push("allergies must contain only strings");
  }

  if (data.emergencyContact !== undefined) {
    if (typeof data.emergencyContact !== "object" || data.emergencyContact === null) {
      errors.push("emergencyContact must be an object");
    } else {
      const { name, relationship, phone } = data.emergencyContact;

      if (name !== undefined && typeof name !== "string") {
        errors.push("emergencyContact.name must be a string");
      }

      if (relationship !== undefined && typeof relationship !== "string") {
        errors.push("emergencyContact.relationship must be a string");
      }

      if (phone !== undefined && typeof phone !== "string") {
        errors.push("emergencyContact.phone must be a string");
      }
    }
  }

  return errors;
};

export const validateAddMedicalHistory = (data) => {
  const errors = [];

  if (!isNonEmptyString(data.condition)) {
    errors.push("condition is required and must be a non-empty string");
  }

  if (data.diagnosisDate !== undefined && !isValidDate(data.diagnosisDate)) {
    errors.push("diagnosisDate must be a valid date");
  }

  if (data.treatment !== undefined && typeof data.treatment !== "string") {
    errors.push("treatment must be a string");
  }

  if (data.medications !== undefined && !Array.isArray(data.medications)) {
    errors.push("medications must be an array of strings");
  }

  if (
    Array.isArray(data.medications) &&
    data.medications.some((item) => typeof item !== "string")
  ) {
    errors.push("medications must contain only strings");
  }

  if (data.notes !== undefined && typeof data.notes !== "string") {
    errors.push("notes must be a string");
  }

  if (
    data.status !== undefined &&
    !validMedicalStatus.includes(data.status)
  ) {
    errors.push("status must be either active or resolved");
  }

  return errors;
};

export const validateUpdateMedicalHistory = (data) => {
  const errors = [];
  const allowedFields = [
    "condition",
    "diagnosisDate",
    "treatment",
    "medications",
    "notes",
    "status",
  ];

  const receivedFields = Object.keys(data);

  if (receivedFields.length === 0) {
    errors.push("At least one field is required to update medical history");
  }

  receivedFields.forEach((field) => {
    if (!allowedFields.includes(field)) {
      errors.push(`${field} is not allowed to be updated`);
    }
  });

  if (data.condition !== undefined && !isNonEmptyString(data.condition)) {
    errors.push("condition must be a non-empty string");
  }

  if (data.diagnosisDate !== undefined && !isValidDate(data.diagnosisDate)) {
    errors.push("diagnosisDate must be a valid date");
  }

  if (data.treatment !== undefined && typeof data.treatment !== "string") {
    errors.push("treatment must be a string");
  }

  if (data.medications !== undefined && !Array.isArray(data.medications)) {
    errors.push("medications must be an array of strings");
  }

  if (
    Array.isArray(data.medications) &&
    data.medications.some((item) => typeof item !== "string")
  ) {
    errors.push("medications must contain only strings");
  }

  if (data.notes !== undefined && typeof data.notes !== "string") {
    errors.push("notes must be a string");
  }

  if (
    data.status !== undefined &&
    !validMedicalStatus.includes(data.status)
  ) {
    errors.push("status must be either active or resolved");
  }

  return errors;
};