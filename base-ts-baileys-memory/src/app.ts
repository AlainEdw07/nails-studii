import * as dotenv from 'dotenv'
import { join } from 'path'
import { createBot, createProvider, createFlow, addKeyword, utils } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { ChatbotApiService } from './services/chatbotApi.js'

dotenv.config()

const PORT = process.env.PORT ?? 3008
const LARAVEL_API_URL = process.env.LARAVEL_API_URL

if (!LARAVEL_API_URL) {
    throw new Error('LARAVEL_API_URL no está definido. Copia .env.example a .env y configura la URL del backend en el proyecto de WhatsApp.')
}

const chatbotApi = new ChatbotApiService(LARAVEL_API_URL)

let chatbotData: { preguntas: any[]; servicios: any[]; horarios_disponibles: any[] } | null = null

const findQuestion = (action: string) => {
    return chatbotData?.preguntas.find((item) => item.accion === action) ?? {
        pregunta: '',
        opciones_respuesta: [],
    }
}

const renderOptions = (options: any) => {
    if (!Array.isArray(options) || options.length === 0) {
        return ''
    }

    return options
        .map((option: any, index: number) => {
            const label = typeof option === 'string' ? option : option?.nombre ?? option?.label ?? JSON.stringify(option)
            return `${index + 1}. ${label}`
        })
        .join('\n')
}

const timeToMinutes = (time: string) => {
    const parts = time.split(':').map((s) => parseInt(s, 10))
    if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null
    return parts[0] * 60 + parts[1]
}

const parseDateInput = (value: string) => {
    if (!value || typeof value !== 'string') return null
    const normalized = value.trim().replace(/\s+/g, ' ')
    let date: Date | null = null
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
        date = new Date(normalized)
    }
    else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(normalized)) {
        const [day, month, year] = normalized.split('/')
        date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`)
    }
    else {
        date = new Date(normalized)
    }

    if (!date || Number.isNaN(date.getTime())) return null
    return date
}

const formatDateInput = (value: string) => {
    const date = parseDateInput(value)
    if (!date) return null
    return date.toISOString().split('T')[0]
}

const isDateInFutureOrToday = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date.getTime() >= today.getTime()
}

const normalizeTimeInput = (value: string) => {
    if (!value || typeof value !== 'string') return null
    const trimmed = value.trim()
    const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(trimmed)
    return match ? `${match[1].padStart(2, '0')}:${match[2]}` : null
}

const isValidPhoneNumber = (value: string) => {
    if (!value || typeof value !== 'string') return false
    const digits = value.replace(/\D/g, '')
    return digits.length >= 7 && digits.length <= 15
}

const isValidName = (value: string) => {
    return typeof value === 'string' && value.trim().length >= 2
}

const createCitaFromState = async (state: any) => {
    const servicioState = state.get('servicio')
    const fecha = state.get('fecha')
    const hora = state.get('hora')
    const nombre = state.get('nombre')
    const telefono = state.get('telefono')
    const notas = state.get('notas') || ''

    // Determine servicio_id from chatbotData if possible
    let servicio_id = null
    // Prefer servicio_id already stored in state
    const existingId = state.get && state.get('servicio_id')
    if (existingId) {
        servicio_id = existingId
    }
    if (chatbotData) {
        const servicios = chatbotData.servicios
        if (typeof servicioState === 'string' && servicioState.match(/^\d+$/)) {
            const idx = parseInt(servicioState, 10) - 1
            if (servicios[idx]) servicio_id = servicios[idx].id
        }
        if (!servicio_id) {
            const found = servicios.find((s: any) => s.nombre?.toLowerCase() === (servicioState || '').toLowerCase())
            if (found) servicio_id = found.id
        }
    }

    // Fetch latest horarios disponibles and validate selected fecha/hora if provided
    try {
        const resp = await fetch(`${LARAVEL_API_URL}/horarios/disponibles`)
        if (!resp.ok) {
            return `Error al verificar horarios: código ${resp.status}`
        }
        const json = await resp.json()
        const horarios = json.horarios_disponibles ?? json

        // try to parse fecha to weekday in Spanish
        let weekday = null
        const parsed = new Date(fecha)
        if (!Number.isNaN(parsed.getTime())) {
            weekday = parsed.toLocaleDateString('es-ES', { weekday: 'long' })
            // Capitalize first letter to match DB values (e.g., 'Lunes')
            weekday = weekday.charAt(0).toUpperCase() + weekday.slice(1)
        }

        if (weekday && hora) {
            const horaMin = timeToMinutes(hora)
            if (horaMin === null) {
                return 'Formato de hora inválido. Usa HH:MM.'
            }
            const match = horarios.find((h: any) => {
                if (h.dia_semana !== weekday) return false
                const start = timeToMinutes(h.hora_inicio)
                const end = timeToMinutes(h.hora_fin)
                return start !== null && end !== null && horaMin >= start && horaMin < end
            })
            if (!match) {
                return 'El horario seleccionado no está disponible. Por favor elige otra fecha u hora.'
            }
        }
    } catch (e) {
        return `No se pudo verificar horarios: ${e}`
    }

    // Build payload and create cita
    const payload: any = {
        nombre_cliente: nombre || '',
        telefono: telefono || '',
        servicio_id: servicio_id,
        fecha_cita: fecha || '',
        hora_cita: hora || '',
        notas_adicionales: notas || '',
    }

    try {
        const createResp = await fetch(`${LARAVEL_API_URL}/citas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(payload),
        })

        if (!createResp.ok) {
            const errText = await createResp.text()
            return `Error al crear la cita: ${createResp.status} ${errText}`
        }

        const created = await createResp.json()
        return `✅ Cita creada correctamente. ID: ${created.cita?.id ?? created.id ?? ''}`
    } catch (e) {
        return `Error al crear la cita: ${e}`
    }
}

const buildChatbotFlows = () => {
    if (!chatbotData) {
        const fallbackMenu = addKeyword<Provider, Database>(['hi', 'hello', 'hola', 'menu'])
            .addAnswer('No se pudo cargar la configuración del chatbot desde el servidor.')
            .addAnswer('Escribe *recargar* para intentar recargar los datos desde la API o contacta al administrador.')

        return [fallbackMenu]
    }

    const menuQuestion = findQuestion('menu_principal')
    const servicesQuestion = findQuestion('listar_servicios')
    const pricesQuestion = findQuestion('mostrar_precios')
    const scheduleQuestion = findQuestion('mostrar_horarios')
    const availabilityQuestion = findQuestion('consultar_disponibilidad')
    const advisorQuestion = findQuestion('derivar_whatsapp')

    const serviceSelectionFlow = addKeyword<Provider, Database>(['servicios', 'servicio', 'catalogo', 'catálogo', utils.setEvent('SERVICE_SELECTION')])
        .addAnswer(`${servicesQuestion.pregunta ?? 'Aquí está nuestro catálogo de servicios:'}\n\n${chatbotData!.servicios && chatbotData!.servicios.length ? renderOptions(chatbotData!.servicios.map((s: any) => ({ nombre: `${s.nombre}: ${s.descripcion ?? ''} (Precio: $${s.precio ?? 'N/A'})` }))) : 'No hay servicios disponibles en este momento.'}`)

    const priceFlow = addKeyword<Provider, Database>(['precios', 'precio', 'costo', 'costos', utils.setEvent('PRICE_FLOW')])
        .addAnswer(`${pricesQuestion.pregunta ?? 'Precios aproximados:'}\n\n${chatbotData!.servicios && chatbotData!.servicios.length ? renderOptions(chatbotData!.servicios.map((s: any) => ({ nombre: `${s.nombre}: $${s.precio ?? 'A consultar'}` }))) : 'Consultar directamente con un asesor.'}`)

    const scheduleFlow = addKeyword<Provider, Database>(['horarios', 'horario', 'mostrar horarios', utils.setEvent('SCHEDULE_FLOW')])
        .addAnswer(`${scheduleQuestion.pregunta ?? 'Nuestros horarios de atención son:'}\n\n${chatbotData!.horarios_disponibles && chatbotData!.horarios_disponibles.length ? renderOptions(chatbotData!.horarios_disponibles.map((h: any) => ({ nombre: `${h.dia_semana}: ${h.hora_inicio} - ${h.hora_fin}` }))) : 'Atendemos de Lunes a Sábado de 9:00 AM a 7:00 PM.'}`)

    const availabilityFlow = addKeyword<Provider, Database>(['disponibilidad', 'disponible', utils.setEvent('AVAILABILITY_FLOW')])
        .addAnswer(availabilityQuestion.pregunta ?? 'Mantenemos atención general en nuestros horarios establecidos. Si deseas confirmar un horario específico, escríbenos para derivarte con un asesor.')

    const advisorFlow = addKeyword<Provider, Database>(['asesor', 'whatsapp', 'humano', 'ayuda', utils.setEvent('ADVISOR_FLOW')])
        .addAnswer(advisorQuestion.pregunta ?? 'Un asesor se pondrá en contacto contigo a la brevedad. Por favor déjanos tu duda.')

    const mainMenuFlow = addKeyword<Provider, Database>(['hi', 'hello', 'hola', 'menu', 'menú'])
        .addAnswer(menuQuestion.pregunta ?? '¡Hola! ¿En qué puedo ayudarte hoy?')
        .addAnswer(renderOptions(menuQuestion.opciones_respuesta ?? [
            'Catálogo de servicios',
            'Precios aproximados',
            'Horarios disponibles',
            'Consulta de disponibilidad general',
            'Derivar atención a WhatsApp'
        ]), { capture: true }, async (ctx, { gotoFlow, fallBack }) => {
            const text = ctx.body.toLowerCase()
            if (text.includes('servicio') || text.includes('catalogo') || text.includes('catálogo') || text.startsWith('1')) {
                return gotoFlow(serviceSelectionFlow)
            }
            if (text.includes('precio') || text.startsWith('2')) {
                return gotoFlow(priceFlow)
            }
            if (text.includes('horario') || text.startsWith('3')) {
                return gotoFlow(scheduleFlow)
            }
            if (text.includes('disponibil') || text.startsWith('4')) {
                return gotoFlow(availabilityFlow)
            }
            if (text.includes('asesor') || text.includes('whatsapp') || text.startsWith('5')) {
                return gotoFlow(advisorFlow)
            }
            return fallBack('No entendí tu opción. Por favor elige una opción del menú (1-5).')
        })

    return [mainMenuFlow, serviceSelectionFlow, priceFlow, scheduleFlow, availabilityFlow, advisorFlow]
}

const loadChatbotData = async () => {
    try {
        const data = await chatbotApi.getChatbotData()
        chatbotData = data
        console.log('Chatbot API data loaded', {
            url: `${LARAVEL_API_URL}/chatbot/preguntas`,
            preguntas: data.preguntas.length,
            servicios: data.servicios.length,
            horarios_disponibles: data.horarios_disponibles.length,
        })
        return data
    } catch (error) {
        console.warn('No se pudo cargar la configuración del chatbot desde la API:', error)
        console.warn('URL usada:', `${LARAVEL_API_URL}/chatbot/preguntas`)
        return null
    }
}

const discordFlow = addKeyword<Provider, Database>('doc').addAnswer(
    ['You can see the documentation here', '📄 https://builderbot.app/docs \n', 'Do you want to continue? *yes*'].join(
        '\n'
    ),
    { capture: true },
    async (ctx, { gotoFlow, flowDynamic }) => {
        if (ctx.body.toLocaleLowerCase().includes('yes')) {
            return gotoFlow(registerFlow)
        }
        await flowDynamic('Thanks!')
        return
    }
)

const welcomeFlow = addKeyword<Provider, Database>(['doc', 'help'])
    .addAnswer(`🙌 Hello welcome to this *Chatbot*`)
    .addAnswer(
        [
            'I share with you the following links of interest about the project',
            '👉 *doc* to view the documentation',
        ].join('\n'),
        { delay: 800, capture: true },
        async (ctx, { fallBack }) => {
            if (!ctx.body.toLocaleLowerCase().includes('doc')) {
                return fallBack('You should type *doc*')
            }
            return
        },
        [discordFlow]
    )

const registerFlow = addKeyword<Provider, Database>(utils.setEvent('REGISTER_FLOW'))
    .addAnswer(`What is your name?`, { capture: true }, async (ctx, { state }) => {
        await state.update({ name: ctx.body })
    })
    .addAnswer('What is your age?', { capture: true }, async (ctx, { state }) => {
        await state.update({ age: ctx.body })
    })
    .addAction(async (_, { flowDynamic, state }) => {
        await flowDynamic(`${state.get('name')}, thanks for your information!: Your age: ${state.get('age')}`)
    })

const fullSamplesFlow = addKeyword<Provider, Database>(['samples', utils.setEvent('SAMPLES')])
    .addAnswer(`💪 I'll send you a lot files...`)
    .addAnswer(`Send image from Local`, { media: join(process.cwd(), 'assets', 'sample.png') })
    .addAnswer(`Send video from URL`, {
        media: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYTJ0ZGdjd2syeXAwMjQ4aWdkcW04OWlqcXI3Ynh1ODkwZ25zZWZ1dCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/LCohAb657pSdHv0Q5h/giphy.mp4',
    })
    .addAnswer(`Send audio from URL`, { media: 'https://cdn.freesound.org/previews/728/728142_11861866-lq.mp3' })
    .addAnswer(`Send file from URL`, {
        media: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    })

const reloadFlow = addKeyword<Provider, Database>(['recargar', 'reload'])
    .addAnswer('Intentando recargar la configuración del chatbot desde la API...', {}, async (_, { flowDynamic }) => {
        const data = await loadChatbotData()
        if (!data) {
            await flowDynamic('No se pudo recargar. Verifica que `LARAVEL_API_URL` sea accesible y que el backend esté en ejecución.')
            return
        }

        await flowDynamic(`Recargado correctamente. Servicios: ${data.servicios.length}, horarios: ${data.horarios_disponibles.length}`)
    })

const fetchLatestWaVersion = async (): Promise<[number, number, number]> => {
    try {
        const response = await fetch('https://raw.githubusercontent.com/WhiskeySockets/Baileys/master/src/Defaults/baileys-version.json')
        if (response.ok) {
            const data = (await response.json()) as { version?: [number, number, number] }
            if (Array.isArray(data.version) && data.version.length === 3) {
                return data.version
            }
        }
    } catch {
        // Fallback en caso de que no haya conexión a internet al obtener la versión
    }
    return [2, 3000, 1043857760]
}

const main = async () => {
    await loadChatbotData()
    const dynamicFlows = buildChatbotFlows()
    const adapterFlow = createFlow([welcomeFlow, registerFlow, fullSamplesFlow, reloadFlow, ...dynamicFlows])

    const waVersion = await fetchLatestWaVersion()
    console.log(`[BuilderBot] Iniciando con versión de WhatsApp Web: ${waVersion.join('.')}`)

    const adapterProvider = createProvider(Provider, {
        version: waVersion,
    })
    const adapterDB = new Database()

    const { handleCtx, httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    adapterProvider.server.post(
        '/v1/messages',
        handleCtx(async (bot, req, res) => {
            const { number, message, urlMedia } = req.body
            await bot.sendMessage(number, message, { media: urlMedia ?? null })
            return res.end('sended')
        })
    )

    adapterProvider.server.post(
        '/v1/register',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('REGISTER_FLOW', { from: number, name })
            return res.end('trigger')
        })
    )

    adapterProvider.server.post(
        '/v1/samples',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('SAMPLES', { from: number, name })
            return res.end('trigger')
        })
    )

    adapterProvider.server.post(
        '/v1/blacklist',
        handleCtx(async (bot, req, res) => {
            const { number, intent } = req.body
            if (intent === 'remove') bot.blacklist.remove(number)
            if (intent === 'add') bot.blacklist.add(number)

            res.writeHead(200, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ status: 'ok', number, intent }))
        })
    )

    adapterProvider.server.get(
        '/v1/blacklist/list',
        handleCtx(async (bot, req, res) => {
            const blacklist = bot.blacklist.getList()
            res.writeHead(200, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ status: 'ok', blacklist }))
        })
    )

    httpServer(+PORT)
}

main()
