import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export const AuthContextProvider = ({children})  => {
    const [session, setSession] = useState(undefined);

    const signUp = async (email, username, password) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username
                }
            }
        })

        if (error) {
            alert(`${error}`)
            return { success: false, error };
        } 

        return { success: true, data };
    }

    const signOut = () => {
        const { error } = supabase.auth.signOut();

        if (error) {
            alert(`${error}`);
        }
    }

    const logIn = async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                alert(`${error}`);
                return { success: false, error: error.message };
            }

            console.log(`Login success: ${data}`);
            return { success: true, data };
        } catch (error) {
            console.error(`an error occured: ${error}`);
            return { success: false, error: error.message };
        }
    }

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });
        supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
    }, [])

    return (
        <AuthContext.Provider value={{ session, signUp, signOut, logIn}}>
            {children}
        </AuthContext.Provider>
    )
}

export const UserAuth = () => {
    return useContext(AuthContext);
}