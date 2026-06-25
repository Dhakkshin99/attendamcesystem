import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    getStudents();
  }, []);


  const API_URL=import.meta.env.VITE_API_URL || "http://localhost:3000";


  const getStudents = async () => {
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        //fetch("http://localhost:3000/students"),
        fetch(`${API_URL}/students`),
       // fetch("http://localhost:3000/attendance/today")
       fetch(`${API_URL}/attendance`),
      ]);
      const studentsData = await studentsRes.json();
      const attendanceData = await attendanceRes.json();
      const attendanceMap = {};
      
      attendanceData.forEach(record => {
        const sId = record.studentId._id || record.studentId;
        attendanceMap[sId] = record.status;
      });
      
      const updatedStudents = studentsData.map(student => ({
        ...student,
        attendance: attendanceMap[student._id] || "" 
      }));

      setStudents(updatedStudents);
    } catch (err) {
      console.log("Error fetching data:", err);
    }
  };

  const saveAttendance = async (studentId, status) => {
    try {
      await fetch(`${API_URL}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          status,
          date: new Date().toISOString().split("T")[0]
        })
      });
      console.log("Attendance Saved");
    } catch (err) {
      console.log("Error saving attendance:", err);
    }
  };

  const markAttendance = (id, status) => {
    setStudents(
      students.map(student =>
        student._id === id ? { ...student, attendance: status } : student
      )
    );
  };

  const presentCount = students.filter(student => student.attendance === "P").length;
  const absentCount = students.filter(student => student.attendance === "A").length;
  const totalCount = students.length;

  // Calculate dynamic percentages for the infographic bar
  const presentPercentage = totalCount ? (presentCount / totalCount) * 100 : 0;
  const absentPercentage = totalCount ? (absentCount / totalCount) * 100 : 0;

  const resetAttendance = async () => {
    try {
      const response = await fetch(`${API_URL}/attendance/today`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete records");
      
      setStudents(students.map(student => ({ ...student, attendance: "" })));
    } catch (err) {
      console.log("Error resetting attendance:", err);
      alert("Could not reset attendance.");
    }
  };

  return (
    <div className="container">
      <h1>Attendance Management System</h1>

      {/* Modern Analytics Infographic Block */}
      <div className="summary-deck">
        <div className="metric-info">
          <div className="stat-box present-box">
            <span className="stat-label">PRESENT REGISTRY</span>
            <span className="stat-number">{presentCount}</span>
          </div>
          <div className="stat-box absent-box">
            <span className="stat-label">ABSENT REGISTRY</span>
            <span className="stat-number">{absentCount}</span>
          </div>
          <button className="reset-btn" onClick={resetAttendance}>RESET MATRIX</button>
        </div>
        
        {/* Infographic Data Bar */}
        <div className="infographic-bar-container">
          <div className="infographic-fill present-fill" style={{ width: `${presentPercentage}%` }}></div>
          <div className="infographic-fill absent-fill" style={{ width: `${absentPercentage}%` }}></div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Roll No</th>
            <th>Name</th>
            <th>Actions</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: "center" }}>No Students Found</td>
            </tr>
          ) : (
            students.map(student => (
              <tr key={student._id}>
                <td>{student.rollno}</td>
                <td>{student.name}</td>
                <td>
                  <div className="action-button-wrapper">
                    <button 
                      className={`btn-matrix btn-p ${student.attendance === 'P' ? 'active-p' : ''}`}
                      onClick={() => { markAttendance(student._id, "P"); saveAttendance(student._id, "P"); }}
                    >
                      P
                    </button>
                    <button 
                      className={`btn-matrix btn-a ${student.attendance === 'A' ? 'active-a' : ''}`}
                      onClick={() => { markAttendance(student._id, "A"); saveAttendance(student._id, "A"); }}
                    >
                      A
                    </button>
                  </div>
                </td>
                <td className="status-cell">
                  <span className={`status-badge ${student.attendance === 'P' ? 'status-p' : student.attendance === 'A' ? 'status-a' : ''}`}>
                    {student.attendance || "-"}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default App;