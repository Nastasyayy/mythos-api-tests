import { expect, test } from '../fixtures/api-test';
import { getMythologyList, type MythologyEntity } from '../../src/api/mythology';
import * as allure from 'allure-js-commons';
import type { StepContext } from 'allure-js-commons';

type MockExchange = {
    label: string;
    request: {
        body?: unknown;
        headers: Record<string, string>;
        method: string;
        url: string;
    };
    response: {
        body: unknown;
        headers?: Record<string, string>;
        status: number;
    };
};

const redactHeaders = (headers: Record<string, string>): Record<string, string> =>
    Object.fromEntries(
        Object.entries(headers).map(([key, value]) => [
            key,
            key.toLowerCase().includes('authorization') ? '***' : value,
        ]),
    );

const stringifyAttachment = (value: unknown): string => JSON.stringify(value, null, 2);

const readRequestBody = (rawBody: string | null): unknown => {
    if (!rawBody) {
        return undefined;
    }

    try {
        return JSON.parse(rawBody) as unknown;
    } catch {
        return rawBody;
    }
};

test(
    'Mocked mythology returns a synthetic "Mocked Hero"',
    { tag: '@mock' },
    async ({ page, baseURL }) => {
        const exchanges: MockExchange[] = [];

        await page.route('**/api/mythology', async (route) => {
            const request = route.request();
            expect(request.method()).toBe('GET');

            const responseBody = [{
                id: 999,
                name: 'Mocked Hero',
                category: 'heroes',
                desc: 'The "Mocked Hero" created by mock.',
                img: null,
            }];

            exchanges.push({
                label: 'Mock mythology returns the "Mocked Hero"',
                request: {
                    body: readRequestBody(request.postData()),
                    headers: redactHeaders(request.headers()),
                    method: request.method(),
                    url: request.url(),
                },
                response: {
                    body: responseBody,
                    headers: {
                        'access-control-allow-origin': '*',
                        'content-type': 'application/json',
                    },
                    status: 200,
                },
            });
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: {
                    'access-control-allow-origin': '*',
                },
                body: JSON.stringify(responseBody),
            });
        });


        const body = await test.step('Use mocked mythology entity', async () => {
            return await page.evaluate(async (url) => {
                const response = await fetch(url);
                return response.json() as Promise<MythologyEntity[]>;
            }, `${baseURL}/api/mythology`);
        });

        for (const exchange of exchanges) {
            await allure.step(`Mock API: ${exchange.label}`, async (stepContext: StepContext) => {
                await stepContext.parameter('method', exchange.request.method);
                await stepContext.parameter('url', exchange.request.url);
                await stepContext.parameter('status', String(exchange.response.status));
                await allure.attachment(
                    'request',
                    stringifyAttachment(exchange.request),
                    'application/json',
                );
                await allure.attachment(
                    'response',
                    stringifyAttachment(exchange.response),
                    'application/json',
                );
            });
        }

        // Checks
        expect(body).toContainEqual(expect.objectContaining({
            name: 'Mocked Hero'
        }));
        expect(body.length).toBe(1);
    }
);