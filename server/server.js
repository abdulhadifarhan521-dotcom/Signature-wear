const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Signature Wear Assistant is running!");
});

app.post("/order", (req, res) => {
  console.log("================================");
  console.log("🛍️ NEW SIGNATURE WEAR ORDER");
  console.log("================================");
  console.log(req.body);

  res.json({
    success: true,
    message: "Order received successfully"
  });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Signature Wear Assistant running on port ${PORT}`);
});