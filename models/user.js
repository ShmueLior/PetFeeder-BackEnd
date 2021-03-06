const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
var uniqueValidator = require("mongoose-unique-validator");
const Schema = mongoose.Schema;

const saltRounds = 10;

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: { type: String, required: true },
  phone: { type: String },
  notifications: [
    {
      dogInfo: { type: Schema.Types.ObjectId, ref: "Dog" },
      dogName: { type: String },
      dogImage: { type: String },
      title: { type: String },
      body: { type: String },
      date: { type: Date },
      isAlreadyBeenRead: { type: Boolean },
    },
  ],
});

userSchema.plugin(uniqueValidator);

userSchema.pre("save", function (next) {
  var user = this;

  if (!user.isModified("password")) return next();

  bcrypt.hash(user.password, saltRounds, function (err, hash) {
    if (err) {
      return next(err);
    }
    user.password = hash;
    next();
  });
});

userSchema.methods.checkPassword = function (candidatePassword) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
      if (err) return reject(err);
      resolve(isMatch);
    });
  });
};

module.exports = mongoose.model("User", userSchema);
