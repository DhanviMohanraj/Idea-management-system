import { useState } from "react";
import { createIdea } from "../api/ideas";
import { getEmail, getName } from "../utils/auth";

function CreateIdea() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const ideaData = {
      title,
      description,
      ownerEmail: getEmail(),
      ownerName: getName(),
    };
    const response = await createIdea(ideaData);

    alert("Idea submitted successfully");

    setTitle("");
    setDescription("");
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Submit a new idea</h2>
        <p className="card-subtitle">
          Share problems worth solving or improvements for your team.
        </p>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label className="field-label" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            className="field-input"
            placeholder="A short, clear summary"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            className="field-textarea"
            placeholder="What problem does this solve? What does success look like?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary btn-full">
          Submit idea
        </button>
      </form>
    </div>
  );
}

export default CreateIdea;
