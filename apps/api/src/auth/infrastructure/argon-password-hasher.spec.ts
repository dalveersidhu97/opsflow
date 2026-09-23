import argon2 from "argon2";
import { ArgonPasswordHasher } from "./argon-password-hasher.js";

describe('ArgonPasswordHasher', async () => {
    it('hashed password is different from original password', async () => {
        const password = 'Some@Password124';
        const hasher = new ArgonPasswordHasher();
        const hashedPassword = await hasher.hash(password);
        expect(password).not.toBe(hashedPassword);
    });
    it('hashed password can be verified with exactly original password only', async () => {
        const password = 'Some@Password124';
        const differentPassword = 'SomeOther@Password124';
        const hasher = new ArgonPasswordHasher();
        const hashedPassword = await hasher.hash(password);
        const isVerifiedOriginalPassword = await argon2.verify(hashedPassword, password);
        const isVerifiedDiffPassword = await argon2.verify(hashedPassword, differentPassword);
        expect(isVerifiedOriginalPassword).toBe(true);
        expect(isVerifiedDiffPassword).toBe(false);
    });
    it('hasher does not trim spaces before hashing', async () => {
        const password = ' Some@Password124 ';
        const hasher = new ArgonPasswordHasher();
        const hashedPassword = await hasher.hash(password);
        expect(await argon2.verify(hashedPassword, password)).toBe(true);
        expect(await argon2.verify(hashedPassword, password.trim())).toBe(false);
    });
});