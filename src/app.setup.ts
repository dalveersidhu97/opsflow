import {
    VERSION_NEUTRAL,
    VersioningType,
    type INestApplication,
} from '@nestjs/common';
import {
    DocumentBuilder,
    SwaggerModule,
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

export function configureOpenApi(
    app: INestApplication,
): void {
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

    const documentFactory = () =>
        SwaggerModule.createDocument(
            app,
            config,
        );

    SwaggerModule.setup(
        'docs',
        app,
        documentFactory,
    );
}