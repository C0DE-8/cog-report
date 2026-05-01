import apiClient from "./client";

export function registerUser(payload) {
  return apiClient.post("/auth/register", payload);
}

export function loginUser(payload) {
  return apiClient.post("/auth/login", payload);
}
