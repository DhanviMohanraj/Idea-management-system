import { useState } from "react";
import { createIdea } from "../api/ideas";
import { getEmail, getName } from "../utils/auth";

function CreateIdea() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSuccess("");
    setSaving(true);

    await createIdea({
      title,
      description,
      ownerEmail: getEmail(),
      ownerName: getName(),
    });

    setTitle("");
    setDescription("");

    setSuccess("Idea submitted — your team lead will review it soon.");
    setSaving(false);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Submit a new idea</h2>
        <p className="card-subtitle">
          Share improvements for your team. Submitting as <strong>{getName() || getEmail()}</strong>.
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
            maxLength={80}
            required
          />
          <div className="field-helper">{title.length}/80</div>
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
            maxLength={600}
            required
          />
          <div className="field-helper">{description.length}/600</div>
        </div>

        {success && (
          <div className="empty-state" style={{ borderStyle: "solid" }}>
            <div className="empty-title">Success</div>
            <div className="empty-subtitle">{success}</div>
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
          {saving ? "Submitting…" : "Submit idea"}
        </button>
      </form>
    </div>
  );
}

export default CreateIdea;
