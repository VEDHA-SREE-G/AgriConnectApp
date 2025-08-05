import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Chart, registerables } from "chart.js";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase"; // make sure you export db from your firebase.js
import SalesAnalysisChart from "../Charts/SalesAnalysisChart";
import SalesPieChart from "../Charts/SalesPieChart";
import ProductHalfYearlyChart from "../Charts/ProductHalfYearlyChart";
import MonthlySalesChart from "../Charts/MonthlySalesChart";

Chart.register(...registerables);

function Dashboard() {
  const [purchasedOrder, setPurchasedOrder] = useState([]);
  const [adminAnalytics, setAdminAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const { isLoggedIn, admin } = useSelector((state) => state.admin);

  useEffect(() => {
    const fetchFarmerOrders = async () => {
      if (!isLoggedIn || !admin?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get all orders first
        const allOrdersQuery = query(collection(db, "orders"));
        const allOrdersSnap = await getDocs(allOrdersQuery);
        
        let orders = [];
        let totalSalesAmount = 0;
        let totalProducts = 0;
        let uniqueUsers = new Set();

        // Process each order to check if it belongs to current farmer
        for (const orderDoc of allOrdersSnap.docs) {
          const orderData = orderDoc.data();
          
          if (orderData.productId) {
            try {
              // Get the product details using productId
              const productQuery = query(
                collection(db, "products"),
                where("productId", "==", orderData.productId)
              );
              const productSnap = await getDocs(productQuery);
              
              // Check if product belongs to current farmer
              productSnap.forEach((productDoc) => {
                const productData = productDoc.data();
                
                if (productData.farmerId === admin.id) {
                  // This order is for current farmer's product
                  orders.push({ id: orderDoc.id, ...orderData });

                  // Calculate total sales amount using totalPrice field
                  totalSalesAmount += orderData.totalPrice || orderData.totalAmount || 0;
                  
                  // Count total products sold (quantity from order)
                  totalProducts += orderData.quantity || 1;
                  
                  // Count unique customers who bought from this farmer
                  if (orderData.userId && orderData.userId !== admin.id) {
                    uniqueUsers.add(orderData.userId);
                  }
                }
              });
            } catch (productError) {
              console.error("Error fetching product for order:", orderData.productId, productError);
            }
          }
        }

        console.log("Fetched farmer orders:", orders);
        console.log("Analytics:", {
          totalSalesAmount,
          totalOrders: orders.length,
          totalProducts,
          totalUsers: uniqueUsers.size,
        });

        setPurchasedOrder(orders);
        setAdminAnalytics({
          totalSalesAmount,
          totalOrders: orders.length,
          totalProducts,
          totalUsers: uniqueUsers.size,
        });
      } catch (error) {
        console.error("Error fetching farmer orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFarmerOrders();
  }, [admin, isLoggedIn]);

  if (loading) {
    return (
      <div className="w-full h-full p-5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00922B] mx-auto mb-4"></div>
          <p className="font-dmsans text-[#5A5A5A]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-5 flex flex-wrap justify-around">
      {/* Stats cards */}
      <div className="w-full flex flex-wrap items-center justify-around">
        <div className="w-[250px] h-[100px] rounded-md border border-[#C9C9C9] shadow-md flex flex-col items-center justify-center mb-10">
          <p className="font-dmsans text-[#5A5A5A] font-[400]">
            Total Sales Amount
          </p>
          <p className="font-dmsans text-[#00922B] font-bold text-lg">
            ₹{adminAnalytics ? adminAnalytics.totalSalesAmount.toLocaleString() : 0}
          </p>
        </div>
        <div className="w-[250px] h-[100px] rounded-md border border-[#C9C9C9] shadow-md flex flex-col items-center justify-center mb-10">
          <p className="font-dmsans text-[#5A5A5A] font-[400]">Total Orders</p>
          <p className="font-dmsans font-bold text-lg">
            {adminAnalytics ? adminAnalytics.totalOrders : 0}
          </p>
        </div>
        <div className="w-[250px] h-[100px] rounded-md border border-[#C9C9C9] shadow-md flex flex-col items-center justify-center mb-10">
          <p className="font-dmsans text-[#5A5A5A] font-[400]">
            Total Products Sold
          </p>
          <p className="font-dmsans font-bold text-lg">
            {adminAnalytics ? adminAnalytics.totalProducts : 0}
          </p>
        </div>
        <div className="w-[250px] h-[100px] rounded-md border border-[#C9C9C9] shadow-md flex flex-col items-center justify-center mb-10">
          <p className="font-dmsans text-[#5A5A5A] font-[400]">
            Total Customers
          </p>
          <p className="font-dmsans font-bold text-lg">
            {adminAnalytics ? adminAnalytics.totalUsers : 0}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="w-full">
        {purchasedOrder.length > 0 ? (
          <div className="flex flex-wrap items-center justify-around w-full h-full">
            <SalesAnalysisChart salesData={purchasedOrder} />
            <SalesPieChart purchaseHistory={purchasedOrder} />
            <ProductHalfYearlyChart salesData={purchasedOrder} />
            <MonthlySalesChart salesData={purchasedOrder} />
          </div>
        ) : (
          <div className="w-full flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="font-dmsans text-xl text-[#5A5A5A] mb-2">No Sales Data</h3>
              <p className="font-dmsans text-sm text-[#8A8A8A]">
                You haven&apos;t received any orders yet. Start selling to see your analytics!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;