const { createCampus, getAllCampuses, getCampusById, updateCampus, deleteCampus } = require('../services/campus.service');
const STATUS_MESSAGES = require('../constants/status.messages');

const createCampusController = async (req, res) => {
    const {name, city, colleges} = req.body;
    try {
        const campus = await createCampus(name, city, colleges);
        return res.status(STATUS_MESSAGES.CREATED).json({
            message: "Campus created successfully",
            campus
        });
    }catch (error) {
        console.error("Create Campus Error:", error);
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({ message: "Failed to create campus", error: error.message });
    }
}


const getAllCampusesController = async (req, res) => {
    try{
        const campuses = await getAllCampuses();
        return res.status(STATUS_MESSAGES.OK).json({
            message: "Campuses fetched successfully",
            campuses
        });
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({message: "failed to fetch campuses", error: error.message})
    }
}


const getCampusByIdController = async (req, res) => {
    const campusId = req.params.campusId;
    try{
        const campus = await getCampusById(campusId);
        return res.status(STATUS_MESSAGES.OK).json({
            massafe:"Your Campus:", campus
        });
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({message: "failed to fetch the wanted campus", error: error.message})
    }
}


const updateCampusController = async (req, res) => {
    const campusId = req.params.campusId;
    const {name, city} = req.body;
    try{
        const updatedCampus = await updateCampus(campusId, name, city);
        return res.status(STATUS_MESSAGES.OK).json({
            message: "Campus updated successfully",
            updatedCampus
        })
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({message: "failed to update the campus" , error: error.message})
    }
}


const deleteCampusController = async (req, res) => {
    const campusId = req.params.campusId;
    try{
        const deletedCampus = await deleteCampus(campusId);
        return res.status(STATUS_MESSAGES.OK).json({
            message: "Campus deleted successfully",
            deletedCampus
        });
    }catch(error){
            return res.status(STATUS_MESSAGES.BAD_REQUEST).json({message: "failed to delete the campus" , error: error.message})
    }
}

module.exports = { createCampusController, getAllCampusesController, getCampusByIdController, updateCampusController, deleteCampusController };