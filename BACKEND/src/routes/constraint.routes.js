const express = require('express');
const {
    getAllConstraintsController,
    createConstraintController,
    updateConstraintController,
    deleteConstraintController
} = require('../controllers/constraint.controller');

const router = express.Router();

router.get('/', getAllConstraintsController);
router.post('/', createConstraintController);
router.put('/:id', updateConstraintController);
router.delete('/:id', deleteConstraintController);

module.exports = router;
