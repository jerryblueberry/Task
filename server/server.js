const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Added jwt import

const app = express();

app.use(express.json());
app.use(cors());
const saltRounds = 10;

const createToken = (userId) => {
  const payload = {
    userId: userId,
  };
  const token = jwt.sign(payload, 'Q$r2K6W8n!jCW%Zk', { expiresIn: '1h' });
  return token;
};
// //    logout endpoint
app.get('/logout',(req,res) => {
    res.clearCookie('token');
    return res.json({Status:"Success"});
})


const mongoose = require('mongoose');
const CONNECTION = 'mongodb+srv://sajan2121089:sajank1818@cluster0.xjhkcml.mongodb.net/yourDatabaseName?retryWrites=true&w=majority'; // Added database name

const connectDb = async () => {
  try {
    const connect = await mongoose.connect(CONNECTION); // Added options
    console.log('Database connected Successfully');
  } catch (error) {
    console.log('Error', error);
  }
};

app.listen(8000, () => {
  console.log(`Listening on port 8000`);
});
connectDb();

const Product = require('./models/product');
const User = require('./models/user');
const Cart  = require('./models/cart');
const Purchase  = require('./models/purchase');

app.post('/signup', async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });

    if (existingUser) {
      return res.json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });

    await newUser.save();

    return res.json({ status: 'Success' });
  } catch (error) {
    console.error('Error:', error);
    return res.json({ error: 'Internal server error' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = createToken(user._id);
    res.status(200).json({ token });
  } catch (error) {
    console.error('Error in finding the user or comparing passwords', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/loggedUser/:userId', (req, res) => {
  const loggedInUserId = req.params.userId;

  User.findOne({ _id: loggedInUserId })
    .then((user) => {
      if (user) {
        res.status(200).json(user);
      } else {
        res.status(404).json({ message: 'Logged-in user not found' });
      }
    })
    .catch((err) => {
      console.log('Error retrieving logged-in user', err);
      res.status(500).json({ message: 'Error retrieving logged-in user' });
    });
});
app.post('/product/add',async(req,res) => {
    try {
      const {title,image,description,price,rating,category} = req.body;
  
      const newProduct = new Product({
        title,
        image,
        description,
        price,
        rating,
        category
  
      });
  
      const saveProduct = await newProduct.save();
      res.status(200).json(saveProduct);
  
    } catch (error) {
      res.status(400).json({error:error.message});  
    }
  });
  
  // endpoint to get all the products
  
  app.get('/products',async(req,res) => {
    try {
      const products = await Product.find();
  
      if(products.length ===0){
        return res.status(404).json({message:"No products found"});
      
      }
      res.status(200).json(products);
    } catch (error) {
      res.status(400).json({error:error.message});
    }
  })
  
  
  //  endpoint to get the product by id
  
  app.get('/products/:productId',async(req,res) => {
    try {
      const productId  = req.params.productId;
      const product = await Product.findById(productId)
      if(!product){
        return res.status(404).json({error:"Product Not Found"});
      }
      res.status(200).json(product);
    } catch (error) {
      res.status(500).json({error:error.message});
      
    }
  });

app.post('/cart', async (req, res) => {
  try {
    // Validate and extract data from the request body
    const { userId, product, quantity } = req.body;

    // Find the user's cart or create a new one if not exists
    let userCart = await Cart.findOne({ userId });

    if (!userCart) {
      // If the user doesn't have a cart, create a new one
      userCart = new Cart({
        userId,
        products: [{ product, quantity }],
        total_price: 0, // Set total_price to 0
      });
    } else {
      // Check if the product already exists in the cart
      const existingProductIndex = userCart.products.findIndex(
        (item) => item.product.toString() === product.toString()
      );

      if (existingProductIndex !== -1) {
        // If the product already exists, update the quantity
        userCart.products[existingProductIndex].quantity += 1;
      } else {
        // If the product doesn't exist, add it to the cart with the specified quantity
        userCart.products.push({ product, quantity });
      }
    }

    // Calculate the total price (you may have a more sophisticated logic based on product prices)
    // Here, we assume that the product has a "price" field
    const products = await Product.find({ _id: { $in: userCart.products.map((p) => p.product) } });
    userCart.total_price = products.reduce((total, product) => {
      const cartProduct = userCart.products.find((p) => p.product.toString() === product._id.toString());
      return total + parseFloat(product.price) * cartProduct.quantity;
    }, 0);

    // Save the updated cart to the database
    const savedCart = await userCart.save();

    // Respond with a success message or the saved cart
    res.status(201).json(savedCart);
  } catch (error) {
    // Handle errors and respond with an error message
    res.status(400).json({ error: error.message });
  }
});
// //  endpoint to get the user cart details

//  endpoint to get the user cart details
app.get('/cart/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find the user's cart
    const userCart = await Cart.findOne({ userId }).populate('products.product');

    if (!userCart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    res.json({  cart:userCart });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Increment quantity
app.put('/cart/increment', async (req, res) => {
  try {
    const { userId, product } = req.body;
    let userCart = await Cart.findOne({ userId });

    if (userCart) {
      const existingProduct = userCart.products.find(
        (item) => item.product.toString() === product.toString()
      );

      if (existingProduct) {
        existingProduct.quantity += 1;
        userCart = await userCart.save();

        // Update total price
        await updateCartTotal(userCart);

        res.status(200).json(userCart);
      } else {
        res.status(404).json({ error: 'Product not found in the cart' });
      }
    } else {
      res.status(404).json({ error: 'Cart not found for the user' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Decrement quantity
app.put('/cart/decrement', async (req, res) => {
  try {
    const { userId, product } = req.body;
    let userCart = await Cart.findOne({ userId });

    if (userCart) {
      const existingProduct = userCart.products.find(
        (item) => item.product.toString() === product.toString()
      );

      if (existingProduct) {
        if (existingProduct.quantity > 1) {
          existingProduct.quantity -= 1;
          userCart = await userCart.save();

          // Update total price
          await updateCartTotal(userCart);

          res.status(200).json(userCart);
        } else {
          res.status(400).json({ error: 'Quantity cannot be less than 1' });
        }
      } else {
        res.status(404).json({ error: 'Product not found in the cart' });
      }
    } else {
      res.status(404).json({ error: 'Cart not found for the user' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Remove  product from the cart
app.delete('/cart/clear/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find the user's cart by userId and update it to remove all items
    const updatedCart = await Cart.findOneAndUpdate(
      { userId: userId },
      { $set: { products: [] } },
      { new: true }
    );

    if (!updatedCart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    res.status(200).json({ message: 'Cart items removed successfully', cart: updatedCart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Remove specific product from the cart
app.delete('/cart/remove', async (req, res) => {
  try {
    const { userId, product } = req.body;
    let userCart = await Cart.findOne({ userId });

    if (userCart) {
      // Get the product index in the user's cart
      const productIndex = userCart.products.findIndex(
        (item) => item.product.toString() === product.toString()
      );

      if (productIndex !== -1) {
        // Remove the product from the cart
        userCart.products.splice(productIndex, 1);

        // Update total price
        await updateCartTotal(userCart);

        // Save the updated cart to the database
        userCart = await userCart.save();
        res.status(200).json(userCart);
      } else {
        res.status(404).json({ error: 'Product not found in the cart' });
      }
    } else {
      res.status(404).json({ error: 'Cart not found for the user' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



const updateCartTotal = async (userCart) => {
  try {
    const products = await Product.find({ _id: { $in: userCart.products.map((p) => p.product) } });

    userCart.total_price = products.reduce((total, product) => {
      const cartProduct = userCart.products.find((p) => p.product.toString() === product._id.toString());
      return total + parseFloat(product.price) * cartProduct.quantity;
    }, 0);

    // Assuming userCart is a Mongoose model instance, save the changes to the database
    await userCart.save();
  } catch (error) {
    console.error('Error updating cart total:', error);
  }
};


//  for the purchase
app.post("/purchases", async (req, res) => {
  try {
      const { userId, products, total_price } = req.body;

      // Validate input data
      if (!userId || !products || !total_price) {
          return res.status(400).json({ error: "Missing required fields" });
      }

      // Create a new purchase
      const newPurchase = new Purchase({
          userId,
          products,
          total_price,
      });

      // Save the purchase to the database
      const savedPurchase = await newPurchase.save();

      // Respond with the saved purchase
      res.status(201).json(savedPurchase);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
  }
});
// GET endpoint to retrieve purchases for a specific user
app.get('/items/purchases/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Validate the userId
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    const purchases = await Purchase.find({ userId }).populate('products.product'); // Populate product details
    res.status(200).json(purchases);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

