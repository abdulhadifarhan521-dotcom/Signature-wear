console.log("SERVER FILE LOADED");

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, "..")));

app.use(express.json());

const productsFile = path.join(__dirname, "products.json");
const uploadFolder = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}

if (!fs.existsSync(productsFile)) {
  fs.writeFileSync(productsFile, "[]");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

app.use("/uploads", express.static(uploadFolder));

app.get("/", (req, res) => {
  res.send("Signature Wear Assistant is running!");
});
app.get("/check", (req, res) => {
  res.send("CHECK WORKING");
});
app.get("/admin.html", (req, res) => {
  res.send("ADMIN ROUTE WORKING");
});

app.get("/products", (req, res) => {
  const products = JSON.parse(fs.readFileSync(productsFile, "utf8"));
  res.json(products);
});

app.post("/admin/products", upload.single("image"), (req, res) => {

  const products = JSON.parse(fs.readFileSync(productsFile, "utf8"));

  const product = {
    id: Date.now(),
    name: req.body.name,
    price: req.body.price,
    description: req.body.description || "",
    category: req.body.category || "",
    size: req.body.size || "",
    color: req.body.color || "",
    image: req.file ? `/uploads/${req.file.filename}` : ""
  };

  products.push(product);

  fs.writeFileSync(
    productsFile,
    JSON.stringify(products, null, 2)
  );

  res.json({
    success: true,
    message: "Product added successfully",
    product
  });
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
app.get("/test", (req, res) => {
  res.send("TEST OK");
});