const Service = require("../models/Service");
const SubService = require("../models/SubService");

// Get all services
const getAllServices = async (req, res) => {
  try {
    const services = await Service.find();
    res.status(200).json({ services });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add a new service
const addService = async (req, res) => {
  try {
    const { name, icon, description, subservices } = req.body;
    const service = new Service({ name, icon, description, subservices });
    await service.save();
    res.status(201).json({ message: "Service added successfully", service });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getSubServices = async (req, res) => {
  try {
    const subServices = await SubService.find();
    res.status(200).json({ subServices });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message, error });
  }
};

const getSubServicesByServiceId = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const subServices = await SubService.find({ service: serviceId });
    res.status(200).json({ subServices });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message, error });
  }
};

module.exports = {
  getAllServices,
  addService,
  getSubServices,
  getSubServicesByServiceId,
};
