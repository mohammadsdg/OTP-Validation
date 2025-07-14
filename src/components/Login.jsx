import React from "react";
import { useState, useEffect } from "react";
import Logo from "../assets/icon.png";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import { motion } from "framer-motion";

export default function Login() {
  const [number, setNumber] = useState("");

  const navigate = useNavigate();

  const inputRef = useRef(null);

  const pageVariants = {
    initial: { opacity: 0, x: -100 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: 100 },
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5,
  };

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (isLoggedIn === "true") {
      navigate("/home");
    }
  }, [navigate]);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (isLoggedIn) {
      navigate("/home");
    }

    const savedNumber = localStorage.getItem("phone_number");
    if (savedNumber) {
      setNumber(savedNumber);
    }

    inputRef.current.focus();
  }, []);

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      <div className="card">
        <img src={Logo} alt="Login icon" />

        <div className="title">ورود به حساب کاربری</div>
        <div className="subtitle">
          شماره موبایل خود را وارد نمایید تا رمز یکبار مصرف برای شما ارسال شود
        </div>
        <input
          type="tel"
          placeholder="09123456789"
          value={number}
          ref={inputRef}
          onChange={(e) => {
            setNumber(e.target.value);
            console.log(e.target.value);

            const val = e.target.value;
            setNumber(val);
            localStorage.setItem("phone_number", val);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              navigate("/verify", { state: { number } });
            }
          }}
        />
        <button
          className="btn"
          onClick={() => {
            navigate("/verify", { state: { number } });
          }}
        >
          ادامه
        </button>
      </div>
    </motion.div>
  );
}
