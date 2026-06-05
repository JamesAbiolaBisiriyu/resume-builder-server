

// File Purpose: Mongoose schema for application users and password comparison helpers.
import mongoose from "mongoose";
import bycrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: {
    type: String, required: true},
    email: {
    type: String, required: true, unique: true},
    password: { type: String, required: true},
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: null },
    verificationTokenExpiry: { type: Date, default: null },
}, {timestamps: true});

userSchema.methods.comparedPassword = function (password){
  return bycrypt.compareSync(password, this.password);
}

const User = mongoose.model("User", userSchema);

export default User;

