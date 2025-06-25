import { Link, useNavigate } from "react-router-dom"
import { UserAuth } from "../context/AuthContext"

export function ProfilePage() {
    const { session, signOut } = UserAuth();
    const navigate = useNavigate();

    const handleSignOut = async (e) => {
        e.preventDefault();
        try {
            await signOut();
            navigate("/login");
        } catch (error) {
            alert(error);
        }
    }

    return (
        <div>
            <Link to="/home" className="profile-header">
                <header>
                    <h1>Hooplytics</h1>
                </header>
            </Link>
            <p>{session?.user?.email}</p>
            <button onClick={handleSignOut} className="signout">Sign Out</button>
        </div>
    )
}