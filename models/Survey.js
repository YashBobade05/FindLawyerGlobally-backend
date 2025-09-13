import mongoose from "mongoose";

const surveySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    yearsOfExperience: { type: Number, required: true },
    specialization: { type: String, required: true },
    location: { type: String, required: true },
    answers: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

const Survey = mongoose.model("Survey", surveySchema);
export default Survey;
