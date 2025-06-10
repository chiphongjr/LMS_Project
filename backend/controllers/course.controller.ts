import cloudinary from "../utils/cloudinary";
import { createCourse } from "../services/course.service";
import { Course } from "../models/course.model";
import dotenv from "dotenv";
import { Request, Response } from "express";
import { redis } from "../utils/redis";
dotenv.config();
export const uploadCourse = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const thumbnail = data.thumbnail;
    if (!thumbnail) {
      const myCloud = await cloudinary.uploader.upload(thumbnail, {
        folder: "courses",
      });
      data.thumbnail = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }
    const course = await createCourse(data);
    if (!course) {
      res.status(404).json({ success: false, message: "Course is not found" });
    }
    res.status(200).json({ success: true, course });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// export const editCourse = async (req: Request, res: Response) => {
//   try {
//     const data = req.body;

//     const thumbnail = data.thumbnail;
//     if (thumbnail) {
//       await cloudinary.uploader.destroy(thumbnail.public_id);

//       const myCloud = await cloudinary.uploader.upload(thumbnail, {
//         folder: "courses",
//       });
//       data.thumbnail = {
//         public_id: myCloud.public_id,
//         url: myCloud.secure_url,
//       };

//       const courseId = req.params.id;

//       const course = await Course.findByIdAndUpdate(
//         courseId,
//         { $set: data },
//         { new: true }
//       );
//       res.status(200).json({ success: true, course });
//     }
//   } catch (error: any) {
//     res.status(500).json({ message: error.message });
//   }
// };

export const editCourse = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const courseId = req.params.id;

    // Nếu thumbnail là object chứa public_id (ảnh cũ), ta xóa ảnh cũ
    if (
      data.thumbnail &&
      typeof data.thumbnail === "object" &&
      data.thumbnail.public_id
    ) {
      await cloudinary.uploader.destroy(data.thumbnail.public_id);
    }

    // Nếu thumbnail là string (đường dẫn ảnh mới hoặc base64) thì upload ảnh mới
    if (data.thumbnail && typeof data.thumbnail === "string") {
      const myCloud = await cloudinary.uploader.upload(data.thumbnail, {
        folder: "courses",
      });

      data.thumbnail = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }

    const course = await Course.findByIdAndUpdate(
      courseId,
      { $set: data },
      { new: true }
    );

    res.status(200).json({ success: true, course });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

//get course without purchase
export const getSingleCourse = async (req: Request, res: Response) => {
  try {
    const courseId=req.params.id;

    const isCacheExist=await redis.get(courseId);
    if(isCacheExist){
        const course =JSON.parse(isCacheExist);
        res.status(200).json({success:true,course})
    }
    else{
        const course = await Course.findById(courseId).select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );
            await redis.set(courseId,JSON.stringify(course));

        res.status(200).json({ success: true, course });

    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

//get all course without purchase
export const getAllCourses = async (req: Request, res: Response) => {
  try {
    const isCacheExist=await redis.get("allCourses");
    if(isCacheExist){
        const courses =JSON.parse(isCacheExist);
        res.status(200).json({success:true,courses})
    }

    else{

        const courses = await Course.find().select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );
        
        await redis.set("allCourses",JSON.stringify(courses));
        res.status(200).json({ success: true, courses });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
