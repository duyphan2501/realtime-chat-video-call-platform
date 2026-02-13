import AuthForm from "@/components/AuthForm";
import AuthLeft from "@/components/AuthLeft";

const AuthPage = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden container">
      <AuthLeft />
      <AuthForm />
    </div>
  );
};

export default AuthPage;
