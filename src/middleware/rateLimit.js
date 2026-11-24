const rateLimit = require('express-rate-limit');

const baseOpts = {
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
};

const orderLookupLimiter = rateLimit({
    ...baseOpts,
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: { error: 'Too many order lookup requests, please try again in a minute.' },
});

const checkoutLimiter = rateLimit({
    ...baseOpts,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15,
    message: { error: 'Too many checkout attempts. Please wait a few minutes and try again.' },
});

const contactLimiter = rateLimit({
    ...baseOpts,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: { error: 'Too many contact messages submitted. Please wait 15 minutes before trying again.' },
});

const newsletterLimiter = rateLimit({
    ...baseOpts,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { error: 'Too many subscription attempts. Please try again shortly.' },
});

const measurementLimiter = rateLimit({
    ...baseOpts,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { error: 'Too many measurement submissions. Please try again shortly.' },
});

const generalApiLimiter = rateLimit({
    ...baseOpts,
    windowMs: 60 * 1000, // 1 minute
    max: 200,
    message: { error: 'Too many requests, please slow down.' },
});

module.exports = {
    orderLookupLimiter,
    checkoutLimiter,
    contactLimiter,
    newsletterLimiter,
    measurementLimiter,
    generalApiLimiter,
};
