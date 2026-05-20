import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto) {
    const { email, password, name, workspaceName } = signupDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create workspace and user
    const workspaceNameToUse = workspaceName || `${name}'s Workspace`;
    const slug = workspaceNameToUse.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();

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
        role: 'OWNER',
        workspaceId: workspace.id,
      },
      include: {
        workspace: true,
      },
    });

    // Generate JWT token
    const token = this.generateToken(user.id, user.email);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        workspace: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const token = this.generateToken(user.id, user.email);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        workspace: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    // In production, you would send an actual email here
    if (user) {
      // Generate reset token (in production, send via email)
      const resetToken = this.jwtService.sign(
        { sub: user.id, type: 'password-reset' },
        { expiresIn: '1h' }
      );

      // In production: await this.emailService.sendPasswordReset(user.email, resetToken);
      console.log(`Password reset token for ${user.email}: ${resetToken}`);
    }

    return {
      message: 'If an account exists with this email, a password reset link has been sent.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token);

      if (payload.type !== 'password-reset') {
        throw new UnauthorizedException('Invalid reset token');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { password: hashedPassword },
      });

      return { message: 'Password has been reset successfully' };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }

  private generateToken(userId: string, email: string): string {
    return this.jwtService.sign({ sub: userId, email });
  }

  private sanitizeUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      workspace: user.workspace ? {
        id: user.workspace.id,
        name: user.workspace.name,
        slug: user.workspace.slug,
      } : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}