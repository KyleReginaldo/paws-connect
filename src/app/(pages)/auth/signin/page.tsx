"use client";
import { useAuth } from "@/app/context/AuthContext";
import React, { useState } from "react";

const Signin = () => {
  const { onLogin } = useAuth();
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [password, setPassword] = useState<string | undefined>(undefined);

  return (
    <div className="flex flex-col justify-center items-center h-[100vh] w-[100vw] gap-3">
      <input
        type="email"
        placeholder="juandelacruz@example.com"
        className="px-[10px] py-[5px] border-2 w-[300px]"
        onChange={(value) => {
          setEmail(value.target.value);
        }}
      />
      <input
        type="password"
        placeholder="********"
        className="px-[10px] py-[5px] border-2 w-[300px]"
        onChange={(value) => {
          setPassword(value.target.value);
        }}
      />
      <button
        className="bg-black text-white w-[300px] py-[5px] cursor-pointer"
        onClick={() => {
          if (email && password) {
            onLogin(email, password);
          } else {
            console.log("Input email and password");
          }
        }}
      >
        Signin
      </button>
    </div>
  );
};

export default Signin;
