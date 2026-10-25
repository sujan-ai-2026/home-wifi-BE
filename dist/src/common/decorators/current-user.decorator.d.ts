export interface AuthenticatedUser {
    userId: string;
    username: string;
    role: string;
}
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
