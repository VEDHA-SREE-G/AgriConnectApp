import React from "react";
import { Doughnut } from "react-chartjs-2";

function MonthlySalesChart({ salesData }) {
  // Return early if no data
  if (!salesData || salesData.length === 0) {
    return (
      <div className="w-[40%] h-[250px] mr-10 flex flex-col items-center justify-center rounded-md border border-[#C9C9C9] shadow-md mb-10 p-5">
        <p className="font-dmsans">Monthly Sales</p>
        <p className="text-gray-500 text-sm mt-2">No sales data available</p>
      </div>
    );
  }

  const monthlySales = salesData.reduce((monthlySales, purchase) => {
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
      } else if (purchase.createdAt) {
        if (purchase.createdAt.toDate) {
          purchaseDate = purchase.createdAt.toDate();
        } else if (purchase.createdAt.seconds) {
          purchaseDate = new Date(purchase.createdAt.seconds * 1000);
        } else {
          purchaseDate = new Date(purchase.createdAt);
        }
      } else {
        purchaseDate = new Date();
      }

      const month = purchaseDate.toLocaleString("default", { month: "long" });

      if (!monthlySales[month]) {
        monthlySales[month] = 0;
      }

      // Use totalPrice from your database structure instead of totalCost
      const amount = purchase.totalPrice || purchase.totalAmount || purchase.amount || 0;
      monthlySales[month] += amount;

      return monthlySales;
    } catch (error) {
      console.error('Error processing purchase for monthly chart:', error, purchase);
      return monthlySales;
    }
  }, {});

  const months = Object.keys(monthlySales);
  const salesAmounts = Object.values(monthlySales);

  // Use predefined colors with your brand theme
  const predefinedColors = [
    'rgba(0, 146, 43, 0.8)',   // Your brand green
    'rgba(255, 99, 132, 0.8)', // Red
    'rgba(54, 162, 235, 0.8)', // Blue
    'rgba(255, 206, 86, 0.8)', // Yellow
    'rgba(75, 192, 192, 0.8)', // Teal
    'rgba(153, 102, 255, 0.8)', // Purple
    'rgba(255, 159, 64, 0.8)',  // Orange
    'rgba(199, 199, 199, 0.8)', // Grey
    'rgba(83, 102, 255, 0.8)',  // Indigo
    'rgba(255, 99, 255, 0.8)',  // Pink
    'rgba(99, 255, 132, 0.8)',  // Light Green
    'rgba(255, 159, 132, 0.8)'  // Light Orange
  ];

  const backgroundColors = months.map((_, index) => {
    if (index < predefinedColors.length) {
      return predefinedColors[index];
    }
    // Fallback to random colors if more than predefined colors
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgba(${r}, ${g}, ${b}, 0.8)`;
  });

  const borderColors = backgroundColors.map(color => 
    color.replace('0.8)', '1)')
  );

  const data = {
    labels: months,
    datasets: [
      {
        data: salesAmounts,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
        hoverOffset: 4
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ₹${value.toLocaleString()}`;
          }
        }
      }
    }
  };

  return (
    <div className="w-[40%] h-[250px] mr-10 flex flex-col items-center justify-center rounded-md border border-[#C9C9C9] shadow-md mb-10 p-5">
      <p className="font-dmsans mb-2">Monthly Sales</p>
      <div className="w-full h-full">
        <Doughnut data={data} options={options} />
      </div>
    </div>
  );
}

export default MonthlySalesChart;