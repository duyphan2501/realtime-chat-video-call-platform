import { AxiosInstance } from "axios";

export const userAPI = (axiosPrivate: AxiosInstance) => ({
  searchOnlyFriends: (query: string, limit = 10) =>
    axiosPrivate.get(`/users/search/friends?searchTerm=${query}&limit=${limit}`),
});
