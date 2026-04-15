import { AuthService } from "../services/index.js";
import createHttpError from "http-errors";
import { filterFieldUser } from "../utils/filter.util.js";
import { generateAccessTokenAndSetCookies } from "../helpers/auth.helper.js";
import bcrypt from "bcrypt";
import { UserModel } from "../models/user.model.js";
import { sendVerificationEmail, sendForgotPasswordEmail } from "../utils/mailer.util.js";

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      throw createHttpError.BadRequest("Email and password are required!");

    const result = await AuthService.login(email, password);

    const accessToken = await generateAccessTokenAndSetCookies(
      res,
      { userId: result.userId },
      result.refreshToken,
    );

    return res.status(200).json({
      ...result,
      accessToken,
      success: true,
      isVerified: true,
    });
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) throw createHttpError.BadRequest("Token is required!");

    const result = await AuthService.googleLogin(token);

    const accessToken = await generateAccessTokenAndSetCookies(
      res,
      { userId: result.userId },
      result.refreshToken,
    );

    return res.status(200).json({
      ...result,
      accessToken,
      success: true,
      isVerified: true,
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    if (!userId) throw createHttpError.BadRequest("Userid is missing");

    // Sử dụng trực tiếp UserModel để đảm bảo không bị dính .select() ẩn trong AuthService
    const user = await UserModel.findById(userId);

    const accessToken = req.cookies.accessToken;

    return res.status(200).json({ user: filterFieldUser(user), accessToken });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      // Vô hiệu hóa refresh token trong DB để ngăn chặn việc tái sử dụng
      await UserModel.findOneAndUpdate(
        { refreshToken },
        {
          $set: { refreshToken: undefined, refreshTokenExpireAt: undefined },
        },
      );
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return res
      .status(200)
      .json({ message: "Logged out successfully", success: true });
  } catch (error) {
    next(error);
  }
};

const handleRefreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      throw createHttpError.Unauthorized("No refreshToken provided");

    const result = await AuthService.refreshToken(refreshToken);

    const accessToken = await generateAccessTokenAndSetCookies(
      res,
      { userId: result.userId },
      result.refreshToken,
    );
    return res.status(200).json({
      ...result,
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw createHttpError.BadRequest("Vui lòng điền đầy đủ thông tin.");
    }

    let user = await UserModel.findOne({ email });

    // Tạo mã OTP 6 số
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationTokenExpireAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    if (user) {
      if (user.isVerified) {
        throw createHttpError.Conflict("Email này đã được đăng ký!");
      }
      user.verificationToken = verificationCode;
      user.verificationTokenExpireAt = verificationTokenExpireAt;
      user.password = await bcrypt.hash(password, 10);
      user.name = name;
      await user.save();
    } else {
      // Tạo user mới
      const hashedPassword = await bcrypt.hash(password, 10);
      await UserModel.create({
        name,
        email,
        password: hashedPassword,
        isVerified: false,
        verificationToken: verificationCode,
        verificationTokenExpireAt,
      });
    }

    await sendVerificationEmail(email, verificationCode);
    res.status(200).json({ message: "Mã xác nhận đã được gửi đến email của bạn." });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const code = req.body.code?.trim();

    if (!email || !code) {
      throw createHttpError.BadRequest("Vui lòng cung cấp email và mã xác thực.");
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      throw createHttpError.NotFound("Người dùng không tồn tại.");
    }
    if (user.isVerified) {
      throw createHttpError.BadRequest("Tài khoản đã được xác thực trước đó.");
    }
    if (user.verificationToken !== code || new Date() > user.verificationTokenExpireAt) {
      throw createHttpError.BadRequest("Mã xác thực không hợp lệ hoặc đã hết hạn.");
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpireAt = undefined;
    await user.save();

    res.status(200).json({ message: "Xác thực thành công. Bạn có thể đăng nhập." });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw createHttpError.BadRequest("Vui lòng nhập email.");
    }
    const user = await UserModel.findOne({ email });

    if (!user) {
      throw createHttpError.NotFound("Không tìm thấy người dùng với email này.");
    }

    // Tạo mã OTP 6 số
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.forgotPasswordToken = resetCode;
    user.forgotPasswordTokenExpireAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
    await user.save();

    await sendForgotPasswordEmail(email, resetCode);
    res.status(200).json({ message: "Mã xác nhận đã được gửi đến email của bạn." });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;
    const code = req.body.code?.trim();

    if (!email || !code || !newPassword) {
      throw createHttpError.BadRequest("Vui lòng điền đầy đủ thông tin.");
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      throw createHttpError.NotFound("Người dùng không tồn tại.");
    }
    if (user.forgotPasswordToken !== code || new Date() > user.forgotPasswordTokenExpireAt) {
      throw createHttpError.BadRequest("Mã xác thực không hợp lệ hoặc đã hết hạn.");
    }

    // Đặt lại mật khẩu
    user.password = await bcrypt.hash(newPassword, 10);
    user.forgotPasswordToken = undefined;
    user.forgotPasswordTokenExpireAt = undefined;
    await user.save();

    res.status(200).json({ message: "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay bây giờ." });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { name, bio, phone, gender, dob } = req.body;

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { name, bio, phone, gender, dob } },
      { new: true } // Trả về document mới sau khi cập nhật
    );

    if (!updatedUser) throw createHttpError.NotFound("Người dùng không tồn tại.");

    return res.status(200).json({ user: filterFieldUser(updatedUser), message: "Cập nhật thành công." });
  } catch (error) {
    next(error);
  }
};

export const AuthController = {
  login,
  googleLogin,
  getMe,
  logout,
  handleRefreshToken,
  register,
  verifyEmail,
  forgotPassword,
  resetPassword,
  updateProfile,
};
