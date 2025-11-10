import api from "../../../lib/axios";

export const userApi = {
  getAll: () => api.get("/admin/users"),
  create: (data) => api.post("/admin/users", data),
  remove: (id) => api.delete(`/admin/users/${id}`),
};
