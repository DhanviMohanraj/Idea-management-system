import axios from "axios";

const API_URL = "http://127.0.0.1:8000"; // backend later

export const loginUser = async (email, password) => {
  // MOCK RESPONSE for now
  return {
    access_token: "mock-jwt-token",
    token_type: "bearer",
  };

  // REAL API (we’ll enable later)
  // const response = await axios.post(`${API_URL}/auth/login`, {
  //   email,
  //   password,
  // });
  // return response.data;
};
