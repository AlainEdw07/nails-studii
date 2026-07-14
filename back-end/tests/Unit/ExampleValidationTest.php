<?php

test('validation test example', function () {
    // Este es un ejemplo de prueba unitaria pura sin BD
    $validator = validator(['correo' => 'invalid'], ['correo' => 'email']);
    expect($validator->fails())->toBeTrue();
});
