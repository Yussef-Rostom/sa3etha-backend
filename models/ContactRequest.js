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
      type: Boolean, // true = deal, false = no deal
    },
    clientResponse: {
      type: Boolean,
    },

    // Follow-up System Fields
    expertCheckSentAt: {
      type: Date,
    },
    expertResponseAt: {
      type: Date,
    },
    dealDate: {
      type: Date,
    },
    customerReviewRequested: {
      type: Boolean,
      default: false,
    },
    customerConfirmedNoDeal: {
      type: Boolean,
    },
    customerResponseAt: {
      type: Date,
    },
    isReviewed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

contactRequestSchema.index({ status: 1, createdAt: 1 });

const ContactRequest = mongoose.model("ContactRequest", contactRequestSchema);
module.exports = ContactRequest;
