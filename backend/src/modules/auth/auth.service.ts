import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import * as nodemailer from "nodemailer";
import { PrismaService } from "../../prisma/prisma.service";
import { SignupDto } from "./dto/signup.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_APP_PASSWORD,
      },
    });
  }

  async signup(signupDto: SignupDto) {
    const { email, password, name, workspaceName } = signupDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const workspaceNameToUse = workspaceName || `${name}'s Workspace`;
    const slug =
      workspaceNameToUse
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "") +
      "-" +
      Date.now();

    const workspace = await this.prisma.workspace.create({
      data: {
        name: workspaceNameToUse,
        slug,
      },
    });

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: "OWNER",
        workspaceId: workspace.id,
      },
      include: {
        workspace: true,
      },
    });

    const token = this.generateToken(user.id, user.email);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { workspace: true },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const token = this.generateToken(user.id, user.email);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return this.sanitizeUser(user);
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return {
        message:
          "If an account with that email exists, a reset code has been sent",
      };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store hashed OTP on user
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordOtp: hashedOtp,
        passwordOtpExpires: otpExpires,
      },
    });

    // Send OTP via Gmail SMTP
    try {
      await this.transporter.sendMail({
        from: `"AutonomousOps" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: "Your Password Reset Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Password Reset Code</h2>
            <p>You requested a password reset for your AutonomousOps account.</p>
            <div style="background: #f4f4f4; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${otp}</span>
            </div>
            <p style="color: #666; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
          </div>
        `,
      });
    } catch (error) {
      console.error("Failed to send email via Gmail SMTP:", error);
    }

    return {
      message:
        "If an account with that email exists, a reset code has been sent",
    };
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordOtp || !user.passwordOtpExpires) {
      throw new UnauthorizedException("Invalid or expired reset code");
    }

    if (new Date() > user.passwordOtpExpires) {
      // Clear expired OTP
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordOtp: null, passwordOtpExpires: null },
      });
      throw new UnauthorizedException(
        "Reset code has expired. Please request a new one.",
      );
    }

    const isValid = await bcrypt.compare(otp, user.passwordOtp);
    if (!isValid) {
      throw new UnauthorizedException("Invalid reset code");
    }

    // OTP is valid — clear it and issue a short-lived reset JWT
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordOtp: null, passwordOtpExpires: null },
    });

    const resetToken = this.jwtService.sign(
      { sub: user.id, type: "password-reset" },
      { expiresIn: "5m" },
    );

    return { resetToken };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token);

      if (payload.type !== "password-reset") {
        throw new UnauthorizedException("Invalid reset token");
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { password: hashedPassword },
      });

      return { message: "Password has been reset successfully" };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException("Invalid or expired reset token");
    }
  }

  private generateToken(userId: string, email: string): string {
    return this.jwtService.sign({ sub: userId, email });
  }

  private sanitizeUser(user: any) {
    const { password, passwordOtp, passwordOtpExpires, ...result } = user;
    return result;
  }
}
