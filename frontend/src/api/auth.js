import apiClient from "./client";

export function registerUser(payload) {
  return apiClient.post("/auth/register", payload);
}

export function loginUser(payload) {
  return apiClient.post("/auth/login", payload);
}

export function getUserProfile(id) {
  return apiClient.get(`/auth/${id}`);
}

export function updateUserProfile(id, payload) {
  return apiClient.put(`/auth/${id}`, payload);
}
