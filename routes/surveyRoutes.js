import express from "express";
import Survey from "../models/Survey.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { Parser } from "json2csv";
import PDFDocument from "pdfkit";

const router = express.Router();



router.post("/submit", protect, async (req, res) => {
  try {
    const { yearsOfExperience, specialization, location, answers } = req.body;

 
    const existingSurvey = await Survey.findOne({ user: req.user._id });
    if (existingSurvey) {
      return res.status(400).json({ message: "Survey already submitted" });
    }

    const survey = new Survey({
      user: req.user._id,
      yearsOfExperience,
      specialization,
      location,
      answers,
    });

    await survey.save();
    res.status(201).json({ message: "Survey submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



router.get("/my", protect, async (req, res) => {
  try {
    const survey = await Survey.findOne({ user: req.user._id }).populate("user", "name email");
    if (!survey) {
      return res.status(404).json({ message: "No survey found" });
    }
    res.json(survey);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 *  Get all surveys (Admin only)
 * Example: /api/surveys?specialization=Corporate Law&location=Delhi&minExp=5
 */
router.get("/", protect, admin, async (req, res) => {
  try {
    const { specialization, location, minExp } = req.query;

    
    let filter = {};

    if (specialization) {
      filter.specialization = { $regex: new RegExp(`^${specialization}$`, "i") };
    }

    if (location) {
      filter.location = { $regex: new RegExp(`^${location}$`, "i") };
    }

    if (minExp) {
      filter.yearsOfExperience = { $gte: Number(minExp) };
    }

    const surveys = await Survey.find(filter).populate("user", "name email role");

    res.json(surveys);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


//  Export surveys (Admin only)
router.get("/export", protect, admin, async (req, res) => {
  try {
    const { specialization, location, minExp, format } = req.query;

    // Build filter
    let filter = {};
    if (specialization) filter.specialization = specialization;
    if (location) filter.location = location;
    if (minExp) filter.yearsOfExperience = { $gte: Number(minExp) };

    const surveys = await Survey.find(filter)
      .populate("user", "name email role")
      .lean(); // Convert to plain JS objects for json2csv

    if (!surveys.length) {
      return res.status(404).json({ message: "No surveys found" });
    }

    // CSV Export
    if (!format || format === "csv") {
      const fields = [
        "user.name",
        "user.email",
        "yearsOfExperience",
        "specialization",
        "location",
        "answers"
      ];
      const opts = { fields };
      const parser = new Parser(opts);
      const csv = parser.parse(surveys);

      res.header("Content-Type", "text/csv");
      res.attachment("surveys.csv");
      return res.send(csv);
    }

     //  PDF Export
    if (format === "pdf") {
      const doc = new PDFDocument({ margin: 30, size: "A4" });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=surveys.pdf");
      doc.pipe(res);

      doc.fontSize(18).text("Survey Report", { align: "center" });
      doc.moveDown();

      surveys.forEach((s, index) => {
        doc.fontSize(14).text(`Lawyer -${index + 1}`, { underline: true });
        doc.fontSize(12).text(`Name: ${s.user?.name}`);
        doc.text(`Email: ${s.user?.email}`);
        doc.text(`Experience: ${s.yearsOfExperience} years`);
        doc.text(`Specialization: ${s.specialization}`);
        doc.text(`Location: ${s.location}`);
        doc.moveDown(0.5);

        doc.fontSize(12).text("Answers:");
        s.answers.forEach((a, i) => {
          doc.text(`  Q${i + 1}: ${a.question}`);
          doc.text(`  Ans: ${a.answer}`);
        });
        doc.moveDown();
      });

      doc.end();
      return;
    }

    res.status(400).json({ message: "Invalid format" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



router.put("/edit", protect, async (req, res) => {
  try {
    const survey = await Survey.findOneAndUpdate(
      { user: req.user._id },
      { $set: req.body }, 
      { new: true, runValidators: true }
    ).populate("user", "name email");

    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }

    res.json(survey);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
