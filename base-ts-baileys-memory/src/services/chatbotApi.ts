export class ChatbotApiService {
    private readonly baseUrl: string

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl.replace(/\/+$/, '')
    }

    async getChatbotData(): Promise<{ preguntas: any[]; servicios: any[]; horarios_disponibles: any[] }> {
        const response = await fetch(`${this.baseUrl}/chatbot/preguntas?tipo=whatsapp`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            throw new Error(`Chatbot API responded with ${response.status}`)
        }

        const data = await response.json()
        return {
            preguntas: data.preguntas ?? [],
            servicios: data.servicios ?? [],
            horarios_disponibles: data.horarios_disponibles ?? [],
        }
    }
}
