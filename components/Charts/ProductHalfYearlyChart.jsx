import React from "react";
import { Bar } from "react-chartjs-2";

function ProductHalfYearlyChart({ salesData }) {
  // Return early if no data
  if (!salesData || salesData.length === 0) {
    return (
      <div className="w-[40%] h-[250px] mr-10 flex flex-col items-center justify-center rounded-md border border-[#C9C9C9] shadow-md mb-10 p-5">
        <p className="font-dmsans">Half yearly Sales</p>
        <p className="text-gray-500 text-sm mt-2">No sales data available</p>
      </div>
    );
  }

  const productSalesByMonth = salesData.reduce((monthlySales, purchase) => {
    try {
      // Handle Firestore timestamp or regular date
      let purchaseDate;
      if (purchase.purchasedAt) {
        if (purchase.purchasedAt.toDate) {
          purchaseDate = purchase.purchasedAt.toDate();
        } else if (purchase.purchasedAt.seconds) {
          purchaseDate = new Date(purchase.purchasedAt.seconds * 1000);
        } else {
          purchaseDate = new Date(purchase.purchasedAt);
        }
      } else {
        purchaseDate = new Date();
      }

      const month = purchaseDate.getMonth() + 1; // Months are 0-indexed
      
      // Use productName from your database structure instead of productsBrought
      const productName = purchase.productName || purchase.name || 'Unknown Product';

      if (!monthlySales[month]) {
        monthlySales[month] = {};
      }

      if (!monthlySales[month][productName]) {
        monthlySales[month][productName] = 0;
      }

      // Use totalPrice from your database structure instead of totalCost
      monthlySales[month][productName] += purchase.totalPrice || purchase.totalAmount || 0;

      return monthlySales;
    } catch (error) {
      console.error('Error processing purchase:', error, purchase);
      return monthlySales;
    }
  }, {});

  // Get unique product names from your database structure
  const productNames = Array.from(
    new Set(
      salesData.map((purchase) => 
        purchase.productName || purchase.name || 'Unknown Product'
      )
    )
  );

  // Get month names for better display
  const getMonthName = (monthNumber) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[monthNumber - 1] || monthNumber;
  };

  const chartData = {
    labels: Object.keys(productSalesByMonth).sort((a, b) => a - b).map(month => getMonthName(parseInt(month))),
    datasets: productNames.map((productName, index) => {
      // Use predefined colors with fallback to random
      const colors = [
        'rgba(0, 146, 43, 0.6)',   // Your brand green
        'rgba(255, 99, 132, 0.6)', // Red
        'rgba(54, 162, 235, 0.6)', // Blue
        'rgba(255, 206, 86, 0.6)', // Yellow
        'rgba(75, 192, 192, 0.6)', // Teal
        'rgba(153, 102, 255, 0.6)', // Purple
        'rgba(255, 159, 64, 0.6)'  // Orange
      ];
      
      const backgroundColor = colors[index % colors.length] || 
        `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 0.6)`;

      return {
        label: productName,
        data: Object.keys(productSalesByMonth)
          .sort((a, b) => a - b)
          .map((month) => productSalesByMonth[month][productName] || 0),
        backgroundColor: backgroundColor,
        borderColor: backgroundColor.replace('0.6)', '1)'),
        borderWidth: 1
      };
    }),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: "Month",
        },
      },
      y: {
        title: {
          display: true,
          text: "Sales Amount (₹)",
        },
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString();
          }
        }
      },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 20,
          padding: 15
        }
      }
    }
  };

  return (
    <div className="w-[40%] h-[250px] mr-10 flex flex-col items-center justify-center rounded-md border border-[#C9C9C9] shadow-md mb-10 p-5">
      <p className="font-dmsans">Half yearly Sales</p>
      <div className="w-full h-full mt-2">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}

export default ProductHalfYearlyChart;