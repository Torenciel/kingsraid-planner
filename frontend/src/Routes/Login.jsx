// frontend/src/Routes/Login.jsx
import { Link } from "react-router-dom";
import "./Login.css";

const Login = () => {
  return (
    <div className="login-page">
      <h1>Login</h1>
      <p>This page will allow users to sign in.</p>
        <Link to="/register" className="navbar-link register-link">
          Register
        </Link>
    </div>
  );
};

export default Login;
