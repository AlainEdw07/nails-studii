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

    // Flujo Interactivo de Agendamiento de Citas con selección por números
    const agendarCitaFlow = addKeyword<Provider, Database>(utils.setEvent('AGENDAR_CITA_FLOW'))
        // Paso 1: Seleccionar Servicio por Número
        .addAnswer('🌸 *Paso 1/4: Selecciona el servicio que deseas agendar:*', null, async (_, { state }) => {
            const existingId = state.get && state.get('servicio_id')
            if (!existingId) {
                await state.clear()
            }
        })
        .addAnswer(
            `${chatbotData!.servicios && chatbotData!.servicios.length ? renderOptions(chatbotData!.servicios.map((s: any) => ({ nombre: `${s.nombre} ($${s.precio ?? 'N/A'}) - ${s.duracion_estimada ?? '30-60 min'}` }))) : 'Sin servicios disponibles.'}\n\nEscribe el número del servicio deseado (ej. 1) o escribe *menú* para cancelar:`,
            { capture: true },
            async (ctx, { state, fallBack, gotoFlow }) => {
                const text = ctx.body.toLowerCase().trim()
                if (text === 'menu' || text === 'menú' || text === 'inicio') {
                    return gotoFlow(mainMenuFlow)
                }

                const index = parseInt(text, 10) - 1
                const servicios = chatbotData!.servicios
                if (!Number.isNaN(index) && servicios[index]) {
                    await state.update({
                        servicio_id: servicios[index].id,
                        servicio: servicios[index].nombre
                    })
                    return
                }

                return fallBack(`Por favor selecciona un número válido del 1 al ${servicios.length} o escribe *menú*.`)
            }
        )
        // Paso 2: Seleccionar Día / Horario por Número
        .addAnswer(
            '📅 *Paso 2/4: Selecciona el día y horario disponible:*',
            null
        )
        .addAnswer(
            `${chatbotData!.horarios_disponibles && chatbotData!.horarios_disponibles.length ? renderOptions(chatbotData!.horarios_disponibles.map((h: any) => ({ nombre: `${h.dia_semana}: ${h.hora_inicio} - ${h.hora_fin}` }))) : 'Atendemos de Lunes a Sábado de 09:00 AM a 07:00 PM.'}\n\nEscribe el número del horario deseado (ej. 1) o escribe *menú* para cancelar:`,
            { capture: true },
            async (ctx, { state, fallBack, gotoFlow }) => {
                const text = ctx.body.toLowerCase().trim()
                if (text === 'menu' || text === 'menú' || text === 'inicio') {
                    return gotoFlow(mainMenuFlow)
                }

                const index = parseInt(text, 10) - 1
                const horarios = chatbotData!.horarios_disponibles
                if (!Number.isNaN(index) && horarios[index]) {
                    await state.update({
                        dia_semana: horarios[index].dia_semana,
                        hora_inicio: horarios[index].hora_inicio
                    })
                    return
                }

                return fallBack(`Por favor selecciona un número válido del 1 al ${horarios.length} o escribe *menú*.`)
            }
        )
        // Paso 3: Ingresar Fecha específica
        .addAnswer(
            '🗓️ *Paso 3/4:* Ingresa la fecha para tu cita (formato YYYY-MM-DD o DD/MM/YYYY, ej. 2026-08-29):',
            { capture: true },
            async (ctx, { state, fallBack, gotoFlow }) => {
                const text = ctx.body.toLowerCase().trim()
                if (text === 'menu' || text === 'menú' || text === 'inicio') {
                    return gotoFlow(mainMenuFlow)
                }

                const formattedDate = formatDateInput(text)
                if (formattedDate) {
                    await state.update({ fecha: formattedDate })
                    return
                }

                return fallBack('Fecha no válida. Ingresa en formato YYYY-MM-DD (ej. 2026-08-29) o DD/MM/YYYY, o escribe *menú*.')
            }
        )
        // Paso 4: Ingresar Hora específica
        .addAnswer(
            '⏰ *Paso 4/4:* Ingresa la hora deseada (formato HH:MM, ej. 10:00 o 15:30):',
            { capture: true },
            async (ctx, { state, fallBack, gotoFlow }) => {
                const text = ctx.body.toLowerCase().trim()
                if (text === 'menu' || text === 'menú' || text === 'inicio') {
                    return gotoFlow(mainMenuFlow)
                }

                const normalizedTime = normalizeTimeInput(text)
                if (normalizedTime) {
                    await state.update({ hora: normalizedTime })
                    return
                }

                return fallBack('Hora no válida. Ingresa en formato HH:MM (ej. 10:30 o 16:00), o escribe *menú*.')
            }
        )
        // Nombre del cliente y creación
        .addAnswer(
            '👤 Por último, escribe tu nombre completo para registrar la cita:',
            { capture: true },
            async (ctx, { state, flowDynamic, gotoFlow, fallBack }) => {
                const text = ctx.body.trim()
                if (text.toLowerCase() === 'menu' || text.toLowerCase() === 'menú' || text.toLowerCase() === 'inicio') {
                    return gotoFlow(mainMenuFlow)
                }

                if (!isValidName(text)) {
                    return fallBack('Por favor ingresa un nombre válido (al menos 2 caracteres).')
                }

                await state.update({
                    nombre: text,
                    telefono: ctx.from
                })

                const resultMessage = await createCitaFromState(state)
                await flowDynamic(resultMessage)
                await flowDynamic('Escribe *menú* o *inicio* para regresar al menú principal en cualquier momento.')
            }
        )

    // Flujo de consulta de servicios
    const infoSelectionFlow = addKeyword<Provider, Database>(['informacion', 'información', 'servicios', 'servicio', 'catalogo', 'catálogo', utils.setEvent('INFO_SELECTION')])
        .addAnswer(`Te compartimos la información detallada de nuestros servicios disponibles:\n\n${chatbotData!.servicios && chatbotData!.servicios.length ? renderOptions(chatbotData!.servicios.map((s: any) => ({ nombre: `${s.nombre}: ${s.descripcion ?? ''} (Precio: $${s.precio ?? 'N/A'}, Duración: ${s.duracion_estimada ?? '30-60 min'})` }))) : 'No hay información de servicios disponible.'}`)
        .addAnswer('Escribe el número del servicio que deseas agendar (ej. 1) o escribe *menú* para volver al menú principal:', { capture: true }, async (ctx, { state, gotoFlow, fallBack }) => {
            const text = ctx.body.toLowerCase().trim()
            if (text === 'menu' || text === 'menú' || text === 'inicio') {
                return gotoFlow(mainMenuFlow)
            }
            const index = parseInt(text, 10) - 1
            const servicios = chatbotData!.servicios
            if (!Number.isNaN(index) && servicios[index]) {
                await state.clear()
                await state.update({
                    servicio_id: servicios[index].id,
                    servicio: servicios[index].nombre
                })
                return gotoFlow(agendarCitaFlow)
            }
            if (text.includes('cita') || text.includes('agendar')) {
                return gotoFlow(agendarCitaFlow)
            }
            return fallBack(`Escribe un número del 1 al ${servicios.length} para agendar o escribe *menú*.`)
        })

    // Flujo de cotizaciones / precios
    const quoteFlow = addKeyword<Provider, Database>(['cotizaciones', 'cotizacion', 'cotización', 'precios', 'precio', 'costo', 'costos', utils.setEvent('QUOTE_FLOW')])
        .addAnswer(`Cotizaciones y precios aproximados de nuestros servicios:\n\n${chatbotData!.servicios && chatbotData!.servicios.length ? renderOptions(chatbotData!.servicios.map((s: any) => ({ nombre: `${s.nombre}: $${s.precio ?? 'A cotizar'}` }))) : 'Consultar nuestros servicios disponibles.'}`)
        .addAnswer('Escribe el número del servicio para agendar tu cita (ej. 1) o escribe *menú* para volver:', { capture: true }, async (ctx, { state, gotoFlow, fallBack }) => {
            const text = ctx.body.toLowerCase().trim()
            if (text === 'menu' || text === 'menú' || text === 'inicio') {
                return gotoFlow(mainMenuFlow)
            }
            const index = parseInt(text, 10) - 1
            const servicios = chatbotData!.servicios
            if (!Number.isNaN(index) && servicios[index]) {
                await state.clear()
                await state.update({
                    servicio_id: servicios[index].id,
                    servicio: servicios[index].nombre
                })
                return gotoFlow(agendarCitaFlow)
            }
            if (text.includes('cita') || text.includes('agendar')) {
                return gotoFlow(agendarCitaFlow)
            }
            return fallBack(`Escribe un número del 1 al ${servicios.length} para agendar o escribe *menú*.`)
        })

    // Flujo directo de Citas (Menú opción 3)
    const citaFlow = addKeyword<Provider, Database>(['citas', 'cita', 'agendar', 'horarios', 'horario', utils.setEvent('CITA_FLOW')])
        .addAnswer('Formulario de Agendamiento de Citas', null, async (_, { gotoFlow }) => {
            return gotoFlow(agendarCitaFlow)
        })

    // Menú Principal
    const mainMenuFlow = addKeyword<Provider, Database>(['hi', 'hello', 'hola', 'menu', 'menú', 'inicio'])
        .addAnswer(menuQuestion.pregunta ?? '¡Hola! 🌸 Te saludamos de Nails Studii para dar seguimiento a tu solicitud de información, cotizaciones o citas. ¿En qué te podemos ayudar hoy?')
        .addAnswer(renderOptions(menuQuestion.opciones_respuesta ?? [
            'Solicitud de información de servicios',
            'Cotizaciones de servicios',
            'Agendar cita'
        ]), { capture: true }, async (ctx, { gotoFlow, fallBack }) => {
            const text = ctx.body.toLowerCase().trim()
            if (text.includes('informac') || text.includes('servicio') || text.includes('catalogo') || text.includes('catálogo') || text === '1' || text.startsWith('1.')) {
                return gotoFlow(infoSelectionFlow)
            }
            if (text.includes('cotiz') || text.includes('precio') || text === '2' || text.startsWith('2.')) {
                return gotoFlow(quoteFlow)
            }
            if (text.includes('cita') || text.includes('agendar') || text.includes('horario') || text === '3' || text.startsWith('3.')) {
                return gotoFlow(agendarCitaFlow)
            }
            if (text.includes('menu') || text.includes('menú') || text.includes('inicio')) {
                return gotoFlow(mainMenuFlow)
            }
            return fallBack('No entendí tu opción. Por favor elige una opción del menú (1, 2 o 3) o escribe *menú*.')
        })

    return [mainMenuFlow, infoSelectionFlow, quoteFlow, citaFlow, agendarCitaFlow]
}

const loadChatbotData = async () => {
    try {
        const data = await chatbotApi.getChatbotData()
        chatbotData = data
        console.log('Chatbot API data loaded', {
            url: `${LARAVEL_API_URL}/chatbot/preguntas?tipo=whatsapp`,
            preguntas: data.preguntas.length,
            servicios: data.servicios.length,
            horarios_disponibles: data.horarios_disponibles.length,
        })
        return data
    } catch (error) {
        console.warn('No se pudo cargar la configuración del chatbot desde la API:', error)
        console.warn('URL usada:', `${LARAVEL_API_URL}/chatbot/preguntas?tipo=whatsapp`)
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
