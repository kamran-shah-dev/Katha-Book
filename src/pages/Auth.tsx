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
  const { login } = useAuth(); // USE AUTH CONTEXT

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const userRef = doc(db, "admins", phone);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setErrorMsg("Invalid phone or password.");
        setLoading(false);
        return;
      }

      const userData = userSnap.data();
      const storedHash = userData.passwordHash;

      const match = await bcrypt.compare(password, storedHash);

      if (!match) {
        setErrorMsg("Invalid phone or password.");
        setLoading(false);
        return;
      }

      // CALL AUTH CONTEXT LOGIN
      login(phone);

      navigate("/dashboard");

    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg("Something went wrong. Try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center 
      bg-gradient-to-br from-[#3b2f2f] via-[#4b3a3a] to-[#2d2525] p-6">

      <Card className="w-full max-w-md bg-white/95 shadow-2xl rounded-2xl">

        <CardHeader className="text-center">
          <CardTitle>
            <img src="/logo.jpeg" className="mx-auto h-28 mb-2" />
          </CardTitle>
          <CardDescription className="text-gray-600 text-base">
            Login to access your Katha Book
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">

            <div>
              <Label>Phone Number</Label>
              <Input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="relative">
              <Label>Password</Label>
              <Input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-9 text-gray-600"
              >
                {showPass ? <EyeOff /> : <Eye />}
              </button>
            </div>

            {errorMsg && (
              <p className="text-center text-red-600">{errorMsg}</p>
            )}

            <Button className="w-full h-12 bg-[#6b4f4f]">
              {loading ? "Please wait..." : "Login"}
            </Button>

          </form>
        </CardContent>

      </Card>
    </div>
  );
}
