const express = require("express");
const cors = require("cors");
require("./config");
const {
  ComplaintSchema,
  UserSchema,
  AssignedComplaint,
  MessageSchema,
} = require("./Schema");
const app = express();
const PORT = 8000;

app.use(express.json());
app.use(cors());

/****************** Message APIs *******************/
app.post("/messages", async (req, res) => {
  try {
    const { name, message, complaintId } = req.body;
    console.log("Incoming message:", req.body);
    const messageData = new MessageSchema({ name, message, complaintId });
    const messageSaved = await messageData.save();
    console.log("Saved message:", messageSaved);
    res.status(200).json(messageSaved);
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

app.get("/messages/:complaintId", async (req, res) => {
  try {
    const { complaintId } = req.params;
    const messages = await MessageSchema.find({ complaintId }).sort("-createdAt");
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve messages" });
  }
});

/****************** Signup API *******************/
app.post("/SignUp", async (req, res) => {
  console.log("Signup request received:", req.body);
  const user = new UserSchema(req.body);
  try {
    const resultUser = await user.save();
    console.log("Saved user:", resultUser);
    res.send(resultUser);
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).send(error);
  }
});

/****************** Login API *******************/
app.post("/Login", async (req, res) => {
  const { email, password } = req.body;
  const user = await UserSchema.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "User doesn\`t exist" });
  }
  if (user.email === email && user.password === password) {
    res.json(user);
  } else {
    res.status(401).json({ message: "Invalid Credentials" });
  }
});

/****************** Fetch Agents *******************/
app.get("/AgentUsers", async (req, res) => {
  try {
    const users = await UserSchema.find({ userType: "Agent" });
    if (users.length === 0) return res.status(404).json({ error: "User not found" });
    return res.status(200).json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/****************** Fetch Ordinary Users *******************/
app.get("/OrdinaryUsers", async (req, res) => {
  try {
    const users = await UserSchema.find({ userType: "Ordinary" });
    if (users.length === 0) return res.status(404).json({ error: "User not found" });
    return res.status(200).json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/****************** Fetch Agent By ID *******************/
app.get("/AgentUsers/:agentId", async (req, res) => {
  try {
    const { agentId } = req.params;
    const user = await UserSchema.findOne({ _id: agentId });
    if (user.userType === "Agent") return res.status(200).json(user);
    else return res.status(404).json({ error: "User not found" });
  } catch {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/****************** Delete Ordinary User *******************/
app.delete("/OrdinaryUsers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserSchema.findOne({ _id: id });
    if (!user) return res.status(404).json({ error: "User not found" });
    await UserSchema.deleteOne({ _id: id });
    await ComplaintSchema.deleteOne({ userId: id });
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/****************** Register Complaint *******************/
app.post("/Complaint/:id", async (req, res) => {
  const UserId = req.params.id;
  try {
    const user = await UserSchema.findById(UserId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const complaint = new ComplaintSchema(req.body);
    const resultComplaint = await complaint.save();
    console.log("Complaint saved:", resultComplaint);
    res.status(200).send(resultComplaint);
  } catch (error) {
    console.error("Complaint error:", error);
    res.status(500).json({ error: "Failed to register complaint" });
  }
});

/****************** Status Routes *******************/
app.get("/status/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await UserSchema.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const comment = await ComplaintSchema.find({ userId });
    res.json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve user" });
  }
});

app.get("/status", async (req, res) => {
  try {
    const complaint = await ComplaintSchema.find();
    res.json(complaint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve Complaints" });
  }
});

/****************** Assign Complaint *******************/
app.post("/assignedComplaints", async (req, res) => {
  try {
    const assignedComplaint = req.body;
    const saved = await AssignedComplaint.create(assignedComplaint);
    console.log("Assigned complaint:", saved);
    res.sendStatus(201);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add assigned complaint" });
  }
});

/****************** Agent's Complaints *******************/
app.get("/allcomplaints/:agentId", async (req, res) => {
  try {
    const agentId = req.params.agentId;
    const complaints = await AssignedComplaint.find({ agentId });
    const complaintIds = complaints.map((c) => c.complaintId);
    const complaintDetails = await ComplaintSchema.find({ _id: { $in: complaintIds } });
    const updatedComplaints = complaints.map((c) => {
      const d = complaintDetails.find((d) => d._id.toString() === c.complaintId.toString());
      return { ...c._doc, ...d?._doc };
    });
    res.json(updatedComplaints);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to get complaints" });
  }
});

/****************** Update User *******************/
app.put("/user/:_id", async (req, res) => {
  try {
    const { _id } = req.params;
    const { name, email, phone } = req.body;
    const user = await UserSchema.findByIdAndUpdate(_id, { name, email, phone }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to update the user" });
  }
});

/****************** Update Complaint *******************/
app.put("/complaint/:complaintId", async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status } = req.body;
    if (!complaintId || !status) return res.status(400).json({ error: "Missing complaintId or status" });

    const updatedComplaint = await ComplaintSchema.findByIdAndUpdate(complaintId, { status }, { new: true });
    const assigned = await AssignedComplaint.findOneAndUpdate({ complaintId }, { status }, { new: true });

    if (!updatedComplaint && !assigned) return res.status(404).json({ error: "Complaint not found" });
    res.json(updatedComplaint);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to update complaint" });
  }
});

app.listen(PORT, () => console.log(`server started at ${PORT}`));
