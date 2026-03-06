import { useMemo } from "react";
import useAxiosPrivate from "./useAxiosPrivate";
import { authAPI } from "@/API/authAPI";

export const useAPI = () => {
  const axios = useAxiosPrivate(); // Hook xử lý lỗi 401 & Refresh Token

  return useMemo(
    () => ({
      auth: authAPI(axios),
    }),
    [axios],
  );
};
