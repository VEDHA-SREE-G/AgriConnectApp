// ProductCard.jsx - Adds to both Redux (immediate UI) and Firebase (persistence)

import React, { useEffect, useState } from "react";
import Image from "next/image";
import ReactStars from "react-stars";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../../redux/cartSlice";
import { toast } from "react-toastify";
import { auth, db } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

function ProductCard({
  pids,
  productName,
  product,
  imageUrl,
  location,
  price,
  weight,
}) {
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);
  const user = useSelector((state) => state.user);

  // ⭐ Rating state
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);

  // ✅ Fetch ratings whenever product changes
  useEffect(() => {
    if (!pids) return;

    const q = query(collection(db, "orders"), where("productId", "==", pids));
    const unsubscribe = onSnapshot(q, (snap) => {
      let sum = 0,
        count = 0;
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.rating) {
          sum += data.rating;
          count++;
        }
      });
      setAvgRating(count > 0 ? sum / count : 0);
      setRatingCount(count);
    });

    return () => unsubscribe();
  }, [pids]);

  // ⭐ Rating Handler
  const rateProduct = async () => {
    const rating = parseInt(prompt("Rate this product (1-5):"), 10);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return toast.error("Please enter a number between 1 and 5.", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
      });
    }

    if (!auth.currentUser) {
      return toast.error("Please log in to rate.", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
      });
    }

    try {
      const q = query(
        collection(db, "orders"),
        where("userId", "==", auth.currentUser.uid),
        where("productId", "==", pids)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        return toast.error("You can only rate products you purchased.", {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
        });
      }

      const orderRef = doc(db, "orders", snap.docs[0].id);
      const orderData = snap.docs[0].data();

      if (orderData.rating !== undefined) {
        return toast.info("You already rated this order.", {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
        });
      }

      await updateDoc(orderRef, {
        rating: rating,
      });

      toast.success("Thanks for rating!", {
        position: "bottom-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
      });
    } catch (err) {
      console.error("Rating error:", err);
      toast.error("Something went wrong while rating.", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
      });
    }
  };

  // 🛒 Check if product already exists in Firebase cart
  const checkIfInCart = async (userId, productId) => {
    try {
      const cartQuery = query(
        collection(db, "carts"),
        where("userId", "==", userId),
        where("id", "==", productId)
      );
      
      const querySnapshot = await getDocs(cartQuery);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking cart:', error);
      return false;
    }
  };

  // 🛒 Add to Firebase Cart (matching Cart.js structure - separate documents)
  const addToFirebaseCart = async (userId, product) => {
    try {
      // Create separate document for each cart item
      await addDoc(collection(db, "carts"), {
        userId: userId,
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image,
        weight: product.weight,
        location: product.location,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const onAddProducts = async () => {
    // Check if user is logged in
    if (!user.isLoggedIn) {
      toast.error("Please login to add items to cart!", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
      });
      return;
    }

    try {
      const userId = user.user?.id || user.id;
      
      // 🔍 Check if product already in Firebase cart
      const alreadyInCart = await checkIfInCart(userId, pids);
      
      if (alreadyInCart) {
        toast.info("Product already added to cart!", {
          position: "bottom-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
        });
        return;
      }

      // Prepare product object
      const productToAdd = {
        id: pids,
        name: productName,
        price: price,
        weight: weight,
        image: imageUrl,
        location: location,
        quantity: 1
      };

      // Add to Redux store first (immediate UI update)
      dispatch(addToCart(productToAdd));

      // Then add to Firebase (persistence)
      await addToFirebaseCart(userId, productToAdd);

      toast.success("Added to cart successfully!", {
        position: "bottom-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
      });

      console.log("✅ Product added to both Redux and Firebase:", productToAdd);

    } catch (error) {
      console.error("❌ Error adding to cart:", error);
      
      toast.error("Failed to add to cart. Please try again!", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
      });
    }
  };

  return (
    <div
      className="w-[300px] h-[360px] border-[#ac7d87] rounded-xl sm_max:mb-[50px]"
      key={pids}
    >
      <div>
        <Image
          src={imageUrl}
          alt={productName}
          className="rounded-sm rounded-t-xl"
          width="100%"
          height="50%"
          layout="responsive"
          objectFit="cover"
        />
      </div>
      <div className="flex justify-between p-2 font-roboto">
        <div className="flex flex-col">
          <Link href={`/product/${pids}`} passHref>
            <h3 className="font-extrabold text-lg cursor-pointer hover:text-blue-600">
              {productName}
            </h3>
          </Link>

          <span className="flex">
            <p className="text-lg font-light">Location :</p>
            <p className="ml-5">{location} km Apart</p>
          </span>

          {/* ⭐ Reviews Section */}
          <div className="flex items-center">
            <ReactStars
              count={5}
              value={avgRating}
              size={30}
              edit={false}
              color2={"#ffd700"}
            />
            <p className="ml-3 text-sm font-medium">
              {ratingCount} {ratingCount === 1 ? "review" : "reviews"}
            </p>
          </div>

          

          {/* 🛒 Add to Cart Button */}
          <div className="mt-2">
            <button
              className="flex border-2 rounded-[12px] bg-[#20E58F] hover:bg-[#229764] border-transparent focus:border-transparent focus:ring-0 text-white items-center p-2"
              onClick={onAddProducts}
            >
              <Image
                src="/Images/Icons/shopping-cart.png"
                width="20px"
                height="20px"
                alt="shopping cart"
              />
              <p className="ml-3 font-normal">Add to cart</p>
            </button>
          </div>
        </div>

        <div className="text-sm font-semibold">
          <h3>
            ₹ {price}
            <br />
            {weight}
          </h3>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;