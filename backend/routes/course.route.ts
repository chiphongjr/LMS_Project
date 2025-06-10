import express from "express";
import {
  editCourse,
  getAllCourses,
  getSingleCourse,
  uploadCourse,
} from "../controllers/course.controller";
import { isAuthenticated } from "../middlewares/auth";
const courseRouter = express.Router();

courseRouter.post("/create-course", isAuthenticated, uploadCourse);
courseRouter.put("/edit-course/:id", isAuthenticated, editCourse);
courseRouter.get("/get-course/:id", getSingleCourse);
courseRouter.get("/get-all-courses", getAllCourses);

export default courseRouter;
