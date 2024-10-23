import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export async function rateLimit(identifier: string) {
    const rateLimit = new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(10, "3s"),
        analytics: true,
        prefix: "@upstash/ratelimit"
    });

    try {
        const result = await rateLimit.limit(identifier);
        return {
            success: true,
            remaining: result.remaining, // Include remaining requests if needed
            reset: result.reset, // Include reset time if needed
            // Add any other relevant fields from result here, excluding `success`
        };
    } catch (error) {
        console.error('Rate limit error:', error);
        return {
            success: false,
            message: 'An error occurred while checking rate limit',
        };
    }
}
