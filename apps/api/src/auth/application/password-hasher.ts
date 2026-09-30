export interface PasswordHasher {
    hash(plainPassword: string): Promise<string>;

    verify(
        plainPassword: string,
        passwordHash: string,
    ): Promise<boolean>;
}

export interface SessionTokenProvider {
    generate(): string;
    digest(rawToken: string): string;
}