const { governorateNames } = require("../utils/locationHelper");

exports.getAllGovernorates = (req, res) => {
    try {
        res.status(200).json({
            governorates: governorateNames,
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};
