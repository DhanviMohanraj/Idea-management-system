import { useState } from "react";
import { createIdea } from "../api/ideas";

function CreateIdea() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const ideaData = { title, description };
    const response = await createIdea(ideaData);

    alert(response.message);

    setTitle("");
    setDescription("");
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>Create Idea</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Idea Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <br /><br />

        <textarea
          placeholder="Idea Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          required
        />
        <br /><br />

        <button type="submit">Submit Idea</button>
      </form>
    </div>
  );
}

export default CreateIdea;
