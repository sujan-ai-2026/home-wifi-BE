import { PushService } from './push.service';
import { PushSubscriptionDto, UnsubscribeDto } from './dto/push-subscription.dto';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
export declare class PushController {
    private readonly pushService;
    constructor(pushService: PushService);
    getStatus(): {
        configured: boolean;
        publicKey: string | null;
    };
    subscribe(dto: PushSubscriptionDto, user?: AuthenticatedUser): Promise<{
        success: boolean;
        message: string;
    }>;
    unsubscribe(dto: UnsubscribeDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
