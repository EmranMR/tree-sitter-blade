module.exports = grammar({
    name: 'blade',

    rules: {
        program: ($) => repeat($._definition),
        _definition: ($) => choice($.body),
        body: ($) => /[a-z]+/,
    },
})
