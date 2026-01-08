import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { getDoc, doc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import bcrypt from "bcryptjs";

export default function Auth() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();

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
      const passwordHash = userData.passwordHash;

      const match = await bcrypt.compare(password, passwordHash);

      if (!match) {
        setErrorMsg("Invalid phone or password.");
        setLoading(false);
        return;
      }

      localStorage.setItem("authUser", phone); // simple login session
      navigate("/dashboard");

    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg("Something went wrong. Try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 p-4">

      <Card className="w-full max-w-md shadow-2xl border border-gray-200 rounded-2xl bg-white/90 backdrop-blur-md">

        <CardHeader className="text-center">
          <CardTitle>
            <img src="/logo.jpeg" alt="Katha Book Logo" className="mx-auto h-28 w-auto mb-2" />
          </CardTitle>
          <CardDescription className="text-base font-medium">
            Login to access your Katha Book
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="text"
                placeholder="0312xxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="h-11"
              />
            </div>

            {errorMsg && (
              <p className="text-red-600 text-sm text-center font-medium">
                {errorMsg}
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold"
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
