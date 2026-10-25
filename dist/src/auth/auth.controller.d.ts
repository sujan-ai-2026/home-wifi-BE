import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        accessToken: string;
        tokenType: string;
        user: {
            id: string;
            username: string;
            role: string;
        };
    }>;
    getProfile(user: AuthenticatedUser): Promise<{
        id: string;
        username: string;
        role: string;
        createdAt: Date;
    }>;
    changePassword(user: AuthenticatedUser, dto: ChangePasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
