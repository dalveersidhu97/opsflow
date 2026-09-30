import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import type { SessionTokenProvider } from '../application/password-hasher.js';

@Injectable()
export class CryptoSessionTokenProvider implements SessionTokenProvider {
    generate(): string {
        return randomBytes(32).toString('base64url');
    }

    digest(rawToken: string): string {
        return createHash('sha256')
            .update(rawToken, 'utf8')
            .digest('hex');
    }
}