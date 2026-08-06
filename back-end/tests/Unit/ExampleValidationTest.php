<?php

use Illuminate\Support\Facades\Validator;

test('validation test example', function () {
    // Este es un ejemplo de prueba unitaria pura sin BD
    $validator = Validator::make(['correo' => 'invalid'], ['correo' => 'email']);
    expect($validator->fails())->toBeTrue();
});
