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

  const onSignOut = () => {
    dispatch(logout());
    setAdmin(null);
    router.push("/dashboard/admin/signin");
  };

  // ✅ Google Translate setup
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
        },
        "google_translate_element"
      );
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

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
            <div className={`${router.pathname === "/" ? "active" : ""} `}>
              <Link href="/dashboard/admin/profile/1">Home</Link>
            </div>

            <div
              className={`${router.pathname === "/products" ? "active" : ""}`}
            >
              <Link href="/dashboard/admin/products">Products</Link>
            </div>
            <div className={`${router.pathname === "/about" ? "active" : ""}`}>
              <Link href="/about">More </Link>
            </div>
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

          {/* ✅ Google Translate dropdown (placed at the right end after admin signin) */}
          <div
            id="google_translate_element"
            style={{
              marginLeft: "15px",
              background: "rgba(255, 255, 255, 0.95)",
              padding: "6px 10px",
              borderRadius: "8px",
              backdropFilter: "blur(10px)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
            }}
          ></div>
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

      {/* ✅ Google Translate styling */}
      <style jsx>{`
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
