import React, { useEffect, useState } from "react";
import AdminProductCard from "../AdminProductCard/AdminProductCard";
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, getDocs, setDoc, getDoc, deleteDoc, doc } from 'firebase/firestore';
import Link from "next/link";
import { db } from "../../firebase";
// const firebaseConfig = {
//   apiKey: "AIzaSyB0mvAaGlZl9_-TPHLe_Cgkofhlvj64rdc",
//   authDomain: "agriconnect-3c327.firebaseapp.com",
//   projectId: "agriconnect-3c327",
//   storageBucket: "agriconnect-3c327.appspot.com",
//   messagingSenderId: "522663366346",
//   appId: "1:522663366346:web:812340ea9450a74150ae33",
//   measurementId: "G-DB1CY1X8JP"
// };

// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
// const db = getFirestore(app);

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

function AdminProductComponent() {
  const [currentUser, setCurrentUser] = useState(null);
  const [farmerName, setFarmerName] = useState("");
  const [ownerProducts, setOwnerProducts] = useState([]);

  const getProducts = async () => {
    if (!currentUser) {
      console.log("No current user found");
      return;
    }
    
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const filteredData = [];
      
      querySnapshot.forEach((docSnap) => {
        const product = docSnap.data();
        if (product.farmerId === currentUser.uid) {
          // Map Firebase data to match your existing structure
          filteredData.push({
            id: product.productId,
            name: product.productName,
            image: product.image,
            productOwnerName: product.farmerName
          });
        }
      });
      
      setOwnerProducts(filteredData);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.log("No user found, should redirect to login");
        return;
      }
      
      setCurrentUser(user);
      
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFarmerName(docSnap.data().name);
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      getProducts();
    }
  }, [currentUser]);

  return (
    <div>
      <GoogleTranslate />
      <div>
        <div className="w-full h-full flex ">
          <div className="w-full relative max-w-7xl h-96 items-center  ">
            <div className="w-full h-full flex justify-evenly space-y-4 flex-wrap ">
              {ownerProducts.length > 0 ? (
                ownerProducts?.map((product, index) => (
                  <Link
                    key={index}
                    href={`/dashboard/admin/product/${product.id}`}
                    passHref
                  >
                    <a>
                      <AdminProductCard
                        key={index}
                        productName={product.name}
                        productImg={product.image}
                      />
                    </a>
                  </Link>
                ))
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center mt-8">
                  <p className="text-gray-500 text-lg">No products found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminProductComponent;