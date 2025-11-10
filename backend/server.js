import app from "./app.js";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 4000;
console.log("🔍 MONGO_URL =", process.env.MONGO_URI); // Debug

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
