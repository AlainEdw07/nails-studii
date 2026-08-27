<?php

use Tests\TestCase;
use Illuminate\Support\Facades\Validator;

uses(TestCase::class);

test('validation test example', function () {
    $validator = Validator::make(['correo' => 'invalid'], ['correo' => 'email']);
    expect($validator->fails())->toBeTrue();
});
