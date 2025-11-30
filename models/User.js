const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (v) {
          return /^(?:\+20|0)?1[0-2,5]{1}[0-9]{8}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid Egyptian phone number!`,
      },
    },
    whatsapp: {
      type: String,
      validate: {
        validator: function (v) {
          return /^(?:\+20|0)?1[0-2,5]{1}[0-9]{8}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid Egyptian phone number!`,
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email!`,
      },
    },
    imageUrl: {
      type: String,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "expert", "admin"],
      default: "user",
    },
    fcmToken: {
      type: String,
      select: false,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
      governorate: String,
    },
    expertProfile: {
      serviceTypes: [
        {
          subServiceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SubService",
          },
          averagePricePerHour: {
            type: Number,
            default: 0,
          },
          yearsExperience: {
            type: Number,
            default: 0,
          },
        },
      ],
      description: String,
      isAvailable: {
        type: Boolean,
        default: true,
      },
      averageRating: {
        type: Number,
        default: 0,
      },
    },
    refreshToken: {
      type: String,
      select: false,
    },
    otp: {
      type: Number,
      select: false,
    },
    otpExpires: {
      type: Date,
      select: false,
    },
    lastSearch: {
      service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
      subService: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubService",
      },
      timestamp: Date,
    },
    lastSuggestionSentAt: Date,
  },
  {
    timestamps: true,
  },
);

userSchema.index({ location: "2dsphere" });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
