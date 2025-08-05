import React from "react";
import ProductCard from "../components/ProductCard/ProductCard";
import styles from "../styles/ShopPage.module.css";
import Navbar from "../components/Navbar/Navbar";
import { db } from "../firebase";  // ✅ shared Firebase instance
import { collection, getDocs } from "firebase/firestore";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ShoppingProducts = ({ products }) => {
  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <h1 className={styles.title}>All Results</h1>
        <div className={styles.cards}>
          {products.map((product) => (
            <div
              key={product.id}
              className="hover:scale-105 transition duration-150 ease-out hover:ease-in cursor-pointer"
            >
              <ProductCard
                key={product.id}
                productName={product.name}
                pids={product.id}
                imageUrl={product.image}
                location={product.location}
                product={product}
                price={product.price}
                weight={product.weight}
              />
              {/* ❌ REMOVED ToastContainer from here */}
            </div>
          ))}
        </div>
      </div>

      {/* ✅ SINGLE ToastContainer at the page level */}
      <ToastContainer/>
    </>
  );
};

export default ShoppingProducts;

// ✅ Fetch products from Firestore instead of axios
export async function getServerSideProps() {
  let products = [];
  try {
    const snap = await getDocs(collection(db, "products"));
    snap.forEach((docSnap) => {
      const p = docSnap.data();
      const stock = parseFloat(p.productStock || 0);
      if (stock > 0) {
        products.push({
          id: docSnap.id,
          name: p.productName || "Unknown Product",
          image: p.image || "/placeholder.jpg",
          location: "5", // (replace with actual if you have)
          price: p.productRate || 0,
          weight: `${stock} ${p.productUnit || "kg"}`
        });
      }
    });
  } catch (error) {
    console.error("Error fetching products:", error);
  }

  return {
    props: {
      products,
    },
  };
}