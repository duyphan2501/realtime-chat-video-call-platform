import AuthForm from "@/components/auth/AuthForm";
import AuthLeft from "@/components/auth/AuthLeft";

const AuthPage = () => {
  return (
    <div className="flex min-h-dvh w-full overflow-hidden bg-background">
      <div className="hidden flex-1 items-center justify-center lg:flex">
        <AuthLeft />
      </div>
      <div className="flex min-h-dvh w-full flex-col items-stretch justify-stretch lg:w-1/2 lg:items-center lg:justify-center lg:px-6 lg:py-12">
        <AuthForm />
      </div>
    </div>
  );
};

export default AuthPage;
