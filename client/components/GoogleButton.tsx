import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
// import { toast } from "react-toastify";
// import axiosCustom from "../../API/axiosInstance";
// import { useNavigate } from "react-router-dom";
// import useUserStore from "../../store/useUserStore";

const GoogleButton = ({ isLogin }: {isLogin: boolean}) => {
  const clientId = "VITE_GOOGLE_CLIENT_ID";
//   const navigate = useNavigate();
//   const { setUser } = useUserStore();

//   if (!clientId) {
//     console.log("clientId is not existed");
//   }

//   const handleSuccess = async (credentialResponse) => {
//     const token = credentialResponse.credential;

//     try {
//       const res = await axiosCustom.post("/api/user/login/google", {
//         token,
//       });

//       if (res.data.success) {
//         toast.success(res.data.message);
//         setUser(res.data.user, res.data.accessToken);
//         navigate("/");
//       } else {
//         toast.error("Đăng nhập thất bại!");
//       }
//     } catch (error) {
//       console.log(error);
//     }
//   };

  return (
    <GoogleOAuthProvider clientId={clientId} locale="en">
      <GoogleLogin
        size="large"
        width="100%"
        onSuccess={() => {}}
        onError={() => console.log("Login Failed")}
        theme="outline"
        text="signin_with"
      />
    </GoogleOAuthProvider>
  );
};

export default GoogleButton;
