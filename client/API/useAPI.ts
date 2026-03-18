import { useMemo } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { authAPI } from "@/API/auth.api";
import { conversationAPI } from "@/API/conversation.api";

export const useAPI = () => {
  const axios = useAxiosPrivate(); // Hook xử lý lỗi 401 & Refresh Token

  return useMemo(
    () => ({
      auth: authAPI(axios),
      conversation: conversationAPI(axios),
    }),
    [axios],
  );
};
