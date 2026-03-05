import AuthForm from "@/components/auth/AuthForm";
import AuthLeft from "@/components/auth/AuthLeft";

const AuthPage = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden container">
      <div className="flex-1 justify-center items-center ">
        <AuthLeft />
      </div>
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12">
        <AuthForm />
      </div>
    </div>
  );
};

export default AuthPage;
