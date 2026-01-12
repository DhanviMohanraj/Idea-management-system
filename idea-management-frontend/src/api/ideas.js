import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export const createIdea = async (ideaData) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("User not authenticated");
  }

  const response = await axios.post(
    `${API_URL}/ideas`,
    ideaData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};
