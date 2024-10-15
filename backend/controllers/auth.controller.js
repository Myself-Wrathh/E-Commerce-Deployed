import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_KEY_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_KEY_SECRET, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};

const storeRefreshTokenInRedis = async (userId, refreshToken) => {
  await redis.set(
    `refresh_token:${userId}`,
    refreshToken,
    "EX",
    24 * 7 * 60 * 60
  );
};

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists." });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    // Authenticate
    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshTokenInRedis(user._id, refreshToken);

    setCookies(res, accessToken, refreshToken);

    return res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: "User created Successfully.",
    });
  } catch (error) {
    console.log("Error in signup controller", error.message);
    return res
      .status(500)
      .json({ message: "Internal server error ", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(401).json({ message: "Missing Credentails." });
    }
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "User doesn't exists." });
    }
    if (await user.comparePassword(password)) {
      const { accessToken, refreshToken } = generateTokens(user._id);

      await storeRefreshTokenInRedis(user._id, refreshToken);
      setCookies(res, accessToken, refreshToken);

      return res.status(201).json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        message: "User signed in successfully.",
      });
    }
    return res.status(401).json({ message: "Password is Incorrect." });
  } catch (error) {
    console.log("Error in login controller ", error.message);
    return res
      .status(500)
      .json({ message: "Internal server error ", error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decodedToken = jwt.verify(
        refreshToken,
        process.env.REFRESH_KEY_SECRET
      );
      await redis.del(`refresh_token:${decodedToken.userId}`);
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.status(201).json({ message: "Logged out Successfully." });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    return res
      .status(401)
      .json({ message: "Internal server error ", error: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh Token." });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_KEY_SECRET);
    const storedTokenInRedis = await redis.get(
      `refresh_token:${decoded.userId}`
    );

    if (refreshToken != storedTokenInRedis) {
      return res.status(401).json({ message: "Invalid Refresh Token" });
    }
    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.ACCESS_KEY_SECRET,
      {
        expiresIn: "15m",
      }
    );
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    return res.json({ message: "Token refreshed Successfully" });
  } catch (error) {
    console.log("Error in refresh token controller", error.message);
    return res
      .status(500)
      .json({ message: "Internal server error ", error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.log("Error in getProfile controller ", error.message);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
