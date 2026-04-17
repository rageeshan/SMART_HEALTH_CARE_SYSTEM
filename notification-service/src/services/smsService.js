const sendSMS = async (to, message) => {
  console.log(`SMS sent to ${to}: ${message}`);
  return { to, message, provider: "mock" };
};

module.exports = { sendSMS };
