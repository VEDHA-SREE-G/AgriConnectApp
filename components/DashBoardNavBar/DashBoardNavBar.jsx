import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Styles from "../../styles/DashBoardNav.module.css";
import { useRouter } from "next/router";
import { logout } from "../../redux/adminSlice";
import { useDispatch, useSelector } from "react-redux";

function DashBoardNavBar() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [admin, setAdmin] = useState(null);

  const genericHamburgerLine = `h-1 w-6 my-1 rounded-full bg-black transition ease transform duration-300`;
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const currAdmin = localStorage.getItem("admin");
    if (currAdmin) {
      setAdmin(JSON.parse(currAdmin));
    }
  }, []);

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
        "google_translate_element_dashboard"
      );

      // Hide banner
      setTimeout(hideBanner, 500);
      setTimeout(hideBanner, 1500);
      
      // Add click functionality to custom button (desktop)
      setTimeout(() => {
        const customBtn = document.querySelector('.custom-translate-btn-dashboard');
        const googleSelect = document.querySelector('#google_translate_element_dashboard .goog-te-combo');
        const translateContainer = document.querySelector('.translate-micro-dashboard');
        
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

        // Add click functionality for mobile translate button in navbar
        const mobileNavTranslateBtn = document.querySelector('.mobile-nav-translate-btn-dashboard');
        if (mobileNavTranslateBtn) {
          let customDropdown = null;
          
          mobileNavTranslateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Find the Google translate combo box
            const googleSelect = document.querySelector('#google_translate_element_dashboard .goog-te-combo');
            console.log('Google Select found:', googleSelect);
            
            if (googleSelect) {
              // Remove existing custom dropdown if any
              if (customDropdown) {
                customDropdown.remove();
                customDropdown = null;
                return;
              }
              
              // Get button position
              const rect = mobileNavTranslateBtn.getBoundingClientRect();
              
              // Create custom styled dropdown
              customDropdown = document.createElement('div');
              customDropdown.className = 'custom-mobile-dropdown-dashboard';
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
                if (!customDropdown.contains(event.target) && !mobileNavTranslateBtn.contains(event.target)) {
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
                mobileNavTranslateBtn.click();
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

  const onSignOut = () => {
    dispatch(logout());
    setAdmin(null);
    router.push("/dashboard/admin/signin");
  };

  return (
    <>
      <nav className=" flex flex-row items-center flex-wrap p-3  ">
        <div className="flex-1">
          <div>
            <Image
              src="/Images/Logo/Agriconnect_logo.png"
              className="cursor-pointer"
              alt="logo"
              width={220}
              height={120}
            />
          </div>
        </div>

        <div className={`${Styles.navLinks} flex-1`}>
          <div
            className={`${Styles.navRes} flex items-center justify-between font-dnsansItal text-[20px] `}
          >
            {/* <div className={`${router.pathname === "/" ? "active" : ""} `}>
              <Link href="/dashboard/admin/profile/1">Home</Link>
            </div> */}

            {/* <div
              className={`${router.pathname === "/products" ? "active" : ""}`}
            >
              <Link href="/dashboard/admin/products">Products</Link>
            </div> */}
            {/* <div className={`${router.pathname === "/about" ? "active" : ""}`}>
              <Link href="/about">More </Link>
            </div> */}
          </div>
        </div>

        {/* ✅ Hidden Google Translate Element - Required for functionality but invisible */}
        <div className="translate-micro-dashboard" style={{ display: 'none' }}>
          <div
            id="google_translate_element_dashboard"
            className="translate-icon-dashboard"
          ></div>
          <div className="custom-translate-btn-dashboard" title="Translate">
            🌐
          </div>
        </div>

        <div className="flex-1 flex justify-end items-center">
          {admin ? (
            <div className={`${Styles.navLeft} flex justify-end relative`}>
              <Image
                src="/Images/Icons/arrowAdmin.png"
                width={30}
                height={30}
                alt="admin"
              />
              <p
                className={`${Styles.navUserbar} flex flex-wrap  font-dnsansItal text-[20px] ml-3 mr-10 md_max:flex-row sm_max:text-[19px]`}
              >
                {admin.user_name}
              </p>
              <Link href="/" passHref>
                <p
                  className="font-dnsansItal text-[20px] cursor-pointer md_max:hidden mr-4"
                  onClick={() => onSignOut()}
                >
                  Sign Out
                </p>
              </Link>
            </div>
          ) : (
            <div
              className={` flex items-center justify-end mr-5 md_max:hidden`}
            >
              <Image
                src="/images/Icons/Arrow_icon.png"
                alt="arrow-icon"
                width={30}
                height={30}
              />
              <Link href="/signin" passHref>
                <p className="ml-2 font-dnsansItal cursor-pointer text-[20px]">
                  Sign In
                </p>
              </Link>
            </div>
          )}
        </div>

        {/* ✅ Mobile Translate Icon - Only visible on mobile, positioned left of hamburger */}
        <div className="mobile-nav-translate-btn-dashboard md:hidden mr-3" title="Translate">
          🌐
        </div>

        <button
          className="flex flex-col h-12 w-12 border-2  rounded justify-center cursor-pointer items-center group md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div
            className={`${genericHamburgerLine} ${
              isOpen
                ? "rotate-45 translate-y-3 opacity-50 group-hover:opacity-100"
                : "opacity-50 group-hover:opacity-100"
            }`}
          />
          <div
            className={`${genericHamburgerLine} ${
              isOpen ? "opacity-0" : "opacity-50 group-hover:opacity-100"
            }`}
          />
          <div
            className={`${genericHamburgerLine} ${
              isOpen
                ? "-rotate-45 -translate-y-3 opacity-50 group-hover:opacity-100"
                : "opacity-50 group-hover:opacity-100"
            }`}
          />
        </button>
        {isOpen && <MobileNavLine />}
      </nav>

      {/* ✅ Translate Button Styles */}
      <style jsx global>{`
        .translate-micro-dashboard {
          position: relative;
          margin: 0 8px;
          display: inline-block;
          width: 20px;
          height: 20px;
        }
        
        /* Hide Google branding but keep dropdown functional */
        #google_translate_element_dashboard .goog-te-gadget > span > a,
        #google_translate_element_dashboard .goog-te-gadget .goog-logo-link,
        #google_translate_element_dashboard .goog-te-gadget span:first-child,
        .goog-te-banner-frame,
        .goog-te-banner-frame.skiptranslate {
          display: none !important;
        }
        
        #google_translate_element_dashboard .goog-te-gadget {
          font-size: 0 !important;
          line-height: 0 !important;
        }
        
        /* Style the actual Google dropdown */
        #google_translate_element_dashboard .goog-te-combo {
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
        .custom-translate-btn-dashboard {
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
        
        .custom-translate-btn-dashboard:active {
          transform: scale(0.95);
        }
        
        /* When dropdown is opened, show it */
        .translate-micro-dashboard.open #google_translate_element_dashboard .goog-te-combo {
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
        
        .translate-micro-dashboard.open #google_translate_element_dashboard .goog-te-combo option {
          padding: 4px 8px !important;
          font-size: 12px !important;
          color: #333 !important;
        }

        /* Mobile translate button in navbar - Simplified without hover */
        .mobile-nav-translate-btn-dashboard {
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

        .mobile-nav-translate-btn-dashboard:active {
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
        .custom-mobile-dropdown-dashboard::-webkit-scrollbar {
          width: 6px;
        }

        .custom-mobile-dropdown-dashboard::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }

        .custom-mobile-dropdown-dashboard::-webkit-scrollbar-thumb {
          background: #46b57f;
          border-radius: 3px;
        }

        .custom-mobile-dropdown-dashboard::-webkit-scrollbar-thumb:hover {
          background: #004e16;
        }

        /* Custom scrollbar for Google dropdown */
        #google_translate_element_dashboard .goog-te-combo::-webkit-scrollbar {
          width: 8px;
        }

        #google_translate_element_dashboard .goog-te-combo::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
        }

        #google_translate_element_dashboard .goog-te-combo::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 6px;
        }

        #google_translate_element_dashboard .goog-te-combo::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </>
  );
}

const MobileNavLine = () => {
  const router = useRouter();
  const cart = useSelector((state) => state.cart);
  const [user, setAdmin] = useState(null);

  return (
    <div
      className={`w-[100%] h-[70vh] bg-[#c2f5db] flex flex-col items-center justify-around md:hidden`}
    >
      <div className={`${router.pathname === "/" ? "active" : ""} `}>
        <Link href="/">Home</Link>
      </div>
      <div className={`${router.pathname === "/products" ? "active" : ""}`}>
        <Link href="/products">Products</Link>
      </div>
      <div className={`${router.pathname === "/about" ? "active" : ""}`}>
        <Link href="/about">About</Link>
      </div>
      <div
        className={` cursor-pointer ${
          router.pathname === "/cart" ? "active" : ""
        }`}
      >
        <Link href="/cart" passHref>
          <p>Cart </p>
        </Link>
      </div>
      {user && (
        <div>
          <Link href="/" passHref>
            <p
              className="font-dnsansItal text-[18px] cursor-pointer "
              onClick={() => onSignOut()}
            >
              Sign Out
            </p>
          </Link>
        </div>
      )}
      <div>
        {!user && (
          <div className={` flex items-center justify-end mr-5 `}>
            <Image
              src="/images/Icons/Arrow_icon.png"
              alt="arrow-icon"
              width={30}
              height={30}
            />
            <Link href="/signin" passHref>
              <p className="ml-2 font-dnsansItal cursor-pointer text-[20px]">
                Sign In
              </p>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
export default DashBoardNavBar;