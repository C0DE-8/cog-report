import apiClient from "./client";

export function createGroup(payload) {
  return apiClient.post("/reporting/groups", payload);
}

export function getGroups() {
  return apiClient.get("/reporting/groups");
}

export function getStatuses() {
  return apiClient.get("/reporting/statuses");
}

export function updateGroup(id, payload) {
  return apiClient.put(`/reporting/groups/${id}`, payload);
}

export function createReportingUser(payload) {
  return apiClient.post("/reporting/users", payload);
}

export function getReportingUsers() {
  return apiClient.get("/reporting/users");
}

export function updateReportingUser(id, payload) {
  return apiClient.put(`/reporting/users/${id}`, payload);
}

export function createUserReport(userId, payload) {
  return apiClient.post(`/reporting/users/${userId}/reports`, payload);
}

export function updateUserReport(reportId, payload) {
  return apiClient.put(`/reporting/reports/${reportId}`, payload);
}

export function deleteReportingUser(id) {
  return apiClient.delete(`/reporting/users/${id}`);
}
