import { useAuthService } from "@/services";
import {
  GoogleOAuthProvider,
  GoogleLogin,
  CredentialResponse,
} from "@react-oauth/google";
import { toast } from "react-hot-toast";

const GoogleButton = ({ isLogin }: { isLogin: boolean }) => {
  const { googleLogin } = useAuthService();

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  if (!clientId) {
    console.error("Google Client ID is missing in environment variables");
  }

  const handleSuccess = (credentialResponse: CredentialResponse): void => {
    const token = credentialResponse?.credential;
    if (!token) {
      toast.error("Failed to get credentials");
      return;
    }
    googleLogin(token);
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
