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
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../firebase";




function Signin() {
  const [emailAdmin, setEmailAdmin] = useState("");
  const [password, setPassword] = useState("");
  const [admin, setAdmin] = useState(null);
  const router = useRouter();
  const dispatch = useDispatch();

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

  const onSignIn = async () => {
    try {
      if (emailAdmin === "" || password === "") {
        toast.error("Please fill in all fields", {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
        });
        return;
      }

      // Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, emailAdmin, password);
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

      // Check if user is a farmer (only farmers can access admin dashboard)
      if (userData.role !== "farmer") {
        toast.error("Access denied. Only farmers can access this dashboard.", {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
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

      try {
        localStorage.setItem("admin", JSON.stringify(adminData));
        setAdmin(adminData);
        dispatch(login(adminData));
        
        toast.success("Login successful! Redirecting to dashboard...", {
          position: "bottom-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
        });

        // Redirect to farmer dashboard
        router.push(`/dashboard/admin/profile/${firebaseUser.uid}`);
      } catch (err) {
        console.log(err);
        toast.error("Error saving login data", {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
        });
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
              onChange={(e) => {
                setEmailAdmin(e.target.value);
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
            <button className={styles.btn} onClick={() => onSignIn()}>
              Sign in
            </button>
            <ToastContainer />
          </div>
          <div className={styles.signup}>
            <div className={styles.wrap}>
              Connecting End to End agriculture Solutions to help the world
              thrive
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
    </>
  );
}

export default Signin;