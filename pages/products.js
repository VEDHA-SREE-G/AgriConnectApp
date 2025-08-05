import Image from "next/image";
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar/Navbar";
import Styles from "../styles/Products.module.css";
import Footer from "../components/Footer/Footer";
import Link from "next/link";
import ProductSearchCard from "../components/ProductSearchCard/ProductSearchCard";
import ProductCard from "../components/ProductCard/ProductCard";
import { searchProducts } from "../testData";
import { useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { db } from "../firebase";   // ✅ reuse single firebase instance
import { collection, getDocs } from "firebase/firestore";

function Product() {
  const [searchInput, setSearchInput] = useState("");
  const [filteredResults, setFilteredResults] = useState([]);
  const [products, setProducts] = useState([]);
  const purchase = useSelector((state) => state.purchase);

  // Initialize Google Translate
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.head.appendChild(script);

      window.googleTranslateElementInit = function() {
        new window.google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: 'en,ta,hi,te,kn,ml,bn,gu,mr,or,ur',
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
        }, 'google_translate_element');
      };
    }
  }, []);

  // Load products from Firebase
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const snap = await getDocs(collection(db, "products"));
      const productsData = [];
      snap.forEach(docSnap => {
        const p = docSnap.data();
        const stock = parseFloat(p.productStock || 0);
        if (stock > 0) {
          // Convert to exact format your ProductCard expects
          productsData.push({
            id: docSnap.id,
            name: p.productName || "Unknown Product",
            image: p.image || "/placeholder.jpg",
            location: "5",
            price: p.productRate || 0,
            weight: `${stock} ${p.productUnit || "kg"}`
          });
        }
      });
      setProducts(productsData);
    } catch (error) {
      console.error("Error loading products:", error);
      setProducts([]);
    }
  };

  // Your original search function
  const searchItems = (searchValue) => {
    setSearchInput(searchValue);
    if (searchValue !== "") {
      const filteredProduct = products.filter((item) => {
        return Object.values(item)
          .join("")
          .toLowerCase()
          .includes(searchValue.toLowerCase());
      });
      setFilteredResults(filteredProduct);
    }
  };

  return (
    <>
      <Navbar />

      {/* Google Translate Widget */}
      <div className="fixed top-4 right-4 z-50">
        <div id="google_translate_element"></div>
      </div>

      <div className="w-full ">
        <div className="w-full h-[400px] relative flex items-center  justify-center divide-black opacity-75 ">
          <div className="w-full h-full sm_max:hidden">
            <Image
              src="/Images/search.png"
              layout="fill"
              objectFit="contain"
              alt="searchBg"
            />
          </div>
          <div className="md:hidden">
            <Image
              src="/Images/search.png"
              layout="fill"
              objectFit="cover"
              alt="searchBg"
            />
          </div>
          <div className="absolute w-96 sm_max:w-[80%] ">
            <div className="flex items-center justify-center mt-10  ">
              <div className="flex items-center bg-white border-2 border-[#000] w-full h-[60px] text-center p-3 font-poppins rounded-md">
                <input
                  type="text"
                  placeholder="Search the product"
                  className="w-full h-full p-5 focus:outline-none"
                  onChange={(e) => searchItems(e.target.value)}
                />
                <button className="w-[50px] h-[45px] bg-black hover:bg-[#252424] rounded-full">
                  <div className="flex items-center justify-center">
                    <Image
                      src="/Images/Icons/RightArrow.png"
                      alt="right-arrow"
                      width="30px"
                      height="13px"
                    />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {filteredResults.length > 0 && searchInput.length > 1 ? (
        <>
          <p className="ml-10 font-medium text-xl sm_max:mt-10">
            Search Results....
          </p>
          <div className="mx-28 my-24 sm_max:mx-5">
            <div className={`${Styles.productCards} mb-10 cursor-pointer`}>
              {filteredResults.map((product) => {
                return (
                  <div
                    key={product.id}
                    className="hover:scale-105 transition duration-150 ease-out hover:ease-in"
                  >
                    <ProductCard
                      product={product}
                      pids={product.id}
                      imageUrl={product.image}
                      productName={product.name}
                      location={product.location}
                      price={product.price}
                      weight={product.weight}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <></>
      )}

      <div className="mx-28 my-24 sm_max:mx-5 ">
        <div className="mb-5">
          <h3 className="text-3xl font-abel ">Products Available Nearby</h3>
          <Image
            src="/Images/Icons/downCurve.png"
            alt="vector image"
            width="300px"
            height="28px"
          />
        </div>
        <div className="">
          <div className={`${Styles.productCards} mb-10 cursor-pointer  `}>
            {products.map(
              (product, index) =>
                index > 2 &&
                parseInt(product.location) <= 5 && (
                  <>
                    <div
                      className="hover:scale-105 transition duration-150 ease-out hover:ease-in"
                      key={product.id}
                    >
                      <ProductCard
                        productName={product.name}
                        pids={product.id}
                        imageUrl={product.image}
                        location={product.location}
                        product={product}
                        price={product.price}
                        weight={product.weight}
                      />
                    </div>
                  </>
                )
            )}
          </div>
          <p className="font-medium text-lg hover:underline hover:text-blue-500">
            <Link href="/shoppingproducts" passHref>
              ... Search other products here
            </Link>
          </p>
        </div>
      </div>
      <div>
        <div className="ml-24 sm_max:ml-5">
          <h3 className="text-3xl  font-abel">Fruits And Vegetables</h3>
          <Image
            src="/Images/Icons/downCurve.png"
            alt="vector image"
            width="300px"
            height="28px"
          />
        </div>

        <div className={`${Styles.nftcards} `}>
          {searchProducts.map((product) => (
            <>
              <Link href={`/product/category/${product.type}`} passHref>
                <div key={product.id}>
                  <ProductSearchCard
                    name={product.productName}
                    type={product.type.toLowerCase()}
                    productImg={product.imageUrl}
                    bgColor={product.bgColor}
                  />
                </div>
              </Link>
            </>
          ))}
        </div>
      </div>
      
      <Footer />

      {/* ✅ TOAST CONTAINER - Added at the end for optimal positioning */}
      <ToastContainer/>
    </>
  );
}

export default Product;