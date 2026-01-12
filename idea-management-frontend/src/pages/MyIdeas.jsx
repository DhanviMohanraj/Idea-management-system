import { useEffect, useState } from "react";
import { getMyIdeas } from "../api/ideas";

function MyIdeas() {
  const [ideas, setIdeas] = useState([]);

  useEffect(() => {
    const fetchIdeas = async () => {
      const data = await getMyIdeas();
      setIdeas(data);
    };
    fetchIdeas();
  }, []);

  return (
    <div style={{ padding: "40px" }}>
      <h2>My Ideas</h2>

      {ideas.length === 0 ? (
        <p>No ideas found</p>
      ) : (
        <ul>
          {ideas.map((idea) => (
            <li key={idea.id}>
              {idea.title} — <b>{idea.status}</b>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MyIdeas;
