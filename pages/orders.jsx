"use client"; // ensures it only runs on client side

import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar/Navbar";
import { useSelector } from "react-redux";
import OrderComponent from "../components/OrderComponent/OrderComponent";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

const OrdersPage = () => {
  const user = useSelector((state) => state.user);
  const [orderPurchased, setOrderPurchased] = useState([]);
  const [orderStatus, setOrderStatus] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to safely format dates
  const formatOrderDate = (dateValue) => {
    try {
      let date;
      
      // Handle Firebase Timestamp
      if (dateValue && typeof dateValue.toDate === 'function') {
        date = dateValue.toDate();
      }
      // Handle regular Date object
      else if (dateValue instanceof Date) {
        date = dateValue;
      }
      // Handle string dates
      else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      }
      // Handle timestamp numbers
      else if (typeof dateValue === 'number') {
        date = new Date(dateValue);
      }
      // Handle objects with seconds (Firebase timestamp structure)
      else if (dateValue && dateValue.seconds) {
        date = new Date(dateValue.seconds * 1000);
      }
      else {
        // Fallback to current date
        date = new Date();
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Date not available";
      }

      return date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (error) {
      console.error("Error formatting date:", error, dateValue);
      return "Date not available";
    }
  };

  async function fetchOrderPurchased(user) {
    if (!user?.user?.id || !user?.isLoggedIn) {
      setError("Please log in to view your orders");
      return;
    }
    if (!db) {
      setError("Database connection failed");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const simpleQuery = query(
        collection(db, "orders"),
        where("userId", "==", user.user.id)
      );
      const querySnapshot = await getDocs(simpleQuery);

      const orders = [];
      querySnapshot.forEach((docSnapshot) => {
        const orderData = docSnapshot.data();
        
        // Better date handling
        let purchasedDate;
        if (orderData.purchasedAt) {
          if (typeof orderData.purchasedAt.toDate === 'function') {
            purchasedDate = orderData.purchasedAt.toDate();
          } else if (orderData.purchasedAt.seconds) {
            purchasedDate = new Date(orderData.purchasedAt.seconds * 1000);
          } else {
            purchasedDate = new Date(orderData.purchasedAt);
          }
        } else {
          purchasedDate = new Date();
        }

        const transformedOrder = {
          id: docSnapshot.id,
          purchasedAt: purchasedDate,
          formattedDate: formatOrderDate(orderData.purchasedAt), // Add formatted date
          totalAmount: orderData.totalPrice || orderData.totalAmount || 0,
          status: orderData.orderStatus || orderData.status || "pending",
          paymentStatus: orderData.paymentStatus || "pending",
          deliveryAddress: orderData.deliveryAddress || "Not provided",
          productsBrought: [
            {
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
            },
          ],
          ...orderData,
        };

        orders.push(transformedOrder);
      });

      // Sort by date (most recent first)
      orders.sort((a, b) => {
        const dateA = a.purchasedAt instanceof Date ? a.purchasedAt : new Date();
        const dateB = b.purchasedAt instanceof Date ? b.purchasedAt : new Date();
        return dateB - dateA;
      });
      
      setOrderPurchased(orders);
    } catch (err) {
      setError("Failed to fetch orders");
      console.error("Fetch orders error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function createOrder(orderData) {
    if (!user?.user?.id || !user?.isLoggedIn) {
      throw new Error("User not authenticated");
    }
    const newOrder = {
      userId: user.user.id,
      purchasedAt: serverTimestamp(),
      orderStatus: "pending",
      paymentStatus: "pending",
      createdAt: serverTimestamp(),
      ...orderData,
    };
    const docRef = await addDoc(collection(db, "orders"), newOrder);
    await fetchOrderPurchased(user);
    return docRef.id;
  }

  async function updateOrder(orderId, updateData) {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, { ...updateData, updatedAt: serverTimestamp() });
    await fetchOrderPurchased(user);
  }

  async function deleteOrder(orderId) {
    await deleteDoc(doc(db, "orders", orderId));
    await fetchOrderPurchased(user);
  }

  async function updateOrderStatus(orderId, newStatus) {
    await updateOrder(orderId, { orderStatus: newStatus, status: newStatus });
    setOrderStatus(newStatus);
  }

  async function cancelOrder(orderId) {
    await updateOrder(orderId, {
      orderStatus: "cancelled",
      status: "cancelled",
      cancelledAt: serverTimestamp(),
    });
  }

  useEffect(() => {
    if (db && user?.user?.id && user?.isLoggedIn) {
      fetchOrderPurchased(user);
    }
  }, [user]);

  const orderOperations = {
    create: createOrder,
    update: updateOrder,
    delete: deleteOrder,
    updateStatus: updateOrderStatus,
    cancel: cancelOrder,
    refresh: () => fetchOrderPurchased(user),
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
            <div
              key={order.id || index}
              className="mb-6 p-5 border rounded-lg shadow-sm"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="font-poppins text-lg">
                    Ordered on {order.formattedDate || formatOrderDate(order.purchasedAt)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Total: ₹{order.totalAmount}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {order.paymentStatus && (
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        order.paymentStatus === "completed"
                          ? "bg-green-100 text-green-800"
                          : order.paymentStatus === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : order.paymentStatus === "failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      Payment: {order.paymentStatus}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-around flex-wrap gap-4">
                {order.productsBrought?.length > 0 ? (
                  order.productsBrought.map((product, productIndex) => (
                    <OrderComponent
                      product={product}
                      index={productIndex}
                      orderStatus={
                        order.status || order.orderStatus || "pending"
                      }
                      key={product.id || productIndex}
                      orderOperations={orderOperations}
                      orderId={order.id}
                    />
                  ))
                ) : (
                  <p className="text-gray-500">No products in this order</p>
                )}
              </div>
            </div>
          ))}
      </div>
    </>
  );
};

export default React.memo(OrdersPage);