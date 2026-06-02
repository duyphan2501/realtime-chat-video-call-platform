import AuthForm from "@/components/auth/AuthForm";
import AuthLeft from "@/components/auth/AuthLeft";

const AuthPage = () => {
  return (
    <div className="flex w-full overflow-hidden bg-background">
      <div className="hidden xl:px-16 flex-1 items-center lg:flex w-full justify-end  border-r border-gray-800 md:px-12">
        <AuthLeft />
      </div>
      <div className="flex flex-1 items-center justify-center lg:justify-start min-h-screen md:px-12 xl:px-16">
        <AuthForm />
      </div>
    </div>
  );
};

export default AuthPage;
