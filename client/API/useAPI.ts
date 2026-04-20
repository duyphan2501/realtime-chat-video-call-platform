import { useMemo } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { authAPI } from "@/API/auth.api";
import { conversationAPI } from "@/API/conversation.api";
import { messageAPI } from "./message.api";
import { userAPI } from "./user.api";
import { uploadAPI } from "./upload.api";
import { callAPI } from "./call.api";

export const useAPI = () => {
  const axios = useAxiosPrivate(); // Hook to handle 401 errors & Refresh Token

  return useMemo(
    () => ({
      auth: authAPI(axios),
      conversation: conversationAPI(axios),
      message: messageAPI(axios),
      user: userAPI(axios),
      upload: uploadAPI(axios),
      call: callAPI(axios),
    }),
    [axios],
  );
};
