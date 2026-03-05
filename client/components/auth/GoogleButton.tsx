import { useAPI } from "@/hooks";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

const GoogleButton = ({ isLogin }: { isLogin: boolean }) => {
  const { googleLogin } = useAPI().auth;
  const router = useRouter();

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  if (!clientId) {
    console.error("Google Client ID is missing in environment variables");
  }

  const handleSuccess = (credentialResponse: any): void => {
    const token = credentialResponse?.credential;
    if (!token) {
      toast.error("Failed to get credentials");
      return;
    }
    googleLogin(token)
      .then(() => {
        toast.success("Welcome back!");
        router.push("/");
      })
      .catch((error) => {
        console.error(error);
        const message =
          error instanceof AxiosError
            ? error.response?.data?.message
            : "Google login failed";
        toast.error(message);
      });
  };

  return (
    <GoogleOAuthProvider clientId={clientId} locale="en">
      <div className="w-full flex justify-center">
        <GoogleLogin
          theme="outline"
          size="large"
          text={isLogin ? "signin_with" : "signup_with"}
          onSuccess={handleSuccess}
          onError={() => console.error("Login Failed")}
        />
      </div>
    </GoogleOAuthProvider>
  );
};

export default GoogleButton;
