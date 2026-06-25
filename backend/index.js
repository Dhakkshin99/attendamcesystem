import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB:", err);
  });

// Student Schema
const studentSchema = new mongoose.Schema({
  rollno: String,
  name: String,
});

const Student = mongoose.model("Student", studentSchema);

// Attendance Schema
const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },

  date: {
    type: Date,
    required: true,
  },

  status: {
    type: String,
    enum: ["P", "A"],
    required: true,
  },
});

// Prevent duplicate attendance for same student on same date
attendanceSchema.index(
  { studentId: 1, date: 1 },
  { unique: true }
);

const Attendance = mongoose.model(
  "Attendance",
  attendanceSchema
);

// Home Route
app.get("/", (req, res) => {
  res.send("Server Has started successfully!");
});

// Create Student
app.post("/students", async (req, res) => {
  try {
    const newStudent = await Student.create({
      rollno: req.body.rollno,
      name: req.body.name,
    });

    res.status(201).json(newStudent);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// Get All Students
app.get("/students", async (req, res) => {
  try {
    const students = await Student.find();

    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// Mark / Update Attendance
app.post("/attendance", async (req, res) => {
  try {
    const { studentId, date, status } = req.body;

    const attendance = await Attendance.findOneAndUpdate(
      {
        studentId,
        date,
      },
      {
        studentId,
        date,
        status,
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.status(200).json(attendance);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// Get All Attendance
app.get("/attendance", async (req, res) => {
  try {
    const attendance = await Attendance.find().populate("studentId");

    res.status(200).json(attendance);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// Get Today's Attendance
app.get("/attendance/today", async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
      date: {
        $gte: start,
        $lte: end,
      },
    }).populate("studentId");

    res.status(200).json(attendance);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// Reset Today's Attendance
app.delete("/attendance/today", async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const result = await Attendance.deleteMany({
      date: {
        $gte: start,
        $lte: end,
      },
    });

    res.status(200).json({
      message: "Today's attendance has been completely reset",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// Test Route
app.get("/akil", (req, res) => {
  res.send("It will be the best year Akil");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});