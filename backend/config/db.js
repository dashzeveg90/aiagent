const mongoose = require("mongoose");
const { User } = require("../models");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB холбогдлоо: ${conn.connection.host}`);

    await ensureSuperadmin();
  } catch (error) {
    console.error(`MongoDB холбогдох алдаа: ${error.message}`);
    process.exit(1);
  }
};

async function ensureSuperadmin() {
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;
  const name = process.env.SUPERADMIN_NAME || "Platform Superadmin";

  if (!email || !password) {
    return;
  }

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== "superadmin") {
      existing.role = "superadmin";
      await existing.save();
    }
    return;
  }

  await User.create({
    name,
    email,
    password,
    role: "superadmin",
  });

  console.log(`Superadmin seed хийгдлээ: ${email}`);
}

module.exports = connectDB;
