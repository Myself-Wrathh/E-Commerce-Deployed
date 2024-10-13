import Coupon from "../models/coupon.model.js";

export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Invalid or empty products Array" });
    }
    let totalAmount = 0;
    const lineItems = products.map((product) => {
      // FIXME: stripe
      const amount = Math.round(product.price * 100);
      totalAmount += amount * product.quantity;
      return {
        price_data: {
          currency: "inr",
          product_data: {
            name: product.name,
            images: [product.image],
          },
          unit_amount: amount,
        },
      };
    });
    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode,
        userId: req.user._id,
        isActive: true,
        if(coupon) {
          totalAmount -= Math.round(
            (totalAmount * coupon.discountPercentage) / 100
          );
        },
      });
    }
    // TODO: stripe
    // const session = await 

  } catch (error) {
    console.log("Error in createCheckoutSession controller ", error.message);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
