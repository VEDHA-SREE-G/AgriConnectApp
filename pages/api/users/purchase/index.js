// pages/api/users/purchase.js - Complete Firebase CRUD API
import { initializeApp } from "firebase/app";
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
  getDoc 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB0mvAaGlZl9_-TPHLe_Cgkofhlvj64rdc",
  authDomain: "agriconnect-3c327.firebaseapp.com",
  projectId: "agriconnect-3c327",
  storageBucket: "agriconnect-3c327.appspot.com",
  messagingSenderId: "522663366346",
  appId: "1:522663366346:web:812340ea9450a74150ae33",
  measurementId: "G-DB1CY1X8JP"
};

// Initialize Firebase
let app;
let db;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase initialization error:", error);
}

async function handler(req, res) {
  const { method } = req;

  // Authentication check
  const { userId, isAuthenticated } = req.query || req.body;
  
  if (!isAuthenticated || isAuthenticated === "false") {
    return res.status(401).json({
      status: "error",
      message: "Not authenticated"
    });
  }

  try {
    switch (method) {
      // READ - Get all orders for a user
      case "GET":
        await handleGet(req, res);
        break;
      
      // CREATE - Add new order
      case "POST":
        await handlePost(req, res);
        break;
      
      // UPDATE - Update existing order
      case "PUT":
        await handlePut(req, res);
        break;
      
      // DELETE - Remove order
      case "DELETE":
        await handleDelete(req, res);
        break;
      
      default:
        res.status(405).json({
          status: "error",
          message: "Method not allowed",
        });
    }
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message
    });
  }
}

// READ - Fetch orders for a user
async function handleGet(req, res) {
  const { userId } = req.query;

  try {
    // Query orders from Firebase
    const q = query(
      collection(db, "orders"),
      where("userId", "==", userId),
      orderBy("purchasedAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const orders = [];
    
    querySnapshot.forEach((doc) => {
      const orderData = doc.data();
      orders.push({
        id: doc.id,
        purchasedAt: orderData.purchasedAt?.toDate() || new Date(),
        productsBrought: orderData.items || orderData.productsBrought || [],
        totalAmount: orderData.totalAmount || 0,
        status: orderData.orderStatus || orderData.status || "pending",
        orderStatus: orderData.orderStatus || "pending",
        ...orderData
      });
    });

    res.status(200).json({
      status: "success",
      orders: orders,
      count: orders.length
    });
    
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(400).json({
      status: "error",
      message: "Failed to fetch orders",
      data: err.message,
    });
  }
}

// CREATE - Add new order
async function handlePost(req, res) {
  const { userId, orderData } = req.body;

  if (!orderData) {
    return res.status(400).json({
      status: "error",
      message: "Order data is required"
    });
  }

  try {
    const newOrder = {
      userId: userId,
      purchasedAt: serverTimestamp(),
      orderStatus: "pending",
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...orderData
    };

    const docRef = await addDoc(collection(db, "orders"), newOrder);
    
    // Get the created document to return it
    const createdDoc = await getDoc(docRef);
    const createdOrder = {
      id: createdDoc.id,
      ...createdDoc.data()
    };

    res.status(201).json({
      status: "success",
      message: "Order created successfully",
      order: createdOrder,
      orderId: docRef.id
    });
    
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(400).json({
      status: "error",
      message: "Failed to create order",
      data: err.message,
    });
  }
}

// UPDATE - Update existing order
async function handlePut(req, res) {
  const { orderId, updateData } = req.body;

  if (!orderId) {
    return res.status(400).json({
      status: "error",
      message: "Order ID is required"
    });
  }

  if (!updateData) {
    return res.status(400).json({
      status: "error",
      message: "Update data is required"
    });
  }

  try {
    const orderRef = doc(db, "orders", orderId);
    
    // Check if order exists
    const orderDoc = await getDoc(orderRef);
    if (!orderDoc.exists()) {
      return res.status(404).json({
        status: "error",
        message: "Order not found"
      });
    }

    await updateDoc(orderRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });

    // Get updated document
    const updatedDoc = await getDoc(orderRef);
    const updatedOrder = {
      id: updatedDoc.id,
      ...updatedDoc.data()
    };

    res.status(200).json({
      status: "success",
      message: "Order updated successfully",
      order: updatedOrder
    });
    
  } catch (err) {
    console.error("Error updating order:", err);
    res.status(400).json({
      status: "error",
      message: "Failed to update order",
      data: err.message,
    });
  }
}

// DELETE - Remove order
async function handleDelete(req, res) {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({
      status: "error",
      message: "Order ID is required"
    });
  }

  try {
    const orderRef = doc(db, "orders", orderId);
    
    // Check if order exists
    const orderDoc = await getDoc(orderRef);
    if (!orderDoc.exists()) {
      return res.status(404).json({
        status: "error",
        message: "Order not found"
      });
    }

    await deleteDoc(orderRef);

    res.status(200).json({
      status: "success",
      message: "Order deleted successfully",
      orderId: orderId
    });
    
  } catch (err) {
    console.error("Error deleting order:", err);
    res.status(400).json({
      status: "error",
      message: "Failed to delete order",
      data: err.message,
    });
  }
}

export default handler;