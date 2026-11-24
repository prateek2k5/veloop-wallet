
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const walletRoutes = require("./routes/walletRoutes");\nconst payoutRoutes = require("./routes/payoutRoutes");\nconst withdrawalRoutes = require("./routes/withdrawalRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/wallet", walletRoutes);\napp.use("/api/payout", payoutRoutes);\napp.use("/api/withdrawals", withdrawalRoutes);

// Home route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "VELOop Wallet API is running!"
  });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
