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

  // ✅ Google Translate initialization with proper functionality
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);

    window.googleTranslateElementInit = function () {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,ta,hi,te,kn,ml,bn,gu,mr,or,ur",
          layout: window.google.translate.TranslateElement.InlineLayout.HORIZONTAL,
          autoDisplay: false,
          multilanguagePage: true,
        },
        "google_translate_element"
      );

      // Hide banner
      setTimeout(hideBanner, 500);
      setTimeout(hideBanner, 1500);
      
      // Add click functionality to custom button (desktop)
      setTimeout(() => {
        const customBtn = document.querySelector('.custom-translate-btn');
        const googleSelect = document.querySelector('.goog-te-combo');
        const translateContainer = document.querySelector('.translate-micro');
        
        if (customBtn && googleSelect && translateContainer) {
          let isOpen = false;
          
          customBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (!isOpen) {
              translateContainer.classList.add('open');
              googleSelect.style.display = 'block';
              googleSelect.focus();
              googleSelect.click();
              isOpen = true;
            }
          });
          
          // Close dropdown when clicking outside
          document.addEventListener('click', (e) => {
            if (!translateContainer.contains(e.target)) {
              translateContainer.classList.remove('open');
              isOpen = false;
            }
          });
          
          // Handle dropdown change
          googleSelect.addEventListener('change', () => {
            translateContainer.classList.remove('open');
            isOpen = false;
          });
        }

        // Add click functionality for mobile translate button
        const mobileTranslateBtn = document.querySelector('.mobile-translate-btn');
        if (mobileTranslateBtn) {
          let customDropdown = null;
          
          mobileTranslateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Find the Google translate combo box
            const googleSelect = document.querySelector('.goog-te-combo');
            console.log('Google Select found:', googleSelect);
            
            if (googleSelect) {
              // Remove existing custom dropdown if any
              if (customDropdown) {
                customDropdown.remove();
                customDropdown = null;
                return;
              }
              
              // Get button position
              const rect = mobileTranslateBtn.getBoundingClientRect();
              
              // Create custom styled dropdown
              customDropdown = document.createElement('div');
              customDropdown.className = 'custom-mobile-dropdown';
              customDropdown.style.cssText = `
                position: fixed;
                top: ${rect.bottom + 8}px;
                right: ${window.innerWidth - rect.right}px;
                z-index: 9999;
                background: white;
                border: 2px solid #667eea;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                padding: 8px 0;
                min-width: 160px;
                max-height: 250px;
                overflow-y: auto;
                animation: fadeInScale 0.2s ease-out;
              `;
              
              // Get all language options
              const options = googleSelect.querySelectorAll('option');
              options.forEach((option, index) => {
                if (index === 0) return; // Skip "Select Language"
                
                const optionDiv = document.createElement('div');
                optionDiv.textContent = option.textContent;
                optionDiv.style.cssText = `
                  padding: 12px 16px;
                  cursor: pointer;
                  font-size: 15px;
                  color: #333;
                  border-bottom: 1px solid #f0f0f0;
                  transition: all 0.2s ease;
                `;
                
                // Hover effect
                optionDiv.addEventListener('mouseenter', () => {
                  optionDiv.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
                  optionDiv.style.color = 'white';
                  optionDiv.style.transform = 'translateX(4px)';
                });
                
                optionDiv.addEventListener('mouseleave', () => {
                  optionDiv.style.background = 'white';
                  optionDiv.style.color = '#333';
                  optionDiv.style.transform = 'translateX(0)';
                });
                
                // Click handler
                optionDiv.addEventListener('click', () => {
                  console.log('Language selected:', option.value);
                  googleSelect.value = option.value;
                  
                  // Trigger change event on Google Select
                  const changeEvent = new Event('change', { bubbles: true });
                  googleSelect.dispatchEvent(changeEvent);
                  
                  // Remove custom dropdown
                  customDropdown.remove();
                  customDropdown = null;
                });
                
                customDropdown.appendChild(optionDiv);
              });
              
              // Add to page
              document.body.appendChild(customDropdown);
              
              // Hide on click outside
              const handleClickOutside = (event) => {
                if (!customDropdown.contains(event.target) && !mobileTranslateBtn.contains(event.target)) {
                  if (customDropdown) {
                    customDropdown.remove();
                    customDropdown = null;
                  }
                  document.removeEventListener('click', handleClickOutside);
                }
              };
              
              setTimeout(() => {
                document.addEventListener('click', handleClickOutside);
              }, 100);
              
            } else {
              console.log('Google Translate not ready yet, retrying...');
              setTimeout(() => {
                mobileTranslateBtn.click();
              }, 500);
            }
          });
        }
      }, 1000);
    };

    const hideBanner = () => {
      const banner = document.querySelector(".goog-te-banner-frame");
      if (banner) banner.style.display = "none";
      document.body.style.top = "0px";
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

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
      {/* ✅ Google Translate Elements */}
      <div className="translate-micro" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'none' }}>
        <div
          id="google_translate_element"
          className="translate-icon"
        ></div>
        <div className="custom-translate-btn" title="Translate">
          🌐
        </div>
      </div>

      {/* ✅ Mobile Translate Button - Positioned in top right corner */}
      <div className="mobile-translate-btn" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }} title="Translate">
        🌐
      </div>

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
          width={400}
          height={400}
          alt="leaf-img"
        />
      </div>

      {/* ✅ Translate Button Styles */}
      <style jsx global>{`
        .translate-micro {
          position: relative;
          margin: 0 8px;
          display: inline-block;
          width: 20px;
          height: 20px;
        }
        
        /* Hide Google branding but keep dropdown functional */
        .goog-te-gadget > span > a,
        .goog-te-gadget .goog-logo-link,
        .goog-te-gadget span:first-child,
        .goog-te-banner-frame,
        .goog-te-banner-frame.skiptranslate {
          display: none !important;
        }
        
        .goog-te-gadget {
          font-size: 0 !important;
          line-height: 0 !important;
        }
        
        /* Style the actual Google dropdown */
        .goog-te-combo {
          position: absolute !important;
          opacity: 0 !important;
          pointer-events: none !important;
          width: 20px !important;
          height: 20px !important;
          top: 0 !important;
          left: 0 !important;
          z-index: 1 !important;
        }
        
        /* Custom translate button overlay */
        .custom-translate-btn {
          display: flex !important;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s ease;
          position: absolute;
          top: 0;
          left: 0;
          z-index: 5;
          pointer-events: auto;
        }
        
        .custom-translate-btn:active {
          transform: scale(0.95);
        }
        
        /* When dropdown is opened, show it */
        .translate-micro.open .goog-te-combo {
          opacity: 1 !important;
          pointer-events: auto !important;
          position: absolute !important;
          top: 25px !important;
          left: -20px !important;
          width: auto !important;
          height: auto !important;
          background: white !important;
          border: 1px solid #ccc !important;
          border-radius: 4px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
          z-index: 1000 !important;
        }
        
        .translate-micro.open .goog-te-combo option {
          padding: 4px 8px !important;
          font-size: 12px !important;
          color: #333 !important;
        }

        /* Mobile translate button - Styled similar to navbar version */
        .mobile-translate-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          font-size: 20px;
          cursor: pointer;
          border-radius: 10px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          position: relative;
        }

        .mobile-translate-btn:active {
          transform: scale(0.95);
        }

        /* Custom dropdown animation */
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.9) translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        /* Custom scrollbar for mobile dropdown */
        .custom-mobile-dropdown::-webkit-scrollbar {
          width: 6px;
        }

        .custom-mobile-dropdown::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }

        .custom-mobile-dropdown::-webkit-scrollbar-thumb {
          background: #667eea;
          border-radius: 3px;
        }

        .custom-mobile-dropdown::-webkit-scrollbar-thumb:hover {
          background: #5a67d8;
        }

        /* Custom scrollbar for mobile dropdown */
        .goog-te-combo::-webkit-scrollbar {
          width: 8px;
        }

        .goog-te-combo::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
        }

        .goog-te-combo::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 6px;
        }

        .goog-te-combo::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
}

export default Signup;