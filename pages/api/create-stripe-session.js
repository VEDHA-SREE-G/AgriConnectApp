// pages/api/create-stripe-session.js - Fixed version
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2020-03-02",
});

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { item, userId, userEmail } = req.body;

      // Fix: Ensure proper URL format with fallback
      const getBaseUrl = () => {
        // Check if NEXT_PUBLIC_URL exists and has proper format
        if (process.env.NEXT_PUBLIC_URL) {
          // Add https:// if missing
          if (!process.env.NEXT_PUBLIC_URL.startsWith('http')) {
            return `https://${process.env.NEXT_PUBLIC_URL}`;
          }
          return process.env.NEXT_PUBLIC_URL;
        }
        
        // Fallback for development
        return process.env.NODE_ENV === 'production' 
          ? 'https://yourdomain.com' 
          : 'http://localhost:3000';
      };

      const baseUrl = getBaseUrl();

      const params = {
        submit_type: "pay",
        mode: "payment",
        payment_method_types: ["card"],
        line_items: item.map((cartItem) => {
          return {
            price_data: {
              currency: "inr",
              product_data: {
                name: cartItem.name,
                metadata: {
                  productId: cartItem.id,
                  // Remove originalImage as it exceeds Stripe's 500 character limit
                  // originalImage: cartItem.image, // This was causing the error
                }
              },
              unit_amount: cartItem.price * 100,
            },
            adjustable_quantity: {
              enabled: true,
              minimum: 1,
            },
            quantity: cartItem.quantity,
          };
        }),
        metadata: {
          userId: userId,
          userEmail: userEmail || 'not-provided',
        },
        customer_email: userEmail,
        success_url: `${baseUrl}/success`,
        cancel_url: `${baseUrl}/cart`,
      };
      
      const session = await stripe.checkout.sessions.create(params);
      res.json({ id: session.id });
    } catch (err) {
      console.log("Stripe session creation error:", err);
      res.status(400).json({
        status: "error",
        message: err.message,
        data: err,
      });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).json({
      status: "error",
      data: `Method ${req.method} not allowed`,
    });
  }
}