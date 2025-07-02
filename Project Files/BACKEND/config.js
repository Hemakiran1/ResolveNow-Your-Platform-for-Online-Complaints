const mongoose = require("mongoose");

mongoose.connect("Enter MongoDB Atlas Server URL")
  .then(() => console.log("connected to mongodb Atlas"))
  .catch((err) => console.error("MongoDB connection error:", err));
