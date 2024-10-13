import Product from "../models/product.model.js";

export const addToCart = async (res, req) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    const existingItem = await user.cartItem.find(
      (item) => item.id === productId
    );
    if (existingItem) {
      user.cartItem.quantity += 1;
    } else {
      user.cartItem.push(productId);
    }

    await user.save();
    res.json(user.cartItem);
  } catch (error) {
    console.log("Error in addToCart controller ", error.message);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const removeAllFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    if (!productId) {
      user.cartItem = [];
    } else {
      user.cartItem = user.cartItem.filter((item) => item.id !== productId);
    }
    await user.save();
    res.status(201).json(user.cartItem);
  } catch (error) {
    console.log("Error in removeAllFromCart controller ", error.message);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const updateQuantity = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { quantity } = req.body;
    const user = req.user;

    const existingItem = await user.cartItem.find(
      (item) => item.id === productId
    );
    if (existingItem) {
      if (quantity == 0) {
        user.cartItem.filter((item) => item.id !== productId);
        await user.save();
        return res.json(user.cartItem);
      }
      existingItem.quantity = quantity;
      await user.save();
      res.json(user.cartItem);
    } else {
      res.json({ message: "Product not found" });
    }
  } catch (error) {
    console.log("Error in updateQuantity controller ", error.message);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const getCartProducts = async (req, res) => {
  try {
    const user = req.user;
    const userCartItems = user.cartItem;
    const products = await Product.find({ _id: { $in: userCartItems } });

    // add quantity of each product
    const cartItems = products.map((product) => {
      const item = userCartItems.find((cartItem) => cartItem.id === product.id);
      return {
        ...product.toJSON(),
        quantity: item.quantity,
      };
    });
    res.json(cartItems);
  } catch (error) {
    console.log("Error in getCartProducts controller ", error.message);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
