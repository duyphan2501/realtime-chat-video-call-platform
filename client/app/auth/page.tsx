  // import AuthForm from "@/components/AuthForm";
  // import AuthLeft from "@/components/AuthLeft";

import AuthForm from "@/components/auth/AuthForm";
import AuthLeft from "@/components/auth/AuthLeft";

const AuthPage = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AuthLeft />
      <AuthForm />
    </div>
  );
};

export default AuthPage;
