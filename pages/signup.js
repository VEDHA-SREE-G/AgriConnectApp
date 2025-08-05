import React, { useState, useEffect } from "react";
import styles from "../styles/signup.module.css";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MapComponent from "../components/Map/MapComponent";

import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase"; 

function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");
  const [phonenumber, setPhonenumber] = useState("");
  const [street, setStreet] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [postalcode, setPostalcode] = useState("");
  const [addressline1, setAddressline1] = useState("");
  const [addressline2, setAddressline2] = useState("");
  const [role, setRole] = useState("consumer"); // New role state
  const [createdUser, setCreatedUser] = useState(null);
  const [getLocation, setGetLocation] = useState(null);

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
        layout: window.google.translate.TranslateElement.InlineLayout.HORIZONTAL,
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

  useEffect(() => {
    if (createdUser !== null) {
      localStorage.setItem("currentUser", JSON.stringify(createdUser));
      router.push("/signin");
    }
    const user = localStorage.getItem("user");
    if (user) {
      router.push("/");
    }
  }, [createdUser, router]);

  const createUser = async () => {
    try {
      if (
        email === "" ||
        username === "" ||
        password === "" ||
        confirmedPassword === "" ||
        phonenumber === "" ||
        street === "" ||
        area === "" ||
        city === "" ||
        country === "" ||
        state === "" ||
        postalcode === "" ||
        addressline1 === "" ||
        addressline2 === ""
      ) {
        toast.error("Please fill in all fields", {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
        });
        return;
      }

      if (password !== confirmedPassword) {
        toast.error("Passwords do not match", {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
        });
        return;
      }

      if (password.length < 6) {
        toast.error("Password must be at least 6 characters long", {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
        });
        return;
      }

      // Create user with Firebase Auth instead of axios
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store comprehensive user data in Firestore instead of your API
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: email,
        username: username,
        role: role, // Add role to database
        phonenumber: phonenumber,
        addressline1: addressline1,
        addressline2: addressline2,
        area: area,
        city: city,
        country: country,
        pincode: parseInt(postalcode),
        state: state,
        street: street,
        createdAt: new Date()
      });

      console.log("User created successfully:", user);
      setCreatedUser(user);

      toast.success("Signup successful! Redirecting to login...", {
        position: "bottom-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
      });

    } catch (err) {
      console.log(err);
      toast.error(err.message, {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
      });
    }
  };

  return (
    <div className={styles.vvs}>
      {/* Google Translate Element - Inline and Scroll-aware */}
      <div id="google_translate_element" style={{
        position: 'absolute',
        top: '15px',
        right: '15px',
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '3px 5px',
        borderRadius: '4px',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
        fontSize: '10px',
        lineHeight: '1'
      }}></div>

     <style jsx>{`
        #google_translate_element {
          white-space: nowrap !important;
        }
        
        .goog-te-gadget {
          font-size: 0 !important;
          color: transparent !important;
          line-height: 1 !important;
          white-space: nowrap !important;
          display: inline-block !important;
        }
        
        .goog-te-gadget * {
          display: inline-block !important;
          vertical-align: middle !important;
          font-size: 10px !important;
        }
        
        .goog-te-gadget-simple {
          display: inline-block !important;
          vertical-align: middle !important;
        }
        
        .goog-te-gadget .goog-te-gadget-simple .goog-te-menu-value {
          display: inline-block !important;
          vertical-align: middle !important;
        }
        
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
        
        .goog-te-combo {
          background: #00b09b !important;
          color: white !important;
          border: none !important;
          padding: 3px 6px !important;
          border-radius: 3px !important;
          font-size: 10px !important;
          cursor: pointer !important;
          outline: none !important;
          min-width: 60px !important;
          max-width: 70px !important;
          white-space: nowrap !important;
          display: inline-block !important;
        }
        
        .goog-te-combo:hover {
          background: #028c7c !important;
        }
        
        .goog-te-banner-frame,
        .goog-te-banner-frame.skiptranslate {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          overflow: hidden !important;
        }
        
        .goog-te-gadget > span > a {
          display: none !important;
        }
        
        .goog-te-gadget .goog-te-combo {
          margin: 0 !important;
        }
        
        /* Mobile responsiveness for translator */
        @media (max-width: 768px) {
          #google_translate_element {
            top: 10px !important;
            right: 10px !important;
            padding: 2px 4px !important;
          }
          .goog-te-combo {
            font-size: 9px !important;
            padding: 2px 4px !important;
            min-width: 50px !important;
            max-width: 60px !important;
          }
        }
      `}</style>

      <Link href="/" passHref>
        <Image
          src="/Images/Logo/Agriconnect_logo.png"
          className="cursor-pointer "
          alt="logo"
          width={220}
          height={120}
        />
      </Link>
      <h3 className={styles.nvs}>Sign up</h3>

      <div className={styles.grids}>
        <div className="w-full sm_max:max-w-xs lg_max:max-w-md xl:p-10 md:p-10">
          <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="username"
              >
                Username
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="username"
                type="text"
                placeholder="Username"
                onChange={(e) => setUsername(e.target.value)}
              />
              <label
                className="block text-gray-700 text-sm font-bold my-2"
                htmlFor="email"
              >
                Email
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="email"
                type="email"
                placeholder="Email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="password"
              >
                Password
              </label>
              <input
                className="shadow appearance-none border border-black-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                id="password"
                type="password"
                placeholder="******************"
                onChange={(e) => setPassword(e.target.value)}
              />
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="confirmPassword"
              >
                Confirm Password
              </label>
              <input
                className="shadow appearance-none border border-black-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                id="confirmPassword"
                type="password"
                placeholder="******************"
                onChange={(e) => setConfirmedPassword(e.target.value)}
              />
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="phonenumber"
              >
                Phone Number
              </label>
              <input
                className="shadow appearance-none border border-black-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                id="phonenumber"
                type="text"
                placeholder="+91 - xxxxxxxxxx"
                onChange={(e) => setPhonenumber(e.target.value)}
              />

              {/* Role Selection - New Addition */}
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Select Role
              </label>
              <div className="flex items-center mb-4">
                <input
                  className="mr-2"
                  id="consumer"
                  type="radio"
                  value="consumer"
                  checked={role === "consumer"}
                  onChange={(e) => setRole(e.target.value)}
                />
                <label className="text-gray-700 text-sm mr-6" htmlFor="consumer">
                  Consumer
                </label>
                <input
                  className="mr-2"
                  id="farmer"
                  type="radio"
                  value="farmer"
                  checked={role === "farmer"}
                  onChange={(e) => setRole(e.target.value)}
                />
                <label className="text-gray-700 text-sm" htmlFor="farmer">
                  Farmer
                </label>
              </div>

              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="addressLine1"
              >
                Address Line 1
              </label>
              <input
                className="shadow appearance-none border border-black-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                id="addressLine1"
                type="text"
                placeholder="Address line-1"
                onChange={(e) => setAddressline1(e.target.value)}
              />
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="addressLine2"
              >
                Address Line 2
              </label>
              <input
                className="shadow appearance-none border border-black-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                id="addressLine2"
                type="text"
                placeholder="Address line-2"
                onChange={(e) => setAddressline2(e.target.value)}
              />
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="area"
              >
                Area
              </label>
              <input
                className="shadow appearance-none border border-black-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                id="area"
                type="text"
                placeholder="Area"
                onChange={(e) => setArea(e.target.value)}
              />
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="street"
              >
                Street
              </label>
              <input
                className="shadow appearance-none border border-black-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                id="street"
                type="text"
                placeholder="street"
                onChange={(e) => setStreet(e.target.value)}
              />
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="city"
              >
                City
              </label>
              <input
                className="shadow appearance-none border border-black-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                id="city"
                type="text"
                placeholder="City"
                onChange={(e) => setCity(e.target.value)}
              />
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="state"
              >
                State
              </label>
              <input
                className="shadow appearance-none border border-black-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                id="state"
                type="text"
                placeholder="State"
                onChange={(e) => setState(e.target.value)}
              />
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="postalcode"
              >
                Postal Code
              </label>
              <input
                className="shadow appearance-none border border-black-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                id="postalcode"
                type="text"
                placeholder="postal code"
                onChange={(e) => setPostalcode(e.target.value)}
              />
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="country"
              >
                Country
              </label>
              <input
                className="shadow appearance-none border border-black-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                id="country"
                type="text"
                placeholder="Country"
                onChange={(e) => setCountry(e.target.value)}
              />
              {/* <div className="w-full h-[500px] ">
                <p>map</p>
                <MapComponent latitude={20.5937} longitude={78.9629} />
              </div> */}
            </div>
            <div className="flex items-center justify-between">
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="button"
                onClick={() => createUser()}
              >
                Sign Up
              </button>
              <ToastContainer />
            </div>
            <div className="flex flex-wrap mt-10">
              <p className="text-gray-700 text-sm font-bold">
                Already have an account?
              </p>
              <p className="ml-5 text-blue-500 hover:underline">
                <Link href="/signin">sign-in</Link>
              </p>
            </div>
          </form>
        </div>
        <Image
          src="/Images/undraw_handcrafts_tree.svg"
          width="400px"
          height="400px"
          alt="leaf-img"
        />
      </div>
    </div>
  );
}

export default Signup;