import argon2 from "argon2";
import { PasswordHasher } from "../application/password-hasher.js";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ArgonPasswordHasher implements PasswordHasher {
    async hash(plainPassword: string): Promise<string> {
        return argon2.hash(plainPassword, {
            type: argon2.argon2id
        });
    };
}