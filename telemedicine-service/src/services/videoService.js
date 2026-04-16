const crypto = require("crypto");

const createRoom = () => {
  // Add random entropy to avoid collisions under high concurrency.
  const suffix = crypto.randomBytes(4).toString("hex");
  const roomId = `med_${Date.now()}_${suffix}`;
  return {
    roomId,
    url: `https://meet.jit.si/${roomId}`
  };
};

module.exports = { createRoom };
