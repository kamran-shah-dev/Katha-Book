import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { getDoc, doc } from "firebase/firestore";
import { db } from "@/firebaseConfig";

import bcrypt from "bcryptjs";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Auth() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const userRef = doc(db, "admins", phone);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setErrorMsg("Invalid Id or password.");
        setLoading(false);
        return;
      }

      const userData = userSnap.data();
      const storedHash = userData.password;

      const match = await bcrypt.compare(password, storedHash);

      if (!match) {
        setErrorMsg("Invalid Id or password.");
        setLoading(false);
        return;
      }

      // ✅ AWAIT the login function
      await login(phone);

      console.log("Login complete, navigating to dashboard...");

      // Redirect to dashboard
      navigate("/dashboard", { replace: true });

    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center 
      bg-gradient-to-br from-[#3b2f2f] via-[#4b3a3a] to-[#2d2525] p-6"
    >
      <Card className="w-full max-w-md bg-white/95 shadow-2xl rounded-2xl border border-gray-300">
        
        <CardHeader className="text-center">
          <CardTitle>
            <img
              src="/logo.jpeg"
              alt="Katha Book Logo"
              className="mx-auto h-28 w-auto mb-2"
            />
          </CardTitle>

          <CardDescription className="text-base text-gray-600 font-medium">
            Login to access your Katha Book
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="phone">User Id</Label>
              <Input
                id="phone"
                type="text"
                className="h-12 rounded-lg border-2 border-gray-300"
                placeholder="Enter your user id"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2 relative">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type={showPass ? "text" : "password"}
                className="h-12 rounded-lg border-2 border-gray-300 pr-10"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />

              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-10 -translate-y-1/2 text-gray-600"
              >
                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {errorMsg && (
              <p className="text-red-600 text-sm text-center font-semibold">
                {errorMsg}
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-[#6b4f4f]"
              disabled={loading}
            >
              {loading ? "Please wait..." : "Login"}
            </Button>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}