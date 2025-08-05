const express = require("express");
const router = express.Router();
const Coupon = require("../models/CouponsModel");
const { verifyToken } = require('../middlewares/verifyToken');

// CREATE a new coupon
router.post("/create-coupon",verifyToken, async (req, res) => {
  try {
    const { code, description, discount, applicableOn,  } = req.body;

    const existing = await Coupon.findOne({ code });
    if (existing) {
      return res.status(400).json({ message: "Coupon already exists" });
    }

    const coupon = new Coupon({ code, description, discount, applicableOn,  });
    await coupon.save();

    res.status(201).json({ message: "Coupon created", coupon });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// EDIT/UPDATE an existing coupon
router.put("/edit-coupon/:id", verifyToken,async (req, res) => {
  try {
    const { id } = req.params;
    const { code, description, discount, applicableOn,  } = req.body;

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { code, description, discount, applicableOn,  },
      { new: true }
    );

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.status(200).json({ message: "Coupon updated", coupon });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// DELETE a coupon
router.delete("/delete-coupon/:id",verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.status(200).json({ message: "Coupon deleted", coupon });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

//get api
router.get("/coupons", verifyToken, async (req, res) => {
  try {
    const { filter } = req.query; // e.g., filter=full, half, or both

    let query = {};

    if (filter === "full") {
      query.applicableOn = { $in: ["full", "both"] };
    } else if (filter === "half") {
      query.applicableOn = { $in: ["half", "both"] };
    } else if (filter === "both") {
      query.applicableOn = "both";
    }

    const coupons = await Coupon.find(query).sort({ createdAt: -1 });

    res.status(200).json({ coupons });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});


module.exports = router;
