import { useLocation, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { UserAuth } from "../context/AuthContext";
import { Loader } from "./Loader";

export function AuthenticationPage() {
    const { pathname } = useLocation();
    const isLogin = pathname === "/login";

    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const { signUp, logIn } = UserAuth();
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await signUp(email, username, password);

            if (result.success) {
                navigate("/profile");
            }
        } catch (error) {
            alert("An error occurred signing up.");
        } finally {
            setLoading(false);
        }
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await logIn(email, password);

            if (result.success) {
                navigate("/profile");
            }
        } catch (error) {
            alert("Invalid login credentials.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="app-wraper">
            <Link to="/home" className="header">
                <header>
                    <h1>Hooplytics</h1>
                </header>
            </Link>
            <div className="authentication-container">
                <form className="authentication-form" onSubmit={isLogin ? handleLogin : handleSignup}>
                    <div className="authentication-options">
                        <Link to="/login" onClick={() => {setEmail(""); setPassword("");}} className={isLogin ? "auth active" : "auth"}>Login</Link>
                        <Link to="/signup" onClick={() => {setEmail(""); setPassword("");}} className={!isLogin ? "auth active" : "auth"}>Signup</Link>
                    </div>
                    <input onChange={(e) => setEmail(e.target.value)} value={email} placeholder="Email" required/>
                    {!isLogin && <input onChange={(e) => setUsername(e.target.value)} value={username} placeholder="Username" required/>}
                    <input onChange={(e) => setPassword(e.target.value)} value={password} placeholder="Password" required/>
                    {isLogin && <button type="submit" disabled={loading}>Login</button>}
                    {!isLogin && <button type="submit" disabled={loading}>Signup</button>}
                </form>
            </div>
            {loading && <Loader/>}
        </div>
    )
}