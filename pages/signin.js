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

// // Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyB0mvAaGlZl9_-TPHLe_Cgkofhlvj64rdc",
//   authDomain: "agriconnect-3c327.firebaseapp.com",
//   projectId: "agriconnect-3c327",
//   storageBucket: "agriconnect-3c327.firebasestorage.app",
//   messagingSenderId: "522663366346",
//   appId: "1:522663366346:web:812340ea9450a74150ae33",
//   measurementId: "G-DB1CY1X8JP"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
// const db = getFirestore(app);

function Signin() {
  const [emailUser, setEmailUser] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const router = useRouter();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user);
  const cartItems = useSelector((state) => state.cart);

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
    const currUser = localStorage.getItem("currentUser");
    if (currUser) {
      setUser(JSON.parse(currUser));
    }
    const customer = localStorage.getItem("user");
    if (!customer) return;
    router.push("/");
  }, [router]);

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
      {/* Google Translate Element - Positioned absolute */}
<div id="google_translate_element" style={{
  position: 'absolute',   // ⬅ change this
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
    </>
  );
}

export default Signin;