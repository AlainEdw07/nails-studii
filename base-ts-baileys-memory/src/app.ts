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
    const scheduleQuestion = findQuestion('mostrar_horarios')
    const requestServiceQuestion = findQuestion('pedir_servicio')
    const requestDateQuestion = findQuestion('pedir_fecha')
    const requestTimeQuestion = findQuestion('pedir_hora')
    const requestNameQuestion = findQuestion('pedir_nombre')
    const requestPhoneQuestion = findQuestion('pedir_telefono')
    const requestNotesQuestion = findQuestion('pedir_notas')
    const confirmQuestion = findQuestion('confirmacion_cita')

    const serviceSelectionFlow = addKeyword<Provider, Database>(['servicios', 'servicio', 'agendar', 'cita', utils.setEvent('SERVICE_SELECTION')])
        .addAnswer(`${servicesQuestion.pregunta}\n\n${chatbotData!.servicios && chatbotData!.servicios.length ? renderOptions(chatbotData!.servicios) : 'No hay servicios disponibles en este momento. Escribe *recargar* para intentar obtenerlos nuevamente.'}`, { capture: true }, async (ctx, { state, gotoFlow, flowDynamic }) => {
            const body = (ctx.body || '').toString().trim()
            const servicios = chatbotData!.servicios
            if (/^\d+$/.test(body)) {
                const idx = parseInt(body, 10) - 1
                if (servicios[idx]) {
                    await state.update({ servicio: servicios[idx].nombre, servicio_id: servicios[idx].id })
                    return gotoFlow(dateFlow)
                }
            }

            const found = servicios.find((s: any) => s.nombre?.toLowerCase() === body.toLowerCase())
            if (found) {
                await state.update({ servicio: found.nombre, servicio_id: found.id })
                return gotoFlow(dateFlow)
            }

            await flowDynamic('No entendí el servicio seleccionado. Escribe el número o el nombre del servicio que deseas.')
            return gotoFlow(serviceSelectionFlow)
        })

    const dateFlow = addKeyword<Provider, Database>(utils.setEvent('REQUEST_DATE'))
        .addAnswer(requestDateQuestion.pregunta, { capture: true }, async (ctx, { state, gotoFlow, flowDynamic }) => {
            const fechaRaw = (ctx.body || '').toString().trim()
            const fechaValid = formatDateInput(fechaRaw)
            const parsedDate = fechaValid ? parseDateInput(fechaRaw) : null
            if (!fechaValid || !parsedDate || !isDateInFutureOrToday(parsedDate)) {
                await flowDynamic('La fecha ingresada no es válida. Por favor ingresa una fecha en formato YYYY-MM-DD o DD/MM/YYYY y que sea hoy o una fecha futura.')
                return gotoFlow(dateFlow)
            }

            await state.update({ fecha: fechaValid })
            return gotoFlow(timeFlow)
        })

    const timeFlow = addKeyword<Provider, Database>(utils.setEvent('REQUEST_TIME'))
        .addAnswer(requestTimeQuestion.pregunta, { capture: true }, async (ctx, { state, gotoFlow, flowDynamic }) => {
            const horaRaw = (ctx.body || '').toString().trim()
            const horaValid = normalizeTimeInput(horaRaw)
            if (!horaValid) {
                await flowDynamic('La hora ingresada no es válida. Usa el formato HH:MM, por ejemplo 14:30.')
                return gotoFlow(timeFlow)
            }

            await state.update({ hora: horaValid })
            return gotoFlow(nameFlow)
        })

    const nameFlow = addKeyword<Provider, Database>(utils.setEvent('REQUEST_NAME'))
        .addAnswer(requestNameQuestion.pregunta, { capture: true }, async (ctx, { state, gotoFlow, flowDynamic }) => {
            const nombreRaw = (ctx.body || '').toString().trim()
            if (!isValidName(nombreRaw)) {
                await flowDynamic('Por favor ingresa tu nombre completo o un nombre válido para continuar.')
                return gotoFlow(nameFlow)
            }

            await state.update({ nombre: nombreRaw })
            return gotoFlow(phoneFlow)
        })

    const phoneFlow = addKeyword<Provider, Database>(utils.setEvent('REQUEST_PHONE'))
        .addAnswer(requestPhoneQuestion.pregunta, { capture: true }, async (ctx, { state, gotoFlow, flowDynamic }) => {
            const telefonoRaw = (ctx.body || '').toString().trim()
            if (!isValidPhoneNumber(telefonoRaw)) {
                await flowDynamic('El teléfono ingresado no es válido. Por favor usa solo números y opcionalmente un +, por ejemplo +573001234567.')
                return gotoFlow(phoneFlow)
            }

            await state.update({ telefono: telefonoRaw })
            return gotoFlow(notesFlow)
        })

    const notesFlow = addKeyword<Provider, Database>(utils.setEvent('REQUEST_NOTES'))
        .addAnswer(requestNotesQuestion.pregunta)
        .addAnswer(renderOptions(requestNotesQuestion.opciones_respuesta), { capture: true }, async (ctx, { state, gotoFlow }) => {
            const answer = ctx.body.toLowerCase()
            if (answer.includes('no') || answer.startsWith('1')) {
                await state.update({ notas: '' })
                return gotoFlow(confirmFlow)
            }

            if (answer.includes('sí') || answer.includes('si') || answer.startsWith('2')) {
                return gotoFlow(notesTextFlow)
            }

            return gotoFlow(notesTextFlow)
        })

    const notesTextFlow = addKeyword<Provider, Database>(utils.setEvent('NOTES_TEXT'))
        .addAnswer('Escribe tus notas adicionales para la cita.', { capture: true }, async (ctx, { state, gotoFlow }) => {
            await state.update({ notas: ctx.body })
            return gotoFlow(confirmFlow)
        })

    const confirmFlow = addKeyword<Provider, Database>(utils.setEvent('CONFIRM_CITA'))
        .addAnswer(confirmQuestion.pregunta, {}, async (_, { flowDynamic, state }) => {
            const service = state.get('servicio') || 'un servicio'
            const fecha = state.get('fecha') || 'una fecha'
            const hora = state.get('hora') || 'una hora'
            const nombre = state.get('nombre') || 'un nombre'
            const telefono = state.get('telefono') || 'un teléfono'
            const notas = state.get('notas') || 'sin notas adicionales'

            await flowDynamic(`Resumen:\nServicio: ${service}\nFecha: ${fecha}\nHora: ${hora}\nNombre: ${nombre}\nTeléfono: ${telefono}\nNotas: ${notas}`)
        })
        .addAnswer(renderOptions(confirmQuestion.opciones_respuesta), { capture: true }, async (ctx, { gotoFlow, flowDynamic, state }) => {
            const answer = (ctx.body || '').toString().toLowerCase()
            if (answer.includes('resumen') || answer.startsWith('1')) {
                return gotoFlow(confirmFlow)
            }

            if (answer.includes('confirm') || answer.includes('confirmar') || answer.includes('sí') || answer.startsWith('2')) {
                await flowDynamic('Creando tu cita, un momento...')
                const result = await createCitaFromState(state)
                await flowDynamic(result)
                return gotoFlow(mainMenuFlow)
            }

            if (answer.includes('volver') || answer.startsWith('3')) {
                return gotoFlow(mainMenuFlow)
            }

            await flowDynamic('No entendí tu respuesta. Por favor responde con la opción correcta.')
            return gotoFlow(confirmFlow)
        })

    const scheduleFlow = addKeyword<Provider, Database>(['horarios', 'horario', 'mostrar horarios', 'mostrar horario', utils.setEvent('SCHEDULE_FLOW')])
        .addAnswer(`${scheduleQuestion.pregunta}\n\n${chatbotData!.horarios_disponibles && chatbotData!.horarios_disponibles.length ? renderOptions(chatbotData!.horarios_disponibles.map((horario) => ({ nombre: `${horario.dia_semana} ${horario.hora_inicio}-${horario.hora_fin}` }))) : 'No hay horarios disponibles en este momento. Escribe *recargar* para intentar obtenerlos nuevamente.'}`, { capture: true }, async (ctx, { gotoFlow, flowDynamic }) => {
            const text = (ctx.body || '').toString().trim().toLowerCase()
            const selectedIndex = /^\s*([0-9]+)\s*$/.exec(text)
            if (selectedIndex) {
                const idx = parseInt(selectedIndex[1], 10) - 1
                const horarios = chatbotData!.horarios_disponibles
                if (horarios[idx]) {
                    await flowDynamic(`Perfecto, seleccionaste ${horarios[idx].dia_semana} ${horarios[idx].hora_inicio}-${horarios[idx].hora_fin}. Ahora elige el servicio que deseas reservar.`)
                    return gotoFlow(serviceSelectionFlow)
                }
            }
            if (text.includes('agendar') || text.includes('cita') || text.startsWith('3')) {
                return gotoFlow(serviceSelectionFlow)
            }
            await flowDynamic('No entendí tu respuesta. Escribe el número del horario que prefieres o escribe "agendar" para iniciar una cita.')
            return gotoFlow(scheduleFlow)
        })

    const mainMenuFlow = addKeyword<Provider, Database>(['hi', 'hello', 'hola', 'menu', 'menú'])
        .addAnswer(menuQuestion.pregunta)
        .addAnswer(renderOptions(menuQuestion.opciones_respuesta), { capture: true }, async (ctx, { gotoFlow, fallBack }) => {
            const text = ctx.body.toLowerCase()
            if (text.includes('servicio') || text.includes('servicios') || text.startsWith('1')) {
                return gotoFlow(serviceSelectionFlow)
            }
            if (text.includes('horario') || text.includes('horarios') || text.startsWith('2')) {
                return gotoFlow(scheduleFlow)
            }
            if (text.includes('agendar') || text.includes('cita') || text.startsWith('3')) {
                return gotoFlow(serviceSelectionFlow)
            }
            if (text.includes('asesor') || text.includes('asesorar') || text.startsWith('4')) {
                await ctx.reply('Un asesor te atenderá pronto. Mientras tanto, puedes usar el menú principal escribiendo "menu".')
                return
            }
            return fallBack('No entendí tu opción, por favor elige servicios, horarios o agendar una cita.')
        })

    return [mainMenuFlow, serviceSelectionFlow, scheduleFlow, dateFlow, timeFlow, nameFlow, phoneFlow, notesFlow, notesTextFlow, confirmFlow]
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

const main = async () => {
    await loadChatbotData()
    const dynamicFlows = buildChatbotFlows()
    const adapterFlow = createFlow([welcomeFlow, registerFlow, fullSamplesFlow, reloadFlow, ...dynamicFlows])

    // If you experience ERRO AUTH issues, check the latest WhatsApp version at:
    // https://wppconnect.io/whatsapp-versions/
    // Example: version "2.3000.1035824857-alpha" -> [2, 3000, 1035824857]
    const adapterProvider = createProvider(Provider,
		{ version: [2, 3000, 1035824857] }
	)
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
