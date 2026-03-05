import { useMemo } from "react";
import useAxiosPrivate from "./useAxiosPrivate";
import { authService } from "@/services/auth.service";

export const useAPI = () => {
  const axios = useAxiosPrivate(); // Hook xử lý lỗi 401 & Refresh Token

  return useMemo(
    () => ({
      auth: authService(axios),
    }),
    [axios],
  );
};
