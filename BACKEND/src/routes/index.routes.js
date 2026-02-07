const express = require("express");

const router = express.Router();

const authRoutes = require("./auth.routes");
const otpRoutes = require('./otp.routes');

const campusRoutes = require("./campus.routes");
const collegeRoutes = require("./college.routes");
const departmentRoutes = require("./department.routes");
const classroomRoutes = require("./classroom.routes");
const courseRoutes = require("./course.routes");
const sessionRoutes = require("./session.routes");
const scheduleRoutes = require("./schedule.routes");

const studentGroupRoutes = require("./studentGroup.routes");
const instructorRoutes = require("./instructor.routes");
const userRoutes = require("./user.routes");
const importRoutes = require("./import.routes");


router.use("/auth", authRoutes);
router.use('/otp', otpRoutes);
router.use("/campus", campusRoutes);
router.use("/college", collegeRoutes);
router.use("/department", departmentRoutes);
router.use("/classroom", classroomRoutes);
router.use("/course", courseRoutes)
router.use("/session", sessionRoutes);
router.use("/schedule", scheduleRoutes);
router.use("/studentGroup", studentGroupRoutes);
router.use("/instructor", instructorRoutes);
router.use("/user", userRoutes);
router.use("/import", importRoutes);

module.exports = router;