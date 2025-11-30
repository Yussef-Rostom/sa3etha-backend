const express = require("express");
const router = express.Router();
const locationController = require("../controllers/locationController");

router.get("/governorates", locationController.getAllGovernorates);

module.exports = router;
