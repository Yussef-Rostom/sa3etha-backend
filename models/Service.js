const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A service name is required (e.g., Electrician)"],
      trim: true,
      unique: true,
    },
    icon: {
      type: String,
      default: "placeholder.png",
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

const Service = mongoose.model("Service", serviceSchema);
module.exports = Service;
