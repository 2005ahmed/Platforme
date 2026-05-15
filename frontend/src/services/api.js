import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const coverLetterAPI = {
  generate: (data) => api.post("/ai/generate-cover-letter", data),
};

export const cvAnalysisAPI = {
  analyze: (formData) =>
    api.post("/analyze-cv", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    }),
};

export default api;

