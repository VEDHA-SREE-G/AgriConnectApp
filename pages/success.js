// Updated success.js - Handles order creation after successful Stripe payment (NO WEBHOOK)
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BsBagCheckFill } from "react-icons/bs";
import { useSelector, useDispatch } from "react-redux";
import { runFireworks } from "../lib/utils";
import { useRouter } from "next/router";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { resetCart } from "../redux/cartSlice";
import { db } from "../firebase";
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc
} from "firebase/firestore";

const Success = () => {
  const cart = useSelector((state) => state.cart);
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const router = useRouter();
  const [orderProcessed, setOrderProcessed] = useState(false);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    // Process the order when component mounts
    processSuccessfulStripeOrder();
    
    // Clear cart and redirect after delay
    setTimeout(() => {
      router.push("/orders");
    }, 8000);
    
    runFireworks();
  }, []);

  // Process order after successful Stripe payment
  const processSuccessfulStripeOrder = async () => {
    if (orderProcessed) return; // Prevent duplicate processing

    try {
      // Get pending order from sessionStorage
      const pendingOrderData = sessionStorage.getItem('pendingStripeOrder');
      
      if (!pendingOrderData) {
        console.log('No pending order found - user may have paid directly');
        setProcessing(false);
        return;
      }

      const { cart: orderCart, userId, userEmail, totalAmount, timestamp } = JSON.parse(pendingOrderData);
      
      if (!orderCart || orderCart.length === 0) {
        console.log('No cart items in pending order');
        setProcessing(false);
        return;
      }

      console.log('Processing Stripe order for user:', userId);
      setOrderProcessed(true);

      const orderPromises = [];
      const stockUpdatePromises = [];

      // Create Firebase orders for each cart item
      for (const item of orderCart) {
        // Fetch current product data to get accurate info
        let productData = {};
        try {
          const productQuery = query(
            collection(db, "products"),
            where("productId", "==", item.id)
          );
          const productSnapshot = await getDocs(productQuery);
          
          if (!productSnapshot.empty) {
            productData = productSnapshot.docs[0].data();
          }
        } catch (error) {
          console.log('Could not fetch product data for:', item.id);
        }

        const orderData = {
          userId: userId,
          productId: item.id,
          productName: productData.productName || item.name,
          productRate: productData.productRate || item.price,
          productWeight: productData.productWeight || item.weight || "/kg",
          productType: productData.productType || "fruit",
          productDescription: productData.productDescription || "fresh and straight from farm",
          productStock: productData.productStock || 25, // Current stock at time of order
          quantity: item.quantity,
          totalPrice: item.price * item.quantity,
          image: item.image,
          location: item.location || productData.location || "Farm location",
          orderStatus: "confirmed", // Stripe payment successful
          paymentStatus: "completed",
          paymentMethod: "stripe",
          stripePayment: true,
          purchasedAt: serverTimestamp(),
          deliveryAddress: user.user?.address || user.address || "Address not provided"
        };

        // Add to order creation promises
        orderPromises.push(addDoc(collection(db, "orders"), orderData));
        
        // Add to stock update promises
        stockUpdatePromises.push(updateProductStock(item.id, item.quantity));
      }

      // Execute all order creations and stock updates
      const [orderRefs] = await Promise.all([
        Promise.all(orderPromises),
        Promise.all(stockUpdatePromises)
      ]);

      // Clear user's cart from Firebase
      await clearUserCart(userId);

      // Clear Redux cart
      dispatch(resetCart());

      // Clean up sessionStorage
      sessionStorage.removeItem('pendingStripeOrder');

      console.log('Stripe orders created successfully:', orderRefs.map(ref => ref.id));
      toast.success(`Payment successful! ${orderRefs.length} orders created.`);
      
      setProcessing(false);
      
    } catch (error) {
      console.error('Error processing successful payment:', error);
      toast.error("Payment successful but order creation failed. Please contact support.");
      setProcessing(false);
    }
  };

  // Helper function to update product stock
  const updateProductStock = async (productId, orderedQuantity) => {
    try {
      const productQuery = query(
        collection(db, "products"),
        where("productId", "==", productId)
      );
      
      const productSnapshot = await getDocs(productQuery);
      
      if (!productSnapshot.empty) {
        const productDoc = productSnapshot.docs[0];
        const currentStock = productDoc.data().productStock;
        const newStock = Math.max(0, currentStock - orderedQuantity); // Ensure stock doesn't go below 0
        
        await updateDoc(productDoc.ref, {
          productStock: newStock,
          updatedAt: serverTimestamp()
        });
        
        console.log(`Stock updated for ${productId}: ${currentStock} -> ${newStock}`);
      }
    } catch (error) {
      console.error("Error updating product stock:", error);
    }
  };

  // Helper function to clear user's cart
  const clearUserCart = async (userId) => {
    try {
      const cartQuery = query(
        collection(db, "carts"),
        where("userId", "==", userId)
      );
      
      const querySnapshot = await getDocs(cartQuery);
      const deletePromises = querySnapshot.docs.map(docSnapshot => 
        deleteDoc(docSnapshot.ref)
      );
      
      await Promise.all(deletePromises);
      console.log('Cart cleared for user:', userId);
    } catch (error) {
      console.error("Error clearing user cart:", error);
    }
  };

  return (
    <div className="w-[100vw] h-[100vh] flex flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center w-[80%] h-[50%] bg-[#DCDCDC] rounded-lg">
        <p className="text-green-600 text-[40px]">
          <BsBagCheckFill />
        </p>
        
        {processing ? (
          <>
            <h2 className="capitalize mt-[15px] font-[900] text-[30px] text-[#324d67]">
              Processing your order...
            </h2>
            <div className="flex items-center justify-center mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          </>
        ) : (
          <>
            <h2 className="capitalize mt-[15px] font-[900] text-[40px] text-[#324d67]">
              Thank you for your order!
            </h2>
            <p className="text-[16px] text-center font-[600]">
              Check your email inbox for the receipt.
            </p>
          </>
        )}
        
        <p className="text-[16px] font-[600] text-center m-[10px] mt-[30px]">
          If you have any questions, please email
          <a className="ml-5 text-[#f02d34]" href="mailto:order@example.com">
            order@agriconnect.com
          </a>
        </p>

        <div className="flex gap-4 mt-[40px]">
          <Link href="/orders" passHref>
            <button
              type="button"
              className="py-[10px] px-[12px] rounded-3xl uppercase border-none text-[16px] cursor-pointer bg-[#6366f1] hover:scale-105 transition duration-150 ease-out hover:ease-in text-white"
            >
              View Orders
            </button>
          </Link>
          
          <Link href="/products" passHref>
            <button
              type="button"
              className="py-[10px] px-[12px] rounded-3xl uppercase border-none text-[16px] cursor-pointer bg-[#21E591] hover:scale-105 transition duration-150 ease-out hover:ease-in text-white"
            >
              Continue Shopping
            </button>
          </Link>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Success;