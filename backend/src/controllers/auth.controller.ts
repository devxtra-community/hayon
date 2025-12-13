import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/user.model';
import { generateToken } from '../utils/jwt';
import { signupService } from "../services/auth.service";
import { setCookieToken } from '../utils/setAuthCookies';
import { requestOtpService } from "../services/auth.service";
import { verifyOtpService } from "../services/auth.service";

export const requestOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    await requestOtpService(email);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message || "Failed to send OTP",
    });
  }
};



export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const result = await verifyOtpService(email, otp);

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message || "OTP verification failed",
    });
  }
};













export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user, token } = await signupService(req.body);
    setCookieToken(res, token);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message || "Signup failed",
    });
  }
};



export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }
    
    if (user.auth.provider !== 'email' || !user.auth.password_hash) {
      res.status(400).json({
        success: false,
        message: 'Please login with Google',
      });
      return;
    }
    
    const isPasswordValid = await bcrypt.compare(
      password,
      user.auth.password_hash
    );
    
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }
    
    user.last_login = new Date();
    await user.save();
    
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });
    
    setCookieToken(res, token);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          subscription: user.subscription,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  console.log("req came in")
  try {
    const user = await User.findById(req.jwtUser?.userId).select('-auth.password_hash');
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};


export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie('token');
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};