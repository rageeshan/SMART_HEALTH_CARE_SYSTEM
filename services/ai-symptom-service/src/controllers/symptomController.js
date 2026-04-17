import getOpenAI from "../config/openai.js";
import SymptomCheck from "../models/SymptomCheck.js";

const normalizeSymptoms = (input) => {
  if (Array.isArray(input)) {
    return input.map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof input === "string") {
    return input
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

// POST /api/symptoms/check
export const checkSymptoms = async (req, res) => {
  const { symptoms: rawSymptoms, additionalNotes, patientId } = req.body;

  if (!patientId || !String(patientId).trim()) {
    return res.status(400).json({ message: "patientId is required" });
  }

  const symptoms = normalizeSymptoms(rawSymptoms);

  if (symptoms.length === 0) {
    return res.status(400).json({ message: "Please provide at least one symptom" });
  }

  const openai = getOpenAI();
  if (!openai) {
    return res.status(500).json({ message: "OPENAI_API_KEY is not configured" });
  }

  const symptomList = symptoms.join(", ");
  const prompt = `
You are a medical assistant AI integrated into a Sri Lankan telemedicine platform.
A patient has reported the following symptoms: ${symptomList}.
${additionalNotes ? `Additional notes from patient: ${additionalNotes}` : ""}

Please respond ONLY in the following JSON format (no extra text):
{
  "possibleConditions": ["condition1", "condition2"],
  "recommendedSpecialties": ["specialty1", "specialty2"],
  "urgencyLevel": "low" | "medium" | "high",
  "advice": "Brief general advice for the patient",
  "disclaimer": "This is not a medical diagnosis. Please consult a qualified doctor."
}

Rules:
- List 2-4 possible conditions based on the symptoms
- List 1-3 doctor specialties the patient should consult
- urgencyLevel: high = go to ER immediately, medium = see a doctor within 24-48hrs, low = book an appointment
- Keep advice friendly, brief, and non-alarming
- Always include the disclaimer
`.trim();

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful medical assistant. Always respond with valid JSON only. Never add extra explanation outside the JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const rawText = completion.choices[0]?.message?.content?.trim() ?? "";
    let aiResponse;

    try {
      aiResponse = JSON.parse(rawText);
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0]);
      } else {
        return res.status(500).json({
          message: "AI returned an unexpected format. Please try again.",
        });
      }
    }

    const symptomCheck = await SymptomCheck.create({
      patientId: String(patientId).trim(),
      symptoms,
      additionalNotes: additionalNotes ? String(additionalNotes).trim() : "",
      aiResponse,
      rawPrompt: prompt,
    });

    res.status(200).json({
      checkId: symptomCheck._id,
      symptoms,
      aiResponse,
      checkedAt: symptomCheck.createdAt,
    });
  } catch (err) {
    const status = err?.status ?? err?.statusCode;
    if (status === 401) {
      return res.status(500).json({ message: "Invalid OpenAI API key. Check your .env file." });
    }
    console.error("AI ERROR:", err?.message || err);
    res.status(500).json({
      message: "AI service error",
      error: err?.message || String(err),
    });
  }
};

// GET /api/symptoms/history?patientId=...
export const getMyHistory = async (req, res) => {
  try {
    const { patientId } = req.query;

    if (!patientId) {
      return res.status(400).json({ message: "patientId query param is required" });
    }

    const history = await SymptomCheck.find({ patientId })
      .sort({ createdAt: -1 })
      .select("-rawPrompt");

    res.status(200).json(history);
  } catch (err) {
    res.status(500).json({ message: "Error fetching history", error: err.message });
  }
};

// GET /api/symptoms/history/:id?patientId=...
export const getCheckById = async (req, res) => {
  try {
    const { patientId } = req.query;

    if (!patientId) {
      return res.status(400).json({ message: "patientId query param is required" });
    }

    const check = await SymptomCheck.findById(req.params.id).select("-rawPrompt");

    if (!check) {
      return res.status(404).json({ message: "Symptom check not found" });
    }

    if (check.patientId !== patientId) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(check);
  } catch (err) {
    res.status(500).json({ message: "Error fetching check", error: err.message });
  }
};
