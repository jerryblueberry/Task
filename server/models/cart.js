const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number, default: 1 }, // Set default quantity to 1
    },
  ],
  total_price: { type: Number, default: 0 },
});

module.exports = mongoose.model('Cart', cartSchema);
