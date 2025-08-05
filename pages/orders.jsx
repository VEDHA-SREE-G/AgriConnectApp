import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar/Navbar";
import { useSelector } from "react-redux";
import OrderComponent from "../components/OrderComponent/OrderComponent";
import { db } from "../firebase";
// Firebase imports
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy,
  serverTimestamp,
  connectFirestoreEmulator 
} from "firebase/firestore";

// Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyB0mvAaGlZl9_-TPHLe_Cgkofhlvj64rdc",
//   authDomain: "agriconnect-3c327.firebaseapp.com",
//   projectId: "agriconnect-3c327",
//   storageBucket: "agriconnect-3c327.appspot.com",
//   messagingSenderId: "522663366346",
//   appId: "1:522663366346:web:812340ea9450a74150ae33",
//   measurementId: "G-DB1CY1X8JP"
// };

// // Initialize Firebase safely
// let app;
// let db;

// try {
//   app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
//   db = getFirestore(app);
  
//   // Uncomment this if you're using Firebase emulator for development
//   // if (process.env.NODE_ENV === 'development' && !db._delegate._databaseId) {
//   //   connectFirestoreEmulator(db, 'localhost', 8080);
//   // }
// } catch (error) {
//   console.error("Firebase initialization error:", error);
// }

const Orders = () => {
  const user = useSelector((state) => state.user);
  const [orderPurchased, setOrderPurchased] = useState([]);
  const [orderStatus, setOrderStatus] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Enhanced debugging function
  const debugUserState = () => {
    console.log("=== USER DEBUG INFO ===");
    console.log("Full user object:", user);
    console.log("user.user:", user?.user);
    console.log("user.user.id:", user?.user?.id);
    console.log("user.isLoggedIn:", user?.isLoggedIn);
    console.log("typeof user.user.id:", typeof user?.user?.id);
    console.log("=== END DEBUG INFO ===");
  };

  // READ - Fetch orders from Firebase with enhanced error handling
  async function fetchOrderPurchased(user) {
    debugUserState();

    if (!user?.user?.id || !user?.isLoggedIn) {
      console.log("User not authenticated - skipping fetch");
      setError("Please log in to view your orders");
      return;
    }

    if (!db) {
      console.error("Firestore database not initialized");
      setError("Database connection failed");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log("Attempting to fetch orders for user ID:", user.user.id);
      
      // Try a simple query first without orderBy to test basic connectivity
      const simpleQuery = query(
        collection(db, "orders"),
        where("userId", "==", user.user.id)
      );
      
      console.log("Executing Firestore query...");
      const querySnapshot = await getDocs(simpleQuery);
      console.log("Query executed successfully. Document count:", querySnapshot.size);
      
      const orders = [];
      
      querySnapshot.forEach((docSnapshot) => {
        const orderData = docSnapshot.data();
        console.log("Raw order data:", orderData);
        
        // Handle Firestore Timestamp properly
        let purchasedDate;
        
        if (orderData.purchasedAt && orderData.purchasedAt.toDate) {
          // This is a Firestore Timestamp - use toDate() method
          purchasedDate = orderData.purchasedAt.toDate();
        } else if (orderData.purchasedAt) {
          // Fallback for other formats
          purchasedDate = new Date(orderData.purchasedAt);
        } else {
          // Use current date as fallback
          purchasedDate = new Date();
        }

        // Transform the single product order data structure
        const transformedOrder = {
          id: docSnapshot.id,
          purchasedAt: purchasedDate,
          totalAmount: orderData.totalPrice || orderData.totalAmount || 0,
          status: orderData.orderStatus || orderData.status || "pending",
          paymentStatus: orderData.paymentStatus || "pending",
          deliveryAddress: orderData.deliveryAddress || "Not provided",
          // Create a product object from the order data
          productsBrought: [{
            id: orderData.productId || docSnapshot.id,
            productName: orderData.productName || "Unknown Product",
            productDescription: orderData.productDescription || "",
            productRate: orderData.productRate || 0,
            productWeight: orderData.productWeight || "",
            productType: orderData.productType || "",
            productStock: orderData.productStock || 0,
            image: orderData.image || "",
            location: orderData.location || "",
            quantity: orderData.quantity || 1,
            totalPrice: orderData.totalPrice || 0,
            // Include any other product-related fields
            ...Object.keys(orderData).reduce((acc, key) => {
              if (key.startsWith('product') || key === 'image' || key === 'location' || key === 'quantity') {
                acc[key] = orderData[key];
              }
              return acc;
            }, {})
          }],
          ...orderData
        };

        orders.push(transformedOrder);
        console.log("Transformed order:", transformedOrder);
      });

      // Sort orders by date manually since we removed orderBy from query
      orders.sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt));

      setOrderPurchased(orders);
      console.log("Orders processed successfully:", orders);
      
      if (orders.length === 0) {
        console.log("No orders found for this user");
      }
      
    } catch (err) {
      console.error("Detailed error fetching orders:", err);
      console.error("Error code:", err.code);
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);
      
      // Provide more specific error messages
      let errorMessage = "Failed to fetch orders";
      if (err.code === 'permission-denied') {
        errorMessage = "Permission denied. Please check your authentication and Firestore rules.";
      } else if (err.code === 'unavailable') {
        errorMessage = "Firestore service is currently unavailable. Please try again later.";
      } else if (err.code === 'failed-precondition') {
        errorMessage = "Database index may be missing. Check Firestore console for index requirements.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // Test Firestore connection
  async function testFirestoreConnection() {
    try {
      console.log("Testing Firestore connection...");
      // Try to read from a simple collection
      const testQuery = query(collection(db, "orders"));
      await getDocs(testQuery);
      console.log("Firestore connection test successful");
      return true;
    } catch (err) {
      console.error("Firestore connection test failed:", err);
      return false;
    }
  }

  // CREATE - Add new order to Firebase
  async function createOrder(orderData) {
    if (!user?.user?.id || !user?.isLoggedIn) {
      throw new Error("User not authenticated");
    }

    try {
      const newOrder = {
        userId: user.user.id,
        purchasedAt: serverTimestamp(),
        orderStatus: "pending",
        paymentStatus: "pending",
        createdAt: serverTimestamp(),
        ...orderData
      };

      console.log("Creating order:", newOrder);
      const docRef = await addDoc(collection(db, "orders"), newOrder);
      console.log("Order created with ID: ", docRef.id);
      
      // Refresh orders after creating
      await fetchOrderPurchased(user);
      
      return docRef.id;
    } catch (err) {
      console.error("Error creating order:", err);
      throw err;
    }
  }

  // UPDATE - Update order status or details
  async function updateOrder(orderId, updateData) {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      
      console.log("Order updated successfully");
      
      // Refresh orders after updating
      await fetchOrderPurchased(user);
      
    } catch (err) {
      console.error("Error updating order:", err);
      throw err;
    }
  }

  // DELETE - Remove order from Firebase
  async function deleteOrder(orderId) {
    try {
      await deleteDoc(doc(db, "orders", orderId));
      console.log("Order deleted successfully");
      
      // Refresh orders after deleting
      await fetchOrderPurchased(user);
      
    } catch (err) {
      console.error("Error deleting order:", err);
      throw err;
    }
  }

  // Helper function to update order status
  async function updateOrderStatus(orderId, newStatus) {
    try {
      await updateOrder(orderId, { 
        orderStatus: newStatus,
        status: newStatus 
      });
      setOrderStatus(newStatus);
    } catch (err) {
      console.error("Error updating order status:", err);
      setError("Failed to update order status");
    }
  }

  // Helper function to cancel order
  async function cancelOrder(orderId) {
    try {
      await updateOrder(orderId, { 
        orderStatus: "cancelled",
        status: "cancelled",
        cancelledAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error cancelling order:", err);
      setError("Failed to cancel order");
    }
  }

  useEffect(() => {
    console.log("Orders component mounted/user changed");
    
    // Test connection first
    if (db) {
      testFirestoreConnection().then(isConnected => {
        if (isConnected && user?.user?.id && user?.isLoggedIn) {
          fetchOrderPurchased(user);
        }
      });
    }
  }, [user]);

  // Expose CRUD functions
  const orderOperations = {
    create: createOrder,
    update: updateOrder,
    delete: deleteOrder,
    updateStatus: updateOrderStatus,
    cancel: cancelOrder,
    refresh: () => fetchOrderPurchased(user)
  };

  return (
    <>
      <Navbar />
      <div className="p-5">
        <h2 className="text-2xl font-semibold mb-4">My Orders</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
            <button 
              onClick={() => fetchOrderPurchased(user)}
              className="ml-3 text-sm underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}
        
        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2">Loading orders...</p>
          </div>
        )}
      </div>
      
      <div className="p-5">
        {!loading && !error && orderPurchased.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">No orders found</p>
            <p className="text-gray-400 text-sm mt-2">
              Orders you place will appear here
            </p>
          </div>
        )}
        
        {orderPurchased.length > 0 &&
          orderPurchased.map((order, index) => (
            <div key={order.id || index} className="mb-6 p-5 border rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="font-poppins text-lg">
                    Ordered on{" "}
                    {(() => {
                      console.log("Date in render:", order.purchasedAt);
                      console.log("Date type:", typeof order.purchasedAt);
                      console.log("Date instanceof Date:", order.purchasedAt instanceof Date);
                      
                      if (!order.purchasedAt) {
                        return "No date available";
                      }
                      
                      try {
                        let dateToUse;
                        
                        // If it's still a Firestore timestamp
                        if (order.purchasedAt.toDate && typeof order.purchasedAt.toDate === 'function') {
                          dateToUse = order.purchasedAt.toDate();
                          console.log("Converted timestamp to date:", dateToUse);
                        } else {
                          dateToUse = new Date(order.purchasedAt);
                          console.log("Created date from:", order.purchasedAt, "Result:", dateToUse);
                        }
                        
                        if (isNaN(dateToUse.getTime())) {
                          console.log("Date is invalid");
                          return "Invalid date format";
                        }
                        
                        return dateToUse.toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long', 
                          day: 'numeric'
                        });
                      } catch (e) {
                        console.error("Error formatting date:", e);
                        return "Date formatting error";
                      }
                    })()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Total: ₹{order.totalAmount}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {order.paymentStatus && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                      order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      Payment: {order.paymentStatus}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-around flex-wrap gap-4">
                {order.productsBrought && order.productsBrought.length > 0 ? 
                  order.productsBrought.map((product, productIndex) => (
                    <OrderComponent
                      product={product}
                      index={productIndex}
                      orderStatus={order.status || order.orderStatus || "pending"}
                      key={product.id || productIndex}
                      orderOperations={orderOperations}
                      orderId={order.id}
                    />
                  )) : (
                    <p className="text-gray-500">No products in this order</p>
                  )
                }
              </div>
            </div>
          ))}
      </div>
    </>
  );
};

export default React.memo(Orders);