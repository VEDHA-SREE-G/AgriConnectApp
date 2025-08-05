import React from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../../../components/AdminLayout/AdminLayout";
import Dashboard from "../../../../components/Dashboard/Dashboard";
import { useEffect, useState } from "react";
import { auth, db } from "../../../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

function DashBoardPage() {
  const [verifyAdmin, setVerifyAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const adminId = router.query.id;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user && user.uid === adminId) {
          // User is authenticated and matches the admin ID in URL
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const userData = userDoc.data();

          if (userData && userData.role === "farmer") {
            // User exists in Firestore and has farmer role
            setVerifyAdmin(true);
          } else {
            // User doesn't exist in Firestore or doesn't have farmer role
            console.log("User not found or invalid role");
            setVerifyAdmin(false);
            // Optionally redirect to signin
            // router.push("/auth/signin");
          }
        } else if (user && user.uid !== adminId) {
          // User is authenticated but trying to access different user's dashboard
          console.log("Unauthorized access attempt");
          setVerifyAdmin(false);
          // Redirect to their own dashboard
          router.push(`/dashboard/admin/profile/${user.uid}`);
        } else {
          // User is not authenticated
          console.log("User not authenticated");
          setVerifyAdmin(false);
          // Optionally redirect to signin
          // router.push("/auth/signin");
        }
      } catch (error) {
        console.error("Error verifying admin:", error);
        setVerifyAdmin(false);
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [adminId, router]);

  // Alternative method: Check localStorage if you prefer client-side verification
  // useEffect(() => {
  //   try {
  //     const adminData = localStorage.getItem("admin");
  //     if (adminData) {
  //       const parsedAdmin = JSON.parse(adminData);
  //       if (parsedAdmin.id === adminId && parsedAdmin.role === "farmer") {
  //         setVerifyAdmin(true);
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error checking localStorage:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [adminId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {verifyAdmin ? (
        <AdminLayout>
          <Dashboard />
        </AdminLayout>
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-xl mb-4">Access Denied</p>
            <p className="text-gray-600 mb-4">
              You are not authorized to access this dashboard.
            </p>
            <button
              onClick={() => router.push("/auth/signin")}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default DashBoardPage;