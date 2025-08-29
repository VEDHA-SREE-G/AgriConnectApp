// Enhanced cart.js with Firebase + Stripe Payment + SMS Notifications
import React, { useEffect, useState } from "react";
import Image from "next/image";
import styles from "../styles/cart.module.css";
import Navbar from "../components/Navbar/Navbar";
import { useDispatch, useSelector } from "react-redux";
import {
  decrementQuantity,
  incrementQuantity,
  removeFromCart,
  setCart,
  resetCart
} from "../redux/cartSlice";
import Link from "next/link";
import { addToOrder, resetOrder } from "../redux/orderSlice";
import { resetPurchaseOrder } from "../redux/purchaseSlice";
import { db } from "../firebase";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where,
  onSnapshot
} from "firebase/firestore";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";

function Cart() {
  const cart = useSelector((state) => state.cart);
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Stripe setup
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const stripePromise = loadStripe(publishableKey);

  // Load cart from Firebase when user logs in
  useEffect(() => {
    if (user.isLoggedIn && user.user?.id) {
      loadCartFromFirebase();
    }
  }, [user.isLoggedIn, user.user?.id]);

  // Load cart items from Firebase
  const loadCartFromFirebase = async () => {
    try {
      const userId = user.user?.id || user.id;
      const cartQuery = query(
        collection(db, "carts"),
        where("userId", "==", userId)
      );
      
      const querySnapshot = await getDocs(cartQuery);
      const firebaseCart = [];
      
      querySnapshot.forEach((doc) => {
        firebaseCart.push({
          firebaseId: doc.id, // Store Firebase document ID
          ...doc.data()
        });
      });
      
      // Update Redux cart with Firebase data
      dispatch(setCart(firebaseCart));
    } catch (error) {
      console.error("Error loading cart from Firebase:", error);
    }
  };

  // Add or update item in Firebase
  const updateFirebaseCart = async (item, action) => {
    if (!user.isLoggedIn) return;

    try {
      const userId = user.user?.id || user.id;
      
      if (action === 'add' || action === 'increment') {
        // Check if item already exists in Firebase
        const cartQuery = query(
          collection(db, "carts"),
          where("userId", "==", userId),
          where("id", "==", item.id)
        );
        
        const querySnapshot = await getDocs(cartQuery);
        
        if (!querySnapshot.empty) {
          // Update existing item
          const docRef = querySnapshot.docs[0].ref;
          await updateDoc(docRef, {
            quantity: item.quantity,
            updatedAt: serverTimestamp()
          });
        } else {
          // Add new item
          await addDoc(collection(db, "carts"), {
            userId: userId,
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      } else if (action === 'decrement') {
        // Update quantity in Firebase
        const cartQuery = query(
          collection(db, "carts"),
          where("userId", "==", userId),
          where("id", "==", item.id)
        );
        
        const querySnapshot = await getDocs(cartQuery);
        if (!querySnapshot.empty) {
          const docRef = querySnapshot.docs[0].ref;
          await updateDoc(docRef, {
            quantity: item.quantity,
            updatedAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error("Error updating Firebase cart:", error);
    }
  };

  // Remove item from Firebase
  const removeFromFirebaseCart = async (itemId) => {
    if (!user.isLoggedIn) return;

    try {
      const userId = user.user?.id || user.id;
      const cartQuery = query(
        collection(db, "carts"),
        where("userId", "==", userId),
        where("id", "==", itemId)
      );
      
      const querySnapshot = await getDocs(cartQuery);
      querySnapshot.forEach(async (docSnap) => {
        await deleteDoc(doc(db, "carts", docSnap.id));
      });
    } catch (error) {
      console.error("Error removing item from Firebase:", error);
    }
  };

  // Clear entire cart from Firebase
  const clearFirebaseCart = async () => {
    if (!user.isLoggedIn) return;

    try {
      const userId = user.user?.id || user.id;
      const cartQuery = query(
        collection(db, "carts"),
        where("userId", "==", userId)
      );
      
      const querySnapshot = await getDocs(cartQuery);
      const deletePromises = querySnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Error clearing Firebase cart:", error);
    }
  };

  // Enhanced increment function with Firebase sync
  const handleIncrement = async (itemId) => {
    // Find current item from cart BEFORE updating Redux
    const currentItem = cart.find(item => item.id === itemId);
    
    dispatch(incrementQuantity(itemId));
    
    if (currentItem) {
      await updateFirebaseCart({
        ...currentItem,
        quantity: currentItem.quantity + 1
      }, 'increment');
    }
  };

  // Enhanced decrement function with Firebase sync
  const handleDecrement = async (itemId) => {
    const item = cart.find(item => item.id === itemId);
    
    if (item && item.quantity > 1) {
      dispatch(decrementQuantity(itemId));
      await updateFirebaseCart({
        ...item,
        quantity: item.quantity - 1
      }, 'decrement');
    } else if (item && item.quantity === 1) {
      // Remove item if quantity becomes 0
      dispatch(removeFromCart(itemId));
      await removeFromFirebaseCart(itemId);
    }
  };

  // Enhanced remove function with Firebase sync
  const handleRemove = async (itemId) => {
    dispatch(removeFromCart(itemId));
    await removeFromFirebaseCart(itemId);
  };

  // Update product stock after order
  const updateProductStock = async (productId, orderedQuantity) => {
    try {
      // First, get current product data
      const productQuery = query(
        collection(db, "products"), // Assuming your products are in "products" collection
        where("productId", "==", productId)
      );
      
      const productSnapshot = await getDocs(productQuery);
      
      if (!productSnapshot.empty) {
        const productDoc = productSnapshot.docs[0];
        const currentStock = productDoc.data().productStock;
        const newStock = currentStock - orderedQuantity;
        
        // Update the stock
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

  // NEW: Send SMS notification function with Firebase user data fetch
  const sendOrderSMS = async (orderType = 'direct', orderIds = []) => {
    try {
      console.log('=== SMS DEBUG START ===');
      
      // Get user ID
      const userId = user.user?.id || user.id || user.user?.uid || user.uid;
      console.log('User ID for Firebase lookup:', userId);
      
      if (!userId) {
        console.error('❌ No user ID found');
        alert('SMS notification failed: User not properly logged in');
        return;
      }

      // Fetch complete user profile from Firebase
      console.log('🔍 Fetching user profile from Firebase...');
      const userQuery = query(
        collection(db, "users"), // Assuming your users collection is called "users"
        where("uid", "==", userId)
      );
      
      const userSnapshot = await getDocs(userQuery);
      
      if (userSnapshot.empty) {
        console.error('❌ User profile not found in Firebase');
        alert('SMS notification failed: User profile not found');
        return;
      }

      // Get the user document data
      const userDoc = userSnapshot.docs[0];
      const userFirebaseData = userDoc.data();
      
      console.log('Firebase user data:', userFirebaseData);
      
      // Extract phone number and username from Firebase data
      const userPhoneNumber = userFirebaseData.phonenumber || userFirebaseData.phoneNumber || userFirebaseData.phone;
      const userName = userFirebaseData.username || userFirebaseData.name || 'Customer';
      
      console.log('Extracted phone number from Firebase:', userPhoneNumber);
      console.log('Extracted username from Firebase:', userName);
      
      if (!userPhoneNumber) {
        console.error('❌ No phone number found in Firebase user profile');
        alert('SMS notification failed: No phone number found in user profile');
        return;
      }

      // Format delivery address from Firebase user data
      console.log('User address data from Firebase:', {
        street: userFirebaseData.street,
        addressline1: userFirebaseData.addressline1,
        addressline2: userFirebaseData.addressline2,
        area: userFirebaseData.area,
        city: userFirebaseData.city,
        state: userFirebaseData.state,
        pincode: userFirebaseData.pincode
      });
      
      const deliveryAddress = [
        userFirebaseData.street,
        userFirebaseData.addressline1,
        userFirebaseData.addressline2,
        userFirebaseData.area,
        userFirebaseData.city,
        userFirebaseData.state,
        userFirebaseData.pincode
      ].filter(Boolean).join(', ');

      console.log('Formatted delivery address:', deliveryAddress);

      // Create order summary
      const itemsSummary = cart.map(item => 
        `${item.name} x${item.quantity} = ₹${item.price * item.quantity}`
      ).join('\n');

      const totalAmount = getTotalPrice();
      
      console.log('Order items summary:', itemsSummary);
      console.log('Total amount:', totalAmount);
      
      // Create SMS message based on order type - SHORTENED for trial account
      let smsMessage = '';
      
      if (orderType === 'stripe') {
        smsMessage = `Hi ${userName}! Your order is confirmed. Payment: Online. Total: ₹${totalAmount}. Track in app. Thanks!`;
      } else {
        const orderIdText = orderIds.length > 0 ? `ID: ${orderIds[0]}` : ''; // Only first order ID
        smsMessage = `Hi ${userName}! Order confirmed. ${orderIdText}. COD: ₹${totalAmount}. Delivery to ${userFirebaseData.city || 'your address'}. Thanks!`;
      }

      console.log('SMS Message to send:', smsMessage);
      console.log('SMS Message length:', smsMessage.length);

      // Send SMS via API
      console.log('📱 Attempting to send SMS to:', userPhoneNumber);
      console.log('Making API call to /api/send-sms...');
      
      const response = await axios.post('/api/send-sms', {
        to: userPhoneNumber,
        message: smsMessage
      });

      console.log('SMS API Response:', response.data);

      if (response.data.success) {
        console.log('✅ Order SMS sent successfully:', response.data.messageSid);
        alert('Order placed! SMS notification sent successfully.');
      } else {
        console.error('❌ Failed to send SMS:', response.data);
        alert(`SMS notification failed: ${response.data.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error('❌ Error sending order SMS:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Show user-friendly error message
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      alert(`SMS notification failed: ${errorMsg}`);
      
      // Don't throw error - SMS failure shouldn't break order flow
    }
    console.log('=== SMS DEBUG END ===');
  };

  // Store order data in sessionStorage before payment
  const storeOrderData = () => {
    const orderData = {
      cart: cart,
      userId: user.user?.id || user.id,
      userEmail: user.user?.email || user.email,
      timestamp: Date.now(),
      totalAmount: getTotalPrice()
    };
    
    // Use sessionStorage (clears when tab closes)
    sessionStorage.setItem('pendingStripeOrder', JSON.stringify(orderData));
  };

  // STRIPE PAYMENT INTEGRATION (No webhook needed)
  const createCheckoutSession = async () => {
    const stripe = await stripePromise;
    
    try {
      const checkoutSession = await axios.post("/api/create-stripe-session", {
        item: cart,
        userId: user.user?.id || user.id,
        userEmail: user.user?.email || user.email
      });
      
      const result = await stripe.redirectToCheckout({
        sessionId: checkoutSession.data.id,
      });

      if (result.error) {
        console.log(result.error.message);
        alert("Payment failed: " + result.error.message);
        // Clear stored order data on error
        sessionStorage.removeItem('pendingStripeOrder');
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("Failed to initiate payment. Please try again.");
      sessionStorage.removeItem('pendingStripeOrder');
    }
  };

  // STRIPE CHECKOUT HANDLER
  const onStripeCheckout = async () => {
    if (!user.isLoggedIn) {
      alert("Please login to place order");
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    setCheckoutLoading(true);
    try {
      // Store order data before payment
      storeOrderData();
      
      // Add to Redux order state (for order tracking)
      dispatch(addToOrder(cart));
      
      // Send SMS notification for Stripe payment
      await sendOrderSMS('stripe');
      
      // Initiate Stripe payment
      await createCheckoutSession();
      
    } catch (error) {
      console.error("Error during checkout:", error);
      alert("Failed to proceed with checkout. Please try again.");
      sessionStorage.removeItem('pendingStripeOrder');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // FIREBASE-ONLY CHECKOUT (Your existing functionality) - Enhanced with SMS
  const onDirectFirebaseCheckout = async () => {
    if (!user.isLoggedIn) {
      alert("Please login to place order");
      return;
    }

    setLoading(true);
    try {
      const userId = user.user?.id || user.id;
      const orderPromises = [];
      const stockUpdatePromises = [];

      // Create separate order document for each cart item
      for (const item of cart) {
        // First fetch current product data to get accurate info
        const productQuery = query(
          collection(db, "products"),
          where("productId", "==", item.id)
        );
        
        const productSnapshot = await getDocs(productQuery);
        let productData = {};
        
        if (!productSnapshot.empty) {
          productData = productSnapshot.docs[0].data();
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
          location: item.location,
          orderStatus: "confirmed", // Direct order
          paymentStatus: "cash_on_delivery", // Mark as COD
          paymentMethod: "direct_order",
          purchasedAt: serverTimestamp(),
          deliveryAddress: `${user.user?.street || user.street || ''}, ${user.user?.addressline1 || user.addressline1 || ''}, ${user.user?.addressline2 || user.addressline2 || ''}, ${user.user?.area || user.area || ''}, ${user.user?.city || user.city || ''}, ${user.user?.state || user.state || ''}, ${user.user?.pincode || user.pincode || ''}`.replace(/^,+|,+$/g, '').replace(/,+/g, ', ') || "Not provided"
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
      
      dispatch(addToOrder(cart));
      
      // Clear cart from both Redux and Firebase
      dispatch(resetCart());
      await clearFirebaseCart();

      const orderIds = orderRefs.map(ref => ref.id);
      
      // Send SMS notification for Cash on Delivery
      await sendOrderSMS('direct', orderIds);
      
      alert(`Orders placed successfully! Stock updated. Order IDs: ${orderIds.join(", ")}`);
      
      // Redirect to orders page
      setTimeout(() => {
        window.location.href = "/orders";
      }, 2000);
      
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  function getTotalPrice() {
    return cart.reduce(
      (accumulator, item) => accumulator + item.quantity * item.price,
      0
    );
  }

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        {cart.length === 0 ? (
          <h1>Your Cart is Empty!</h1>
        ) : (
          <>
            <div
              className={`${styles.header} sm_max:text-sm sm_max:font-light `}
            >
              <div>Image</div>
              <div>Product</div>
              <div>Price</div>
              <div>Quantity</div>
              <div>Actions</div>
              <div>Total Price</div>
            </div>
            {cart.map((item) => (
              <div className={styles.body} key={item.id}>
                <div className={styles.image}>
                  <Image
                    src={item.image}
                    height="90"
                    width="65"
                    alt="itemImage"
                  />
                </div>
                <p>{item.name}</p>
                <p>₹ {item.price}</p>
                <p>{item.quantity}</p>
                <div className={styles.buttons}>
                  <button 
                    onClick={() => handleIncrement(item.id)}
                    disabled={loading || checkoutLoading}
                  >
                    +
                  </button>
                  <button 
                    onClick={() => handleDecrement(item.id)}
                    disabled={loading || checkoutLoading}
                  >
                    -
                  </button>
                  <button 
                    onClick={() => handleRemove(item.id)}
                    disabled={loading || checkoutLoading}
                  >
                    x
                  </button>
                </div>
                <p>₹ {item.price * item.quantity}</p>
              </div>
            ))}
            <h2>
              <b>Grand Total:</b> ₹ {getTotalPrice()}
            </h2>
            {user.isLoggedIn ? (
              <div className="flex justify-end gap-4">
                {/* Stripe Payment Button */}
                <button
                  className="flex placeholder:border-2 rounded-[12px] bg-[#6366f1] hover:bg-[#4f46e5] border-transparent focus:border-transparent focus:ring-0 text-white items-center p-2 cursor-pointer sm_max:my-10"
                  onClick={onStripeCheckout}
                  disabled={loading || checkoutLoading}
                >
                  <Image
                    src="/Images/Icons/shopping-cart.png"
                    width="20px"
                    height="20px"
                    alt="shopping cart"
                  />
                  <p className="ml-3 font-normal">
                    {checkoutLoading ? "Processing Payment..." : "Pay Online"}
                  </p>
                </button>

                {/* Direct Firebase Order Button (Cash on Delivery) */}
                <button
                  className="flex placeholder:border-2 rounded-[12px] bg-[#20E58F] hover:bg-[#229764] border-transparent focus:border-transparent focus:ring-0 text-white items-center p-2 cursor-pointer sm_max:my-10"
                  onClick={onDirectFirebaseCheckout}
                  disabled={loading || checkoutLoading}
                >
                  <Image
                    src="/Images/Icons/shopping-cart.png"
                    width="20px"
                    height="20px"
                    alt="shopping cart"
                  />
                  <p className="ml-3 font-normal">
                    {loading ? "Processing..." : "Cash on Delivery"}
                  </p>
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-end">
                  <button
                    className="flex placeholder:border-2 rounded-[12px] bg-[#20E58F] hover:bg-[#229764] border-transparent focus:border-transparent focus:ring-0 text-white items-center p-2 cursor-not-allowed sm_max:my-10"
                    disabled
                  >
                    <Image
                      src="/Images/Icons/shopping-cart.png"
                      width="20px"
                      height="20px"
                      alt="shopping cart"
                    />
                    <p className="ml-3 font-normal ">Check Out!</p>
                  </button>
                </div>
                <div>
                  <p className="text-xl font-normal ">
                    Please Login to Check Out! 👉
                    <span className="hover:underline text-blue-400">
                      {" "}
                      <Link href="/signin" passHref>
                        Login...
                      </Link>
                    </span>
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default Cart;