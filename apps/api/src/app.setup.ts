import {
    VERSION_NEUTRAL,
    VersioningType,
    type INestApplication,
} from '@nestjs/common';
import {
    DocumentBuilder,
    SwaggerModule,
    type OpenAPIObject,
} from '@nestjs/swagger';
import { createRequestValidationPipe } from './common/http/request-validation.pipe.js';

export function configureApp(
    app: INestApplication,
): void {
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: VERSION_NEUTRAL,
    });

    app.useGlobalPipes(
        createRequestValidationPipe(),
    );
}

export function createOpenApiDocument(
    app: INestApplication,
): OpenAPIObject {
    const config = new DocumentBuilder()
        .setTitle('OpsFlow API')
        .setDescription(
            'Operations and incident-management API',
        )
        .setVersion('1.0.0')
        .addTag(
            'incidents',
            'Report and manage operational incidents',
        )
        .build();

    return SwaggerModule.createDocument(
        app,
        config,
    );
}

export function configureOpenApi(
    app: INestApplication,
): void {
    SwaggerModule.setup(
        'docs',
        app,
        createOpenApiDocument(app),
    );
}