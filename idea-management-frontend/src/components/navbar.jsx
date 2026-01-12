import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
      <Link to="/register">Register</Link> |{" "}
      <Link to="/login">Login</Link> |{" "}
      <Link to="/dashboard">Dashboard</Link> |{" "}
      <Link to="/createidea">Create Idea</Link> |{" "}
      <Link to="/myideas">My Ideas</Link>
    </nav>
  );
}

export default Navbar;
