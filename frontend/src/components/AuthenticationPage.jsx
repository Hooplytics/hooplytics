import { useLocation, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { UserAuth } from "../context/AuthContext";

export function AuthenticationPage() {
    const { pathname } = useLocation();
    const isLogin = pathname === "/login";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const { session, signUp, logIn } = UserAuth();
    const navigate = useNavigate();
    console.log(session);

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await signUp(email, password);

            if (result.success) {
                navigate("/home");
            }
        } catch (error) {
            alert("An error occurred signing in.");
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();
    };

    return (
        <div>
            <Link to="/home" className="header">
                <header>
                    <h1>Hooplytics</h1>
                </header>
            </Link>
            <div className="authentication-container">
                <form className="authentication-form" onSubmit={handleSignUp}>
                    <div className="authentication-options">
                        <Link to="/login" className={isLogin ? "auth active" : "auth"}>Login</Link>
                        <Link to="/signup" className={!isLogin ? "auth active" : "auth"}>Signup</Link>
                    </div>
                    <input onChange={(e) => setEmail(e.target.value)} value={email} placeholder="Email" />
                    <input onChange={(e) => setPassword(e.target.value)} value={password} placeholder="Password" />
                    {isLogin && <button type="submit" disabled={loading}>Login</button>}
                    {!isLogin && <button type="submit" disabled={loading}>Signup</button>}
                </form>
            </div>
        </div>
    )
}