import { Injectable } from "@nestjs/common";
import { PostgresDatabase } from "../../database/postgres-database.js";
import { CreateRegistrationInput, RegistrationRepository, RegistrationResult } from "../application/registration-repository.js";

interface RegisteredUserRow {
    id: string;
    email: string;
}

interface RegisteredOrganizationRow {
    id: string;
    organization_name: string;
}

interface MembershipRow {
    user_role: 'OWNER';
}

@Injectable()
export class PostgresRegistrationRepository implements RegistrationRepository {

    constructor(
        private readonly database: PostgresDatabase,
    ) { }

    async createRegistration(input: CreateRegistrationInput): Promise<RegistrationResult> {

        const client = await this.database.getPoolClient();

        try {
            await client.query('BEGIN');

            const userResult = await client.query<RegisteredUserRow>(
                `INSERT INTO users (id, email, password_hash)
                    VALUES ($1, $2, $3)
                    RETURNING id, email
                `,
                [input.userId, input.email, input.passwordHash],
            );

            const organizationResult = await client.query<RegisteredOrganizationRow>(
                `INSERT INTO organizations (id, organization_name)
                    VALUES ($1, $2)
                    RETURNING id, organization_name
                `,
                [input.organizationId, input.organizationName],
            );

            const organizationMembershipResult = await client.query<MembershipRow>(
                `INSERT INTO organization_memberships (organization_id, user_id, user_role)
                    VALUES ($1, $2, $3)
                    RETURNING organization_id, user_id, user_role
                `,
                [input.organizationId, input.userId, input.role],
            );

            const organization = organizationResult.rows[0];
            const user = userResult.rows[0];
            const organizationMembership = organizationMembershipResult.rows[0];
            const result = {
                organization: {
                    id: organization.id as string,
                    name: organization.organization_name as string
                },
                role: organizationMembership.user_role,
                user: {
                    id: user.id as string,
                    email: user.email as string,
                }
            };

            await client.query('COMMIT');

            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}