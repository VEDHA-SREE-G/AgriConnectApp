import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeApp, getApps, getApp } from "firebase/app";

function AddProductAdmin() {
  const [productName, setProductName] = useState("");
  const [productType, setProductType] = useState("");
  const [productRate, setProductRate] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productQuantity, setProductQuantity] = useState("");
  const [productLocation, setProductLocation] = useState("");
  const [productPicture, setProductPicture] = useState("");
  const [productWeight, setProductWeight] = useState("");
  const [fileInputState, setFileInputState] = useState("");
  const [previewSource, setPreviewSource] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [file, setFile] = useState(null);

  const admin = useSelector((state) => state.admin)?.admin;
  const router = useRouter();

  // Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyB0mvAaGlZl9_-TPHLe_Cgkofhlvj64rdc",
    authDomain: "agriconnect-3c327.firebaseapp.com",
    projectId: "agriconnect-3c327",
    storageBucket: "agriconnect-3c327.appspot.com",
    messagingSenderId: "522663366346",
    appId: "1:522663366346:web:812340ea9450a74150ae33",
    measurementId: "G-DB1CY1X8JP"
  };

  // Initialize Firebase - better way
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  // Google Translate initialization
  useEffect(() => {
    // Load Google Translate script
    const script = document.createElement('script');
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);

    // Initialize Google Translate
    window.googleTranslateElementInit = function() {
      new window.google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'en,ta,hi,te,kn,ml,bn,gu,mr,or,ur',
        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false,
        multilanguagePage: true
      }, 'google_translate_element');
      
      // Clean up Google Translate UI
      setTimeout(cleanupTranslation, 500);
      setTimeout(cleanupTranslation, 1500);
    };

    // Cleanup function
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const cleanupTranslation = () => {
    const banner = document.querySelector('.goog-te-banner-frame');
    if (banner) {
      banner.style.display = 'none';
      banner.style.visibility = 'hidden';
      banner.style.height = '0';
    }
    document.body.style.top = '0px';
    document.body.style.position = 'relative';
  };

  const onAddProduct = async (e) => {
    e.preventDefault();
    
    // Check if user is a farmer (changed from "ADMIN" to "farmer" to match your Firebase structure)
    if (admin?.role !== "farmer") {
      toast.error("You're not authorized to add products", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
      });
      return;
    }

    if (
      !productName ||
      !productType ||
      !productRate ||
      !productDescription ||
      !productQuantity ||
      !productLocation ||
      !productPicture ||
      !productWeight
    ) {
      toast.error("Please fill in all fields", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
      });
      return;
    }

    try {
      // Generate unique product ID
      const productId = Date.now().toString();
      
      // Create product document in Firestore
      await setDoc(doc(db, "products", productId), {
        productId: productId,
        productName: productName,
        productType: productType,
        productRate: parseInt(productRate),
        image: productPicture,
        productDescription: productDescription,
        productStock: parseInt(productQuantity),
        location: productLocation,
        productWeight: productWeight,
        adminId: admin.id,
        farmerId: admin.id,
        farmerName: admin.user_name || admin.username,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      toast.success("Product Added successfully!", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
      });

      // Reset form
      setProductDescription("");
      setProductLocation("");
      setProductName("");
      setProductPicture("");
      setProductQuantity("");
      setProductRate("");
      setProductType("");
      setProductWeight("");
      setPreviewSource("");
      setFileInputState("");
      setFile(null);

      router.push("/dashboard/admin/products");
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product. Please try again.", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
      });
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    setFile(file);
    previewFile(file);
    setFileInputState(e.target.value);
  };

  const previewFile = (file) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setPreviewSource(reader.result);
    };
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.warning("Upload an image", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
      });
      return;
    }

    // Convert file to base64 (same as your HTML code)
    const reader = new FileReader();
    reader.onload = function () {
      const base64Image = reader.result; // Data URL
      setProductPicture(base64Image);
      toast.success("Image uploaded successfully!", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      {/* Google Translate Element */}
      <div id="google_translate_element" style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '8px 12px',
        borderRadius: '8px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
      }}></div>

      <style jsx>{`
        /* Hide the "Powered by Google Translate" text */
        .goog-te-gadget > span > a {
          display: none !important;
        }
        
        .goog-te-gadget .goog-logo-link {
          display: none !important;
        }
        
        .goog-te-gadget span:first-child {
          display: none !important;
        }

        .goog-te-gadget * {
          display: inline-block !important;
          vertical-align: middle !important;
          font-size: 10px !important;
        }

        .goog-te-combo {
          background: #00b09b !important;
          color: white !important;
          border: none !important;
          padding: 6px 10px !important;
          border-radius: 6px !important;
          font-size: 13px !important;
          cursor: pointer !important;
          outline: none !important;
          min-width: 120px !important;
        }

        .goog-te-combo:hover {
          background: #028c7c !important;
        }

        .goog-te-banner-frame.skiptranslate {
          display: none !important;
        }
        
        .goog-te-banner-frame {
          display: none !important;
        }

        /* Mobile responsiveness */
        @media (max-width: 600px) {
          #google_translate_element {
            top: 10px !important;
            right: 10px !important;
            padding: 6px 8px !important;
          }

          .goog-te-combo {
            min-width: 100px !important;
            font-size: 12px !important;
          }
        }
      `}</style>

      <div className="w-full h-full">
        <div className="relative w-full h-96 flex items-center flex-col space-y-32">
          <h1 className="text-3xl mt-10">Enter Product Details to Add</h1>
          <div>
            <form onSubmit={handleFormSubmit}>
              <input
                type="file"
                name="image"
                onChange={(e) => {
                  handleFileInputChange(e);
                }}
                value={fileInputState}
              />
              {previewSource && (
                <img
                  src={previewSource}
                  alt="Preview"
                  style={{ height: "300px" }}
                />
              )}
              <button type="submit">Upload</button>
            </form>
            {uploadedFile && (
              <div>
                <h2>Uploaded File:</h2>
                <img src={productPicture} alt="uploaded-image" style={{ height: "300px" }} />
              </div>
            )}
            {uploadError && <div>{uploadError}</div>}
          </div>

          <form className="w-full max-w-lg" onSubmit={onAddProduct}>
            <div className="flex flex-wrap -mx-3 mb-6">
              <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
                <label
                  className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                  htmlFor="grid-first-name"
                >
                  Product Name
                </label>
                <input
                  className="appearance-none block w-full bg-gray-200 text-gray-700 border rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
                  id="grid-first-name"
                  type="text"
                  placeholder="Eg. Gold Rice"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </div>
              <div className="w-full md:w-1/2 px-3">
                <label
                  className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                  htmlFor="grid-last-name"
                >
                  Product Type
                </label>
                <input
                  className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                  id="grid-last-name"
                  type="text"
                  placeholder="Eg. Grains"
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap -mx-3 mb-6">
              <div className="w-full px-3">
                <label
                  className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                  htmlFor="grid-rate"
                >
                  Product Rate (per given measuring weight)
                </label>
                <input
                  className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                  id="grid-rate"
                  type="number"
                  placeholder="₹-"
                  value={productRate}
                  onChange={(e) => setProductRate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap -mx-3 mb-2">
              <div className="w-full px-3">
                <label
                  className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                  htmlFor="grid-description"
                >
                  Product Description
                </label>
                <textarea
                  className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                  id="grid-description"
                  placeholder="Enter the description here..."
                  maxLength={120}
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                />
              </div>
              <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
                <label
                  className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                  htmlFor="grid-Quantity"
                >
                  Product Quantity (stock - based on the measure given)
                </label>
                <input
                  className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                  id="grid-Quantity"
                  placeholder="Enter the stock..."
                  value={productQuantity}
                  onChange={(e) => setProductQuantity(e.target.value)}
                />
              </div>
              <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
                <label
                  className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                  htmlFor="grid-location"
                >
                  Product Location (in km)
                </label>
                <input
                  className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                  id="grid-location"
                  placeholder="Eg. 5km"
                  value={productLocation}
                  onChange={(e) => setProductLocation(e.target.value)}
                />
                <label
                  className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                  htmlFor="grid-type-weight"
                >
                  Measuring Weight
                </label>
                <input
                  className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                  id="grid-type-weight"
                  type="text"
                  placeholder="Eg. /kg (/ is required)"
                  value={productWeight}
                  onChange={(e) => setProductWeight(e.target.value)}
                />
              </div>
            </div>
            <button
              className="bg-[#20E58F] p-3 w-24 font-semibold rounded-md mb-5"
              type="submit"
            >
              Add
            </button>
          </form>
          <ToastContainer />
        </div>
      </div>
    </>
  );
}

export default AddProductAdmin;