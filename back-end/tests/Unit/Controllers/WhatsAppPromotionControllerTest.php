<?php

namespace Tests\Unit\Controllers;

use App\Http\Controllers\WhatsAppPromotionController;
use App\Services\WhatsAppService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class WhatsAppPromotionControllerTest extends TestCase
{
    use RefreshDatabase;

    private WhatsAppPromotionController $controller;
    private WhatsAppService $whatsappServiceMock;

    protected function setUp(): void
    {
        parent::setUp();
        $this->whatsappServiceMock = $this->createMock(WhatsAppService::class);
        $this->controller = new WhatsAppPromotionController($this->whatsappServiceMock);
    }

    public function test_send_promotion_validates_required_message(): void
    {
        $request = new Request([]);
        $response = $this->controller->sendPromotion($request);

        $this->assertEquals(422, $response->getStatusCode());
        $this->assertStringContainsString('message', $response->getContent());
    }

    public function test_send_update_validates_required_message(): void
    {
        $request = new Request([]);
        $response = $this->controller->sendUpdate($request);

        $this->assertEquals(422, $response->getStatusCode());
        $this->assertStringContainsString('message', $response->getContent());
    }

    public function test_get_consent_stats_returns_json_structure(): void
    {
        $response = $this->controller->getConsentStats();

        $this->assertEquals(200, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('total_usuarios', $data);
        $this->assertArrayHasKey('con_consentimiento', $data);
        $this->assertArrayHasKey('sin_consentimiento', $data);
        $this->assertArrayHasKey('porcentaje_consentimientco', $data);
    }
}
