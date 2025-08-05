import React, { useState } from "react";
import { 
  getFirestore, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";

// Initialize Firestore (assuming it's already initialized in your app)
const db = getFirestore();

// Star Rating Modal Component
function StarRatingModal({ isOpen, onClose, onSubmit, productName }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarClick = (starRating) => {
    setRating(starRating);
  };

  const handleSubmit = async () => {
    if (rating > 0) {
      setIsSubmitting(true);
      try {
        await onSubmit(rating);
        setRating(0);
        setHoverRating(0);
        onClose();
      } catch (error) {
        console.error('Failed to submit rating:', error);
        alert('Failed to submit rating. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoverRating(0);
    onClose();
  };

  const getRatingText = (rating) => {
    const texts = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return texts[rating] || '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-xl max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
          Rate Your Order
        </h3>
        <p className="text-gray-600 text-center mb-6">{productName}</p>
        
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              className={`text-4xl transition-all duration-200 hover:scale-110 ${
                star <= (hoverRating || rating) 
                  ? 'text-yellow-400' 
                  : 'text-gray-300'
              }`}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              disabled={isSubmitting}
            >
              ★
            </button>
          ))}
        </div>
        
        <div className="text-center mb-6 h-6">
          {rating > 0 && (
            <span className="text-gray-600">
              {getRatingText(rating)} ({rating} star{rating > 1 ? 's' : ''})
            </span>
          )}
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              rating === 0 || isSubmitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </button>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Star Display Component for existing ratings
function StarDisplay({ rating, showNumber = true }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  return (
    <div className="flex items-center gap-1">
      <div className="text-yellow-400">
        {[...Array(5)].map((_, index) => (
          <span key={index}>
            {index < fullStars ? '★' : index === fullStars && hasHalfStar ? '☆' : '☆'}
          </span>
        ))}
      </div>
      {showNumber && <span className="text-sm text-gray-600">({rating.toFixed(1)})</span>}
    </div>
  );
}

function OrderComponent({ product, index, orderStatus, orderId, userId }) {
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [currentRating, setCurrentRating] = useState(product.rating || null);

  // Check if order has been rated
  const hasRating = currentRating !== undefined && currentRating !== null;

  const handleRateOrder = () => {
    setShowRatingModal(true);
  };

  // Function to update product average rating in Firebase
  const updateProductAverageRating = async (productId) => {
    try {
      // Get all orders for this product that have ratings
      const ratingsQuery = query(
        collection(db, "orders"),
        where("productId", "==", productId)
      );
      
      const ratingsSnap = await getDocs(ratingsQuery);
      
      let sum = 0;
      let count = 0;
      
      ratingsSnap.forEach(orderDoc => {
        const orderData = orderDoc.data();
        if (orderData.rating && orderData.rating > 0) {
          sum += orderData.rating;
          count++;
        }
      });
      
      const avgRating = count > 0 ? (sum / count) : 0;
      
      console.log("Calculated average rating:", avgRating, "from", count, "ratings");

      // Find and update the product document
      const productsQuery = query(
        collection(db, "products"), 
        where("productId", "==", productId)
      );
      
      const productsSnap = await getDocs(productsQuery);
      
      if (!productsSnap.empty) {
        const productDocRef = doc(db, "products", productsSnap.docs[0].id);
        await updateDoc(productDocRef, {
          avgRating: Number(avgRating.toFixed(2)),
          ratingCount: count,
          updatedAt: serverTimestamp()
        });
        console.log("Product rating updated successfully");
      } else {
        console.warn("Product document not found for productId:", productId);
      }
      
    } catch (error) {
      console.error("Error updating product average rating:", error);
      throw error;
    }
  };

  const handleRatingSubmit = async (rating) => {
    try {
      // 1. Update the order document with the rating
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        rating: rating,
        ratedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log("Order updated with rating:", rating);

      // 2. Update the product's average rating
      await updateProductAverageRating(product.productId || product.id);

      // 3. Update local state
      setCurrentRating(rating);
      
      alert('Thank you for your rating!');
      
    } catch (error) {
      console.error('Failed to submit rating:', error);
      
      // Provide user-friendly error messages
      if (error.code === 'permission-denied') {
        throw new Error("Permission denied. Please make sure you're logged in.");
      } else if (error.code === 'not-found') {
        throw new Error("Order not found.");
      } else {
        throw new Error("Something went wrong while submitting your rating. Please try again.");
      }
    }
  };

  return (
    <>
      <div
        key={index}
        className="w-[400px] flex items-center justify-around p-5 bg-white shadow-lg rounded-lg overflow-hidden"
      >
        <img
          src={product.image}
          className="w-32 h-32 rounded-md object-cover"
          alt="products"
        />
        <div className="p-5">
          <h3 className="text-xl font-semibold mb-2">{product.productName || product.name}</h3>
          <p className="text-gray-600 mb-4">
            <b>Order Status:</b> {orderStatus}
          </p>
          <p className="text-gray-600 mb-4">
            <b>Quantity:</b> {product.quantity}
          </p>
          <p className="text-gray-600 mb-4">
            <b>Price per unit:</b> ₹{product.productRate}{product.productWeight}
          </p>
          
          {/* Rating Section */}
          <div className="mt-4">
            {hasRating ? (
              <div className="flex items-center gap-2">
                <StarDisplay rating={currentRating} />
              </div>
            ) : (
              <button
                onClick={handleRateOrder}
                className="bg-orange-400 hover:bg-orange-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Give Rating
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Star Rating Modal */}
      <StarRatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleRatingSubmit}
        productName={product.productName || product.name}
      />
    </>
  );
}

export default React.memo(OrderComponent);