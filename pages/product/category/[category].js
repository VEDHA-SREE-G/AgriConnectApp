import React from "react";
import ProductCard from "../../../components/ProductCard/ProductCard";
import styles from "../../../styles/category.module.css";
import { useRouter } from "next/router";
import Navbar from "../../../components/Navbar/Navbar";
import { db } from "../../../firebase";   // ✅ import shared firebase
import { collection, getDocs, query, where } from "firebase/firestore";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const CategoryPage = ({ products }) => {
  const router = useRouter();
  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <h1 className={styles.title}>
          Results for {router.query.category}
        </h1>
        <div className={styles.cards}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              pids={product.id}
              productName={product.name}
              product={product}
              price={product.price}
              imageUrl={product.image}
              weight={product.weight}
              location={product.location}
            />
          ))}
        </div>
      </div>
      <ToastContainer/>
    </>
  );
};

export default CategoryPage;

// ✅ Fetch from Firestore instead of axios
export async function getServerSideProps(context) {
  const { category } = context.query;
  let products = [];

  try {
    // Assuming you store category in Firestore as `productCategory`
    const q = query(
      collection(db, "products"),
      where("productCategory", "==", category)
    );
    const snap = await getDocs(q);

    snap.forEach((docSnap) => {
      const p = docSnap.data();
      const stock = parseFloat(p.productStock || 0);
      if (stock > 0) {
        products.push({
          id: docSnap.id,
          name: p.productName || "Unknown Product",
          image: p.image || "/placeholder.jpg",
          location: "5", // replace with actual if stored
          price: p.productRate || 0,
          weight: `${stock} ${p.productUnit || "kg"}`
        });
      }
    });
  } catch (err) {
    console.error("Error loading category products:", err);
  }

  return {
    props: {
      products,
    },
  };
}
