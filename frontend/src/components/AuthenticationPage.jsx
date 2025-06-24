import { useState } from "react"

export function AuthenticationPage() {
    const [login, setLogin] = useState(true);

    const handleLogin = () => {
        setLogin(prev => true);
    }

    const handleSignup = () => {
        setLogin(prev => false);
    }

    return (
        <div className="authentication-container">
            <form className="authentication-form">
                <div className="authentication-options">
                    <h5 className={login ? "active" : null} onClick={handleLogin}>Login</h5>
                    <h5 className={!login ? "active" : null}  onClick={handleSignup}>Signup</h5>
                </div>
                <input placeholder="Username" />
                <input placeholder="Password" />
                {login && <button>Login</button>}
                {!login && <button>Signup</button>}
            </form>
        </div>
    )
}