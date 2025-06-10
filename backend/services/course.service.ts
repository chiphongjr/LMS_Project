import { Course } from "../models/course.model"

export const createCourse=async(data:any)=>{
    const course=await Course.create(data);
    return course;
}