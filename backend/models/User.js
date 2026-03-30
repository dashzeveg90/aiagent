const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Нэрээ оруулна уу"],
      trim: true,
      maxlength: [80, "Нэр 80 тэмдэгтээс хэтрэхгүй байх ёстой"],
    },
    email: {
      type: String,
      required: [true, "И-мэйл хаягаа оруулна уу"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Нууц үгээ оруулна уу"],
      minlength: [6, "Нууц үг 6-аас дээш тэмдэгттэй байх ёстой"],
      select: false,
    },
    role: {
      type: String,
      enum: ["superadmin", "company_admin"],
      default: "company_admin",
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
  },
  {
    timestamps: true,
  },
);

UserSchema.pre("save", async function savePassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.getSignedJwtToken = function getSignedJwtToken() {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

UserSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
