import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../users/users.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'DEV_SECRET_CHANGE_ME',
      signOptions: { expiresIn: '30m' }, // adjust
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, UsersService],
  exports: [JwtModule],
})
export class AuthModule {}