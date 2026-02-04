const { createCollege, getAllColleges, getCollegeById, updateCollege, deleteCollege } = require('../services/college.service');
const STATUS_MESSAGES = require('../constants/status.messages');


const createCollegeController = async (req, res) => {
    const {name, campusId} = req.body;
    try{
        const college = await createCollege(name, campusId)
        return res.status(STATUS_MESSAGES.CREATED).json({
            message: "College created successfully",
            college
        })
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: "Failed to create college",
            error: error.message
        })
    }
}

const getAllCollegesController = async (req, res) => {
    const campusId = req.params.campusId;
    try{
        const colleges = await getAllColleges(campusId);
        return res.status(STATUS_MESSAGES.OK).json({
            message: "This Is All Colleges",
            colleges
        })
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: "Failed to fetch colleges",
            error: error.message
        })
    }
}

const getCollegeByIdController = async (req, res) => {
    const collegeId = req.params.collegeId;
    try{
        const college = await getCollegeById(collegeId);
        return res.status(STATUS_MESSAGES.OK).json({
            message: "This Is The College You Wanted",
            college
        })
    }catch(erro){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: "Failed to fetch college",
            error: error.message
        })
    }
}

const updateCollegeController = async (req, res) => {
    const collegeId = req.params.collegeId;
    const {name, campusId} = req.body;
    try{
        const updatedCollege = await updateCollege(collegeId, name, campusId);
        return res.status(STATUS_MESSAGES.OK).json({
            message: "College updated successfully",
            updatedCollege
        })
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: "Failed to update college",
            error: error.message
        })
    }
}

const deleteCollegeController = async (req, res) => {
    const collegeId = req.params.collegeId;
    try{
        const deletedCollege = await deleteCollege(collegeId);
        return res.status(STATUS_MESSAGES.OK).json({
            message: "College deleted successfully",
            deletedCollege
        })
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: "Failed to delete college",
            error: error.message
        })
    }
}

module.exports = { createCollegeController, getAllCollegesController, getCollegeByIdController, updateCollegeController, deleteCollegeController };