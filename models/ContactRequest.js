const mongoose = require("mongoose");

const contactRequestSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    expert: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    service: {
      type: mongoose.Schema.ObjectId,
      ref: "SubService",
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: [Number], // [lng, lat]
    },

    status: {
      type: String,
      enum: [
        "initiated",
        "expert_responded",
        "client_responded",
        "confirmed",
        "denied",
        "disputed",
      ],
      default: "initiated",
    },

    expertResponse: {
      type: Boolean,
    },
    clientResponse: {
      type: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

contactRequestSchema.index({ status: 1, createdAt: 1 });

const ContactRequest = mongoose.model("ContactRequest", contactRequestSchema);
module.exports = ContactRequest;
