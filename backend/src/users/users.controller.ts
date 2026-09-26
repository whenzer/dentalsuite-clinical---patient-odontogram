import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('api/v1/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('admin', 'dentist')
  async getAllUsers() {
    const users = await this.usersService.findAll();
    return users.map((u) => {
      const { passwordHash: _, refreshTokens: __, ...profile } = u;
      return profile;
    });
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    const { passwordHash: _, refreshTokens: __, ...profile } = user;
    return profile;
  }
}
