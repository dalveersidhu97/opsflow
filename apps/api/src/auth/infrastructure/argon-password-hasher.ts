import argon2 from "argon2";
import type { PasswordHasher } from "../application/password-hasher.js";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ArgonPasswordHasher implements PasswordHasher {
    async hash(plainPassword: string): Promise<string> {
        return argon2.hash(plainPassword, {
            type: argon2.argon2id
        });
    };
    async verify(plainPassword: string, passwordHash: string): Promise<boolean> {
        return await argon2.verify(passwordHash, plainPassword);
    }
}