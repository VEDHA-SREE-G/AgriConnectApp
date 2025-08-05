import React from "react";
import { Pie } from "react-chartjs-2";

function SalesPieChart({ purchaseHistory }) {
  // Return early if no data
  if (!purchaseHistory || purchaseHistory.length === 0) {
    return (
      <div className="w-[40%] h-[250px] mr-10 flex flex-col items-center justify-center rounded-md border border-[#C9C9C9] shadow-md mb-10 p-5">
        <p className="font-dmsans">Quarterly Sales</p>
        <p className="text-gray-500 text-sm mt-2">No sales data available</p>
      </div>
    );
  }

  const currentDate = new Date();
  currentDate.setFullYear(currentDate.getFullYear() - 1);

  const productSalesData = purchaseHistory
    .filter((purchase) => {
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
        return purchaseDate > currentDate;
      } catch (error) {
        console.error('Error processing date:', error);
        return false;
      }
    })
    .reduce((productSales, purchase) => {
      try {
        // Use productName and productId from your database structure
        const productId = purchase.productId || purchase.id || 'unknown';
        const productName = purchase.productName || purchase.name || 'Unknown Product';
        const quantity = purchase.quantity || 1;

        if (!productSales[productId]) {
          productSales[productId] = {
            name: productName,
            quantity: 0,
          };
        }
        productSales[productId].quantity += quantity;
      } catch (error) {
        console.error('Error processing purchase for pie chart:', error, purchase);
      }
      return productSales;
    }, {});

  const labels = Object.values(productSalesData).map((product) => product.name);
  const data = Object.values(productSalesData).map((product) => product.quantity);

  // Use predefined colors with your brand theme
  const predefinedColors = [
    "rgba(0, 146, 43, 0.8)",   // Your brand green
    "rgba(255, 99, 132, 0.8)", // Red
    "rgba(54, 162, 235, 0.8)", // Blue
    "rgba(255, 206, 86, 0.8)", // Yellow
    "rgba(75, 192, 192, 0.8)", // Teal
    "rgba(153, 102, 255, 0.8)", // Purple
    "rgba(255, 159, 64, 0.8)",  // Orange
    "rgba(199, 199, 199, 0.8)", // Grey
    "rgba(83, 102, 255, 0.8)",  // Indigo
    "rgba(255, 99, 255, 0.8)",  // Pink
  ];

  const backgroundColors = labels.map((_, index) => {
    if (index < predefinedColors.length) {
      return predefinedColors[index];
    }
    // Generate random colors if more products than predefined colors
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgba(${r}, ${g}, ${b}, 0.8)`;
  });

  const borderColors = backgroundColors.map(color => 
    color.replace('0.8)', '1)')
  );

  const chartData = {
    labels,
    datasets: [
      {
        data,
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
          padding: 15,
          usePointStyle: true,
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} units (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="w-[40%] h-[250px] mr-10 flex flex-col items-center justify-center rounded-md border border-[#C9C9C9] shadow-md mb-10 p-5">
      <p className="font-dmsans mb-2">Quarterly Sales</p>
      <div className="w-full h-full">
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
}

export default SalesPieChart;