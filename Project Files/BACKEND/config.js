const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://complaintadmin:<password>@complaintcarecluster.bl9dop1.mongodb.net/?retryWrites=true&w=majority&appName=Complaintcarecluster")
  .then(() => console.log("connected to mongodb Atlas"))
  .catch((err) => console.error("MongoDB connection error:", err));
