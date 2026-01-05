import { useEffect } from "react";
import { supabase } from "../supabaseClient";

const AuthCallback = () => {
  useEffect(() => {
    const run = async () => {
      await supabase.auth.exchangeCodeForSession(window.location.href);
      window.location.href = "/"; // ya "/dashboard"
    };
    run();
  }, []);

  return null;
};

export default AuthCallback;
