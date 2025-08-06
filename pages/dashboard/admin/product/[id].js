import { useState, useEffect } from "react";
import DashBoardNavBar from "../../../../components/DashBoardNavBar/DashBoardNavBar";
import DashBoardSidebar from "../../../../components/DashBoardSidebar/DashBoardSidebar";
import { useRouter } from "next/router";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import {db,auth} from '../../../../firebase';

// Google Translate Component
const GoogleTranslate = () => {
  useEffect(() => {
    const addScript = () => {
      const script = document.createElement('script');
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    };

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'en,ta,hi,te,kn,ml,bn,gu,mr,or,ur',
        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
      }, 'google_translate_element');
    };

    if (!window.google || !window.google.translate) {
      addScript();
    } else {
      window.googleTranslateElementInit();
    }
  }, []);

  return <div id="google_translate_element"></div>;
};

const EditProductPage = ({ product }) => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [editedProduct, setEditedProduct] = useState(product);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Load actual product data from Firebase
        try {
          const productRef = doc(db, "products", router.query.id);
          const productSnap = await getDoc(productRef);
          
          if (productSnap.exists()) {
            const productData = productSnap.data();
            // Map Firebase data to component structure
            setEditedProduct({
              productId: productData.productId,
              name: productData.productName,
              image: productData.image || productData.imageUrl,
              category: productData.productType,
              description: productData.productDescription,
              price: productData.productRate,
              quantity: productData.productStock,
              weight: productData.productWeight,
              location: productData.location
            });
          }
        } catch (error) {
          console.error("Error loading product:", error);
        }
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router.query.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedProduct((prevProduct) => ({
      ...prevProduct,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const productRef = doc(db, "products", router.query.id);
      
      await updateDoc(productRef, {
        productType: editedProduct.category,
        productDescription: editedProduct.description,
        location: editedProduct.location,
        productRate: parseInt(editedProduct.price),
        productWeight: editedProduct.weight,
        productStock: parseInt(editedProduct.quantity),
        updatedAt: new Date(),
      });

      toast.success("Product updated successfully!", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
      });
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
      });
    }
  };

  const onDeleteProduct = async (e, adminId, pid) => {
    e.preventDefault();
    
    try {
      await deleteDoc(doc(db, "products", router.query.id));
      
      toast.error("Product deleted successfully!", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
      });
      
      setTimeout(() => {
        router.push("/dashboard/admin/products");
      }, 2000);
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
      });
    }
  };

  return (
    <div>
      <GoogleTranslate />
      <DashBoardNavBar />
      <div>
        <DashBoardSidebar>
          <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4 font-poppins">
              Edit Product
            </h1>
            <div onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block font-bold mb-2 font-montserrat">
                  Name:
                </label>
                <input
                  type="text"
                  name="name"
                  value={editedProduct.name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-not-allowed"
                  disabled
                />
              </div>
              <div className="mb-4">
                <label className="block font-bold mb-2 font-montserrat">
                  Image:
                </label>
                <img
                  name="image"
                  src={editedProduct.image}
                  className="w-[150px] h-[150px] px-3 py-2 border border-gray-300 rounded-md"
                  alt="product-img"
                />
              </div>

              <div className="mb-4">
                <label className="block font-bold mb-2 font-montserrat ">
                  Category:
                </label>
                <input
                  type="text"
                  name="category"
                  value={editedProduct.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block font-bold mb-2 font-montserrat">
                  Description:
                </label>
                <textarea
                  name="description"
                  value={editedProduct.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block font-bold mb-2 font-montserrat">
                  Price (in ₹-):
                </label>
                <input
                  type="number"
                  name="price"
                  value={editedProduct.price}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block font-bold mb-2 font-montserrat">
                  Stock (in {editedProduct.weight}):
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={editedProduct.quantity}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block font-bold mb-2 font-montserrat">
                  Weight (in Unit):
                </label>
                <input
                  type="text"
                  name="weight"
                  value={editedProduct.weight}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block font-bold mb-2 font-montserrat">
                  Location (in Km):
                </label>
                <input
                  type="text"
                  name="location"
                  value={editedProduct.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <button
                type="submit"
                onClick={handleSubmit}
                className="px-2 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-md"
              >
                Save
              </button>
              <button
                className="px-2 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-md  mx-10"
                onClick={(e) => onDeleteProduct(e, currentUser?.uid, editedProduct.productId)}
              >
                Delete
              </button>
            </div>
          </div>
          <ToastContainer />
        </DashBoardSidebar>
      </div>
    </div>
  );
};

export async function getServerSideProps({ params }) {
  const productId = params.id;

  try {
    const product = {
      productId: productId,
      name: "Loading...",
      image: "/api/placeholder/150/150",
      category: "",
      description: "",
      price: 0,
      quantity: 0,
      weight: "",
      location: ""
    };

    return {
      props: {
        product: product,
      },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
}

export default EditProductPage;