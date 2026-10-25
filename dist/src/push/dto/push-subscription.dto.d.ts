export declare class PushSubscriptionKeysDto {
    p256dh: string;
    auth: string;
}
export declare class PushSubscriptionDto {
    endpoint: string;
    keys: PushSubscriptionKeysDto;
}
export declare class UnsubscribeDto {
    endpoint: string;
}
