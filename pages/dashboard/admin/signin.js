import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "../../../styles/signinDashboard.module.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ConnectTogether from "../../../components/ConnectTogether/ConnectTogether";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { login } from "../../../redux/adminSlice";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, query, where, collection, getDocs } from "firebase/firestore";
import { auth, db } from "../../../firebase";

function Signin() {
  const [emailAdmin, setEmailAdmin] = useState("");
  const [password, setPassword] = useState("");
  const [admin, setAdmin] = useState(null);
  
  // OTP related states
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(""); // This will be fetched from Firebase
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [userDataFetched, setUserDataFetched] = useState(null); // Store fetched user data
  
  const router = useRouter();
  const dispatch = useDispatch();

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

  // OTP Timer Effect
  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(timer => timer - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Generate 6-digit OTP
  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Fetch user data from Firebase by email
  const fetchUserDataByEmail = async (email) => {
    try {
      console.log("Fetching user data for email:", email);
      
      // Query users collection by email
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error("No user found with this email");
      }
      
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      console.log("User data fetched:", {
        email: userData.email,
        phonenumber: userData.phonenumber,
        username: userData.username,
        role: userData.role
      });
      
      return { id: userDoc.id, ...userData };
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  };

  // Send OTP via SMS
  const sendOtp = async (phoneNumber) => {
    try {
      setIsOtpSending(true);
      const newOtp = generateOtp();
      setGeneratedOtp(newOtp);

      console.log("Sending OTP to:", phoneNumber);

      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phoneNumber,
          message: `Your AgriConnect verification code is: ${newOtp}. This code will expire in 5 minutes. Please do not share this code with anyone.`
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOtpSent(true);
        setOtpTimer(300); // 5 minutes timer
        toast.success("OTP sent successfully to your registered phone number!", {
          position: "bottom-right",
          autoClose: 3000,
        });
      } else {
        throw new Error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error(error.message || "Failed to send OTP. Please try again.", {
        position: "bottom-right",
        autoClose: 5000,
      });
    } finally {
      setIsOtpSending(false);
    }
  };

  // Verify OTP
  const verifyOtp = () => {
    if (otp === generatedOtp) {
      setShowOtpInput(false);
      toast.success("Phone number verified successfully!", {
        position: "bottom-right",
        autoClose: 3000,
      });
      // Continue with login process
      proceedWithLogin();
    } else {
      toast.error("Invalid OTP. Please try again.", {
        position: "bottom-right",
        autoClose: 3000,
      });
    }
  };

  // Resend OTP
  const resendOtp = async () => {
    if (otpTimer > 0) {
      toast.warning("Please wait before requesting a new OTP", {
        position: "bottom-right",
        autoClose: 3000,
      });
      return;
    }
    
    await sendOtp(phoneNumber);
    setOtp(""); // Clear previous OTP input
  };

  // Proceed with login after OTP verification
  const proceedWithLogin = async () => {
    try {
      // Check for special admin credentials - redirect to external admin dashboard
      if (emailAdmin === "admin@gmail.com" && password === "agriConnect2025") {
        toast.success("Admin login successful! Redirecting to admin dashboard...", {
          position: "bottom-right",
          autoClose: 2000,
        });

        setTimeout(() => {
          window.location.href = "https://agriconnect-admin.netlify.app/";
        }, 2000);
        
        return;
      }

      // Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, emailAdmin, password);
      const firebaseUser = userCredential.user;

      // Use the already fetched user data or fetch it again
      let userData = userDataFetched;
      if (!userData) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        userData = userDoc.data();
      }

      if (!userData) {
        toast.error("User data not found", {
          position: "bottom-right",
          autoClose: 3000,
        });
        return;
      }

      // Check if user is a farmer (only farmers can access admin dashboard)
      if (userData.role !== "farmer") {
        toast.error("Access denied. Only farmers can access this dashboard.", {
          position: "bottom-right",
          autoClose: 3000,
        });
        return;
      }

      // Structure user data for admin dashboard
      const adminData = {
        email: userData.email,
        user_name: userData.username,
        id: firebaseUser.uid,
        mobile: userData.phonenumber,
        role: userData.role
      };

      localStorage.setItem("admin", JSON.stringify(adminData));
      setAdmin(adminData);
      dispatch(login(adminData));
      
      toast.success("Login successful! Redirecting to dashboard...", {
        position: "bottom-right",
        autoClose: 2000,
      });

      router.push(`/dashboard/admin/profile/${firebaseUser.uid}`);
    } catch (err) {
      console.log(err);
      toast.error(err.message, {
        position: "bottom-right",
        autoClose: 3000,
      });
    }
  };
  
  const onSignIn = async () => {
    try {
      if (emailAdmin === "" || password === "") {
        toast.error("Please fill in all fields", {
          position: "bottom-right",
          autoClose: 3000,
        });
        return;
      }

      // Show OTP verification for regular users (not for super admin)
      if (!(emailAdmin === "admin@gmail.com" && password === "agriConnect2025")) {
        try {
          // First, fetch user data to get phone number
          console.log("Fetching user data for OTP verification...");
          const userData = await fetchUserDataByEmail(emailAdmin);
          
          if (!userData.phonenumber) {
            toast.error("Phone number not found for this account. Please contact support.", {
              position: "bottom-right",
              autoClose: 5000,
            });
            return;
          }

          // Store user data and phone number
          setUserDataFetched(userData);
          setPhoneNumber(userData.phonenumber);

          // Validate Indian phone number
          const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
          if (!phoneRegex.test(userData.phonenumber.replace(/\s+/g, ''))) {
            toast.error("Invalid phone number format in your account. Please contact support.", {
              position: "bottom-right",
              autoClose: 5000,
            });
            return;
          }

          // Send OTP to the fetched phone number
          console.log("Sending OTP to registered number:", userData.phonenumber);
          await sendOtp(userData.phonenumber);
          setShowOtpInput(true);
          
          toast.info(`OTP sent to your registered phone number ending in ${userData.phonenumber.slice(-4)}`, {
            position: "bottom-right",
            autoClose: 4000,
          });

        } catch (fetchError) {
          console.error("Error fetching user data:", fetchError);
          toast.error("User not found. Please check your email address.", {
            position: "bottom-right",
            autoClose: 3000,
          });
          return;
        }
      } else {
        // Direct login for super admin
        await proceedWithLogin();
      }
    } catch (err) {
      console.log(err);
      toast.error(err.message, {
        position: "bottom-right",
        autoClose: 3000,
      });
    }
  };

  // Format timer display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
            <h2 className={styles.jh}>ADMIN LOGIN</h2>
            
            <input
              className={styles.km}
              type="text"
              placeholder="E-Mail"
              value={emailAdmin}
              onChange={(e) => setEmailAdmin(e.target.value)}
            />
            
            <input
              className={styles.ks}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* Show phone number info when fetched */}
            {phoneNumber && !showOtpInput && (
              <div style={{ 
                margin: '10px 0', 
                padding: '8px', 
                background: '#f8fffc', 
                border: '1px solid #46b57f', 
                borderRadius: '5px',
                fontSize: '14px',
                color: '#004e16'
              }}>
                📱 OTP will be sent to: ***{phoneNumber.slice(-4)}
              </div>
            )}

            {/* OTP Input Section */}
            {showOtpInput && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ 
                  margin: '10px 0', 
                  padding: '10px', 
                  background: '#f0f9ff', 
                  border: '2px solid #46b57f', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#004e16' }}>
                    📱 Verify Your Phone Number
                  </p>
                  <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                    OTP sent to: ***{phoneNumber.slice(-4)}
                  </p>
                </div>

                <input
                  className={styles.km}
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  maxLength="6"
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
                
                {otpTimer > 0 && (
                  <p style={{ color: '#46b57f', fontSize: '14px', margin: '5px 0', textAlign: 'center' }}>
                    ⏱️ OTP expires in: {formatTime(otpTimer)}
                  </p>
                )}
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button 
                    className={styles.btn} 
                    onClick={verifyOtp}
                    disabled={!otp || otp.length !== 6}
                    style={{ 
                      flex: 1,
                      opacity: (!otp || otp.length !== 6) ? 0.6 : 1 
                    }}
                  >
                    Verify OTP
                  </button>
                  
                  <button 
                    className={styles.btn1} 
                    onClick={resendOtp}
                    disabled={otpTimer > 0 || isOtpSending}
                    style={{ 
                      flex: 1,
                      opacity: (otpTimer > 0 || isOtpSending) ? 0.6 : 1 
                    }}
                  >
                    {isOtpSending ? 'Sending...' : 'Resend OTP'}
                  </button>
                </div>
              </div>
            )}

            {!showOtpInput && (
              <button 
                className={styles.btn} 
                onClick={onSignIn}
                disabled={isOtpSending}
              >
                {isOtpSending ? 'Sending OTP...' : 'Sign in'}
              </button>
            )}
            
            <ToastContainer />
          </div>
          
          <div className={styles.signup}>
            <div className={styles.wrap}>
              <h2>
                <b>NEW HERE ?</b>
              </h2>
              <h4>sign up and discover our Products</h4>
              <button className={styles.btn1}>
                <Link href="/signup">Sign up</Link>
              </button>
            </div>
          </div>
        </div>
        <Image
          src="/Images/Split Leaf.png"
          width="100"
          height="100"
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

        /* OTP Input Styles */
        .otp-container {
          margin-top: 15px;
          padding: 20px;
          border: 2px solid #46b57f;
          border-radius: 10px;
          background: #f8fffc;
        }

        .otp-timer {
          color: #46b57f;
          font-weight: bold;
          text-align: center;
          margin: 10px 0;
        }

        .otp-buttons {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }

        .otp-buttons button {
          flex: 1;
        }
      `}</style>
    </>
  );
}

export default Signin;