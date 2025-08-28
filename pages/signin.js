import React, { useState, useEffect, useContext } from "react";
import Image from "next/image";
import ConnectTogether from "../components/ConnectTogether/ConnectTogether";
import styles from "../styles/signin.module.css";
import Link from "next/link";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../redux/userSlice";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth, db } from "../firebase"; 
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";


function Signin() {
  const [emailUser, setEmailUser] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const router = useRouter();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user);
  const cartItems = useSelector((state) => state.cart);

  

  

  useEffect(() => {
    const currUser = localStorage.getItem("currentUser");
    if (currUser) {
      setUser(JSON.parse(currUser));
    }
    const customer = localStorage.getItem("user");
    if (!customer) return;
    router.push("/");
  }, [router]);

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
                border: 2px solid #004e16;
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
                  optionDiv.style.background = 'linear-gradient(135deg, #46b57f, #46b5a7)';
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

  const signIn = async () => {
    try {
      if (emailUser === "" || password === "") {
        toast.error("Please fill in all fields", {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
        });
        return;
      }

      // Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, emailUser, password);
      const firebaseUser = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      const userData = userDoc.data();

      if (!userData) {
        toast.error("User data not found", {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
        });
        return;
      }

      // Structure user data for local storage and Redux
      const userForStorage = {
        email: userData.email,
        user_name: userData.username,
        id: firebaseUser.uid,
        mobile: userData.phonenumber,
        role: userData.role
      };

      try {
        localStorage.removeItem("currentUser");
        localStorage.setItem("user", JSON.stringify(userForStorage));
        setUser(userForStorage);
        dispatch(login(userForStorage));
        
        toast.success("Login successful!", {
          position: "bottom-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
        });

        if (cartItems.length > 0) {
          router.push("/cart");
        } else {
          router.push("/");
        }
      } catch (err) {
        console.log(err);
      }
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
    <>
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
        <div>
          <Image
            src="/Images/Logo/Agriconnect_logo.png"
            className="cursor-pointer "
            alt="logo"
            width={220}
            height={120}
          />
        </div>
      </Link>
      <div className={styles.whole}>
        <ConnectTogether />

        <div className={styles.searchbox}>
          <h1>
            Discover our <b>Products</b>
          </h1>
        </div>

        <div className={styles.place}>
          <div className={styles.login}>
            <h2 className={styles.jh}>LOGIN</h2>
            <input
              className={styles.km}
              type="text"
              placeholder="E-Mail"
              onChange={(e) => {
                setEmailUser(e.target.value);
              }}
            />
            <input
              className={styles.ks}
              type="password"
              placeholder="Password"
              onChange={(e) => {
                setPassword(e.target.value);
              }}
            />
            <button className={styles.btn} onClick={() => signIn()}>
              Sign in
            </button>
            <ToastContainer />
          </div>
          <div className={styles.signup}>
            <div className={styles.wrap}>
              <h2>
                <b>NEW HERE ?</b>
              </h2>
              <h4>sign up and discover our Products</h4>
              <button className={styles.btn1}>
                <Link href="/signup">Sign up</Link>{" "}
              </button>
            </div>
          </div>
        </div>
        <Image
          src="/Images/Split Leaf.png"
          width="100px"
          height="100px"
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
          background: #f4f8f6;
          border: 2px solid #004e16;
          color: #004e16;
          box-shadow: 0 4px 15px rgba(70, 181, 127, 0.4);
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
          background: #46b57f;
          border-radius: 3px;
        }

        .custom-mobile-dropdown::-webkit-scrollbar-thumb:hover {
         background: #004e16;
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
    </>
  );
}

export default Signin;