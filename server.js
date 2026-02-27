const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const Razorpay = require("razorpay");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");


const app = express();


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));  // ✅ ADD THIS
app.use(express.static(path.join(__dirname, "public")));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Image upload setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Serve uploaded images
app.use("/uploads", express.static("uploads"));

// Models

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: "user" }  // user or admin
});

const User = mongoose.model("User", userSchema);

const Product = mongoose.model("Product", {
  name: String,
  price: Number,
  image: String,
  category: String   // ✅ NEW
});


const Wholesale = mongoose.model("Wholesale", {
  business: String,
  license: String,
  contact: String,
  phone: String,
  products: String,
  date: { type: Date, default: Date.now }
});

const Order = mongoose.model("Order", {
  customerName: String,
  phone: String,
  address: String,
  items: Array,
  total: Number,
  date: { type: Date, default: Date.now }
});


// Razorpay config (USE YOUR REAL TEST KEYS)
const razorpay = new Razorpay({
  key_id: "YOUR_RAZORPAY_KEY_ID",
  key_secret: "YOUR_RAZORPAY_SECRET"
});

// Routes

// Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// ======================
// LOGIN ROUTE
// ======================
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }

    // Send role back
    res.json({ role: user.role });

  } catch (err) {
    console.log("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get products
app.get("/products", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

//get orders
app.get("/orders", async (req,res)=>{
  const orders = await Order.find();
  res.json(orders);
});

// Add product (admin with image upload)
app.post("/add-product", upload.single("image"), async (req, res) => {

  try {
    const p = new Product({
      name: req.body.name,
      price: req.body.price,
      category: req.body.category,
      image: req.file ? req.file.filename : ""
    });

    await p.save();
    res.send("Product added");

  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding product");
  }

});


// place order
app.post("/place-order", async (req, res) => {
  const order = new Order({
    customerName: req.body.name,
    phone: req.body.phone,
    address: req.body.address,
    items: req.body.items,
    total: req.body.total
  });

  await order.save();
  res.json({ success: true });
});


// Wholesale inquiry
app.post("/wholesale-inquiry", async (req, res) => {
  const w = new Wholesale(req.body);
  await w.save();
  res.send("Wholesale inquiry received");
});

// Razorpay order (ONLY ONE ROUTE)
app.post("/create-order", async (req, res) => {
  try {
    const amount = req.body.amount;

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR"
    });

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Order creation failed" });
  }
});

// ======================
// SIGNUP ROUTE
// ======================
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });

    await newUser.save();

    res.json({ success: true, message: "Signup successful" });

  } catch (error) {
    res.status(500).json({ success: false, message: "Signup error" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

// Get all products (admin)
app.get("/admin-products", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// Delete product
app.delete("/delete-product/:id", async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// Delete product (admin)
app.delete("/delete-product/:id", async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.send("Product deleted");
});

// Update product
app.put("/update-product/:id", async (req, res) => {
  await Product.findByIdAndUpdate(req.params.id, req.body);
  res.json({ success: true });
});

