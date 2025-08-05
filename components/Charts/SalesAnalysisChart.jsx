import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function SalesAnalysisChart({ salesData }) {
  function groupSalesByMonth(data) {
    const monthlySales = {};
    
    if (!data || !Array.isArray(data)) {
      return monthlySales;
    }

    data.forEach((purchase) => {
      try {
        // Handle Firestore timestamp or regular date
        let date;
        if (purchase.purchasedAt) {
          if (purchase.purchasedAt.toDate) {
            date = purchase.purchasedAt.toDate();
          } else if (purchase.purchasedAt.seconds) {
            date = new Date(purchase.purchasedAt.seconds * 1000);
          } else {
            date = new Date(purchase.purchasedAt);
          }
        } else {
          date = new Date();
        }

        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const key = `${year}-${String(month).padStart(2, '0')}`;
        
        if (!monthlySales[key]) {
          monthlySales[key] = 0;
        }
        
        // Use totalPrice from your database structure
        const amount = purchase.totalPrice || purchase.totalAmount || 0;
        monthlySales[key] += parseFloat(amount) || 0;
      } catch (error) {
        console.error('Error processing purchase for chart:', error, purchase);
      }
    });
    
    return monthlySales;
  }

  function getMonthName(dateString) {
    const [year, month] = dateString.split("-");
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const monthIndex = parseInt(month, 10) - 1;
    return `${months[monthIndex]} ${year}`;
  }

  function sortDateKeys(keys) {
    return keys.sort((a, b) => {
      const [yearA, monthA] = a.split("-").map(Number);
      const [yearB, monthB] = b.split("-").map(Number);
      
      if (yearA !== yearB) {
        return yearA - yearB;
      }
      return monthA - monthB;
    });
  }

  const monthlySales = groupSalesByMonth(salesData);
  const sortedLabels = sortDateKeys(Object.keys(monthlySales));
  const totalSales = sortedLabels.map(key => monthlySales[key]);
  const monthLabels = sortedLabels.map((label) => getMonthName(label));

  const data = {
    labels: monthLabels,
    datasets: [
      {
        label: "Monthly Sales (₹)",
        data: totalSales,
        fill: false,
        borderColor: "#00922B",
        backgroundColor: "#00922B",
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString();
          }
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 0
        }
      }
    },
    elements: {
      point: {
        hoverBackgroundColor: "#00922B",
        hoverBorderColor: "#ffffff",
        hoverBorderWidth: 2
      }
    }
  };

  // Show message if no data
  if (!salesData || salesData.length === 0) {
    return (
      <div className="w-[40%] h-[250px] mr-10 rounded-md border border-[#C9C9C9] shadow-md flex flex-col items-center justify-center mb-10 p-5">
        <p className="font-dmsans font-semibold mb-4">Sales Analysis</p>
        <p className="text-gray-500 text-sm">No sales data available</p>
      </div>
    );
  }

  return (
    <div className="w-[40%] h-[250px] mr-10 rounded-md border border-[#C9C9C9] shadow-md flex flex-col items-center justify-start mb-10 p-5">
      <p className="font-dmsans font-semibold mb-4">Sales Analysis</p>
      <div className="w-full h-full">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

export default SalesAnalysisChart;