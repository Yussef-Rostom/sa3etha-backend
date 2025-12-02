const { GOVERNORATES } = require("../constants/governorates");

exports.getAllGovernorates = (req, res) => {
    try {
        res.status(200).json({
            governorates: GOVERNORATES,
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};
