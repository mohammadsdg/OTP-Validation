import React, { useRef, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../App.css";
import "./Verification.css";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import Home from "./Home";

export default function Verification() {
  const location = useLocation();
  const navigate = useNavigate();
  const number = location.state?.number || "*******";

  const inputRefs = useRef([]);
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [timer, setTimer] = useState(180); // 3 minutes countdown
  const [isResendDisabled, setIsResendDisabled] = useState(true); // Disable resend button initially
  const [isLoggedIn, setIsLogedIn] = useState(false);

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

  // Request OTP on initial load
  useEffect(() => {
    if (!number) return;

    fetch(
      "https://riseymono-production.up.railway.app/api/v1/auth/request-otp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone_number: number }),
      }
    )
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
      });
  }, [number]);

  // Timer countdown logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (timer > 0) {
        setTimer((prev) => prev - 1);
      } else {
        clearInterval(interval);
        setIsResendDisabled(false); // Enable resend OTP button when timer reaches 0
      }
    }, 1000);

    return () => clearInterval(interval); // Cleanup the interval when the component unmounts
  }, [timer]);

  // Focus the first OTP input on load
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Handle OTP input change
  const handleChange = (element, index) => {
    const value = element.value.replace(/\D/, ""); // Only allow digits
    if (!value) return;

    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);

    // Move focus to next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Animate input on change
    element.classList.add("jump");
    setTimeout(() => element.classList.remove("jump"), 200);
  };

  // Handle Backspace key press
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      const updatedOtp = [...otp];
      if (otp[index]) {
        updatedOtp[index] = "";
        setOtp(updatedOtp);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleVerify = () => {
    const otpJoined = otp.join("");
    fetch(
      "https://riseymono-production.up.railway.app/api/v1/auth/verify-otp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone_number: number, otp_code: otpJoined }),
      }
    )
      .then((res) => {
        if (res.status === 401) {
          toast.error("کد ورودی اشتباه میباشد");
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        } else if (res.status === 500) {
          toast.error("مشکلی در سرور به وجود امده است");
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        } else if (res.status === 429) {
          toast.error("تعداد درخواست ها بیشتر از حد مجاز است");
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        } else {
          return res.json();
        }
      })
      .then((data) => {
        if (data.message === "User authenticated successfully.") {
          toast.success("احراز هویت با موفقیت انجام شد");
          console.log(data);

          const userData = {
            number: number,
            access_token: data.access_token,
            refresh_token: data.refresh_token,
          };
          localStorage.setItem("userData", JSON.stringify(userData));
          setIsLogedIn(true);
          localStorage.setItem("isLoggedIn", "true");

          setTimeout(() => {
            navigate("/home");
          }, 3000);
        }
      });
  };

  // otp reaches 0, then send the request
  const resendOtp = () => {
    fetch(
      "https://riseymono-production.up.railway.app/api/v1/auth/request-otp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone_number: number }),
      }
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("OTP Resent:", data);
        setTimer(180);
        setIsResendDisabled(true);
      });
  };

  // format timer
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${minutes}:${sec < 10 ? "0" + sec : sec}`;
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      <Toaster></Toaster>
      <div className="card verify">
        <span className="back-arrow" onClick={() => navigate(-1)}>
          &#8592;
        </span>

        <div className="title">تایید کد</div>
        <div className="subtitle">
          {`کد ارسال شده به شماره ${number} را وارد نمایید`}
        </div>

        <div className="otp-box">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              type="text"
              maxLength="1"
              value={digit}
              ref={(el) => (inputRefs.current[idx] = el)}
              onChange={(e) => handleChange(e.target, idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className="otp-input"
            />
          ))}
        </div>

        <button className="btn" onClick={handleVerify}>
          تایید
        </button>

        <div className="wrong-number">
          <span>ارسال مجدد ({formatTime(timer)})</span>
        </div>

        {/* resend otp */}
        {timer === 0 && (
          <button onClick={resendOtp} disabled={isResendDisabled}>
            ارسال مجدد کد
          </button>
        )}
      </div>
    </motion.div>
  );
}
