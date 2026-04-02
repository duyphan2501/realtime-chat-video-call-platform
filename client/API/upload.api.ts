import { AxiosInstance } from "axios";

export const uploadAPI = (axiosPrivate: AxiosInstance) => ({
  uploadImages: (formData: FormData) =>
    axiosPrivate.post("/uploads/images", formData),
  uploadDocuments: (formData: FormData) =>
    axiosPrivate.post("/uploads/documents", formData),
});
