// src/services/auth.js
import API from "./api";

export const register = (data) => API.post("/auth/register", data);
export const login = (data) => API.post("/auth/login", data);



