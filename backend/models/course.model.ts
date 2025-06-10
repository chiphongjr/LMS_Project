import mongoose, { Document, Model, Schema } from "mongoose";
import dotenv from "dotenv";
dotenv.config();

interface IComment extends Document {
  user: object;
  comment: string;
  commentReplies: IComment[];
}
const commentSchema = new Schema<IComment>({
  user: Object,
  comment: String,
  commentReplies: [Object],
});

interface IReview extends Document {
  user: object;
  rating: number;
  comment: string;
  commentReplies: IComment[];
}
const reviewSchema = new Schema<IReview>({
  user: Object,
  rating: { type: Number, default: 0 },
  comment: String,
});

interface ILink extends Document {
  title: string;
  url: string;
}

const linkSchema = new Schema<ILink>({
  title: String,
  url: String,
});

interface ICourseData extends Document {
  title: string;
  description: string;
  videoUrl: string;
  videoThumbnail: object;
  videoSection: string;
  videoLength: number;
  videoPlayer: string;
  links: ILink[];
  suggestion: string;
  questions: IComment[];
}
const courseDataSchema = new Schema<ICourseData>({
  videoUrl: String,
  title: String,
  videoSection: String,
  description: String,
  videoLength: Number,
  videoPlayer: String,
  links: [linkSchema],
  suggestion: String,
  questions: [commentSchema],
});

interface ICourse extends Document {
  coursename: string;
  description: string;
  price: number;
  estiminatedPrice?: number;
  thumbnail: object;
  tags: string;
  level: string;
  demoUrl: string;
  benefits: { title: string }[];
  prerequisites: { title: string }[];
  reviews: IReview[];
  courseData: ICourseData[];
  ratings?: number;
  purchased?: number;
}

const courseSchema = new Schema<ICourse>({
  coursename: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  estiminatedPrice: { type: Number },
  thumbnail: {
    public_id: { type: String },
    url: { type: String},
  },
  tags: { type: String, required: true },
  level: { type: String, required: true },
  demoUrl: { type: String, required: true },
  benefits: [{ title: String }],
  prerequisites: [{ title: String }],
  reviews: [reviewSchema],
  courseData: [courseDataSchema],
  ratings: { type: Number, default: 0 },
  purchased: { type: Number, default: 0 },
});

export const Course: Model<ICourse> = mongoose.model("Course", courseSchema);
