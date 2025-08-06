// Updated cart.js with Firebase synchronization
import React, { useEffect, useState } from "react";
import Image from "next/image";
import styles from "../styles/cart.module.css";
import Navbar from "../components/Navbar/Navbar";
import { useDispatch, useSelector } from "react-redux";
import {
  decrementQuantity,
  incrementQuantity,
  removeFromCart,
  setCart
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

function Cart() {
  const cart = useSelector((state) => state.cart);
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

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

  // Firebase checkout function - Create separate order document for each item + Update Stock
  const onCartCheckout = async () => {
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
          orderStatus: "pending",
          paymentStatus: "pending",
          purchasedAt: serverTimestamp(),
          deliveryAddress: user.address || "Not provided"
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
      cart.forEach(item => {
        dispatch(removeFromCart(item.id));
      });
      await clearFirebaseCart();

      const orderIds = orderRefs.map(ref => ref.id).join(", ");
      alert(`Orders placed successfully! Stock updated. Order IDs: ${orderIds}`);
      
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
                    disabled={loading}
                  >
                    +
                  </button>
                  <button 
                    onClick={() => handleDecrement(item.id)}
                    disabled={loading}
                  >
                    -
                  </button>
                  <button 
                    onClick={() => handleRemove(item.id)}
                    disabled={loading}
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
              <div className="flex justify-end">
                <button
                  className="flex  placeholder:border-2 rounded-[12px] bg-[#20E58F] hover:bg-[#229764]  border-transparent focus:border-transparent focus:ring-0  text-white   items-center p-2 cursor-pointer sm_max:my-10"
                  onClick={onCartCheckout}
                  disabled={loading}
                >
                  <Image
                    src="/Images/Icons/shopping-cart.png"
                    width="20px"
                    height="20px"
                    alt="shopping cart"
                  />
                  <p className="ml-3 font-normal">
                    {loading ? "Processing..." : "Check Out!"}
                  </p>
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-end">
                  <button
                    className="flex  placeholder:border-2 rounded-[12px] bg-[#20E58F] hover:bg-[#229764]  border-transparent focus:border-transparent focus:ring-0  text-white   items-center p-2 cursor-not-allowed sm_max:my-10"
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