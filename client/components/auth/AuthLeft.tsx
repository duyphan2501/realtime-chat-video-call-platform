import Logo from "../Logo";

const AuthLeft = () => {
  return (
    <div className="hidden lg:flex flex-col justify-between p-12 border-r border-gray-800">
      <div className="flex items-center gap-3 text-primary">
        <div className="size-8 mb-5">
          <Logo />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight mb-6">
          ConnectApp
        </h2>
      </div>

      <div className="max-w-lg">
        <h1 className="text-3xl xl:text-4xl font-black leading-tight tracking-tight subtitle text-white mb-3">
          Connect with your world instantly.
        </h1>

        <p className=" text-gray-400 mb-8">
          Experience the next generation of seamless communication. Join
          millions of users worldwide for messaging, voice, and video calls.
        </p>

        <div className="rounded-xl overflow-hidden shadow-2xl bg-gray-800 h-100">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJPbNmSP1lo_PtO6jQCeM3FCqFxaTxr_bwX-kCePHBn9jfSAtBQH013cLr0DbNd838Bg-7al4u58k1XnaUuUPk65LIq0Woaa1AuCwRSpuhE_fEDrxY5f7ZUiGzphne5hVrMVD5ZjSvjPgVDIOq5ziSMXid2jM7zaLzpmYhf5RHngLBzNAP-Y00102kaVB29AtSiyQvvkbExYgFUCeFpuwjDmCnTJynqAYHpbSXd7_tTcWK-3ZhUAzAtOzf_z_BZDNgK_hLHY8h7smD"
            alt="Dashboard"
            className="size-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default AuthLeft;
