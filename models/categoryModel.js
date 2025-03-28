const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true
    },
    photo: { type: String },
    category_id: { 
      type: String,
      unique: true, // Ensures no duplicate category_id
      required: true, // Ensures category_id is always set
    }
  },
  { timestamps: true }
);

// Middleware to ensure consistent category_id for the same category
categorySchema.pre('validate', async function (next) {
  if (!this.category_id) {
    const existingCategory = await mongoose.model('Category').findOne({ category: this.category });

    if (existingCategory) {
      this.category_id = existingCategory.category_id; // Reuse the existing category_id
    } else {
      let newCategoryId;
      let isUnique = false;

      // Generate a unique 5-digit category_id
      while (!isUnique) {
        newCategoryId = Math.floor(10000 + Math.random() * 90000).toString();
        const existingId = await mongoose.model('Category').findOne({ category_id: newCategoryId });

        if (!existingId) {
          isUnique = true;
        }
      }

      this.category_id = newCategoryId; // Assign new unique category_id
    }
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
