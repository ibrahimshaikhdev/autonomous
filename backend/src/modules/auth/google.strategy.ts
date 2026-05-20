import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private prisma: PrismaService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || '187040381228-eaq1dvvvm84va5mu89ke923obv2btcj4.apps.googleusercontent.com',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { emails, name, id } = profile;
    const email = emails[0].value;
    const firstName = name.givenName;
    const lastName = name.familyName;

    // Check if user exists
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { workspace: true },
    });

    if (!user) {
      // Create new user with workspace
      const workspace = await this.prisma.workspace.create({
        data: {
          name: `${firstName || 'User'}'s Workspace`,
          slug: `workspace-${Date.now()}`,
        },
      });

      // Generate a random password for Google users
      const randomPassword = bcrypt.hashSync(Math.random().toString(36), 10);

      user = await this.prisma.user.create({
        data: {
          email,
          password: randomPassword,
          name: `${firstName || ''} ${lastName || ''}`.trim(),
          role: 'OWNER',
          workspaceId: workspace.id,
        },
        include: { workspace: true },
      });
    }

    done(null, {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      workspace: user.workspace ? {
        id: user.workspace.id,
        name: user.workspace.name,
        slug: user.workspace.slug,
      } : null,
    });
  }
}