package com.nailsstudio.wear.presentation.cita

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nailsstudio.wear.data.model.CrearCitaRequest
import com.nailsstudio.wear.data.model.HorarioDisponible
import com.nailsstudio.wear.data.model.Servicio
import com.nailsstudio.wear.service.Endpoints
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.Locale

enum class PasoAgendarCita {
    CARGANDO,
    NOMBRE,
    TELEFONO,
    CORREO,
    SERVICIO,
    DIA,
    FECHA,
    HORA,
    CONFIRMACION,
    EXITO,
}

data class AgendarCitaUiState(
    val paso: PasoAgendarCita = PasoAgendarCita.CARGANDO,
    val horarios: List<HorarioDisponible> = emptyList(),
    val servicios: List<Servicio> = emptyList(),
    val nombreCliente: String = "",
    val telefono: String = "",
    val correo: String = "",
    val servicioSeleccionado: Servicio? = null,
    val horarioSeleccionado: HorarioDisponible? = null,
    val fechaSeleccionada: LocalDate? = null,
    val horaSeleccionada: String? = null,
    val fechasDisponibles: List<LocalDate> = emptyList(),
    val horasDisponibles: List<String> = emptyList(),
    val cargando: Boolean = false,
    val mensajeError: String? = null,
    val mensajeExito: String? = null,
)

class AgendarCitaViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(AgendarCitaUiState())
    val uiState: StateFlow<AgendarCitaUiState> = _uiState.asStateFlow()

    private val fechaFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
    private val fechaMostrarFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.forLanguageTag("es-MX"))
    private val emailRegex = Regex("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")

    init {
        cargarDatosIniciales()
    }

    fun cargarDatosIniciales() {
        viewModelScope.launch {
            _uiState.update { it.copy(paso = PasoAgendarCita.CARGANDO, cargando = true, mensajeError = null) }

            val horariosDeferred = async { Endpoints.obtenerHorariosDisponibles() }
            val serviciosDeferred = async { Endpoints.obtenerServicios() }

            val horariosResult = horariosDeferred.await()
            val serviciosResult = serviciosDeferred.await()

            val errorHorarios = horariosResult.exceptionOrNull()?.message
            val errorServicios = serviciosResult.exceptionOrNull()?.message
            val horarios = horariosResult.getOrDefault(emptyList())
            val servicios = serviciosResult.getOrDefault(emptyList())

            val mensajeError = when {
                errorHorarios != null && errorServicios != null ->
                    "Error al cargar horarios y servicios."
                errorHorarios != null -> errorHorarios
                errorServicios != null -> errorServicios
                horarios.isEmpty() -> "No hay horarios disponibles."
                servicios.isEmpty() -> "No hay servicios disponibles."
                else -> null
            }

            _uiState.update {
                it.copy(
                    paso = PasoAgendarCita.NOMBRE,
                    horarios = horarios,
                    servicios = servicios,
                    cargando = false,
                    mensajeError = mensajeError,
                )
            }
        }
    }

    fun actualizarNombre(nombre: String) {
        _uiState.update { it.copy(nombreCliente = nombre, mensajeError = null) }
    }

    fun actualizarTelefono(telefono: String) {
        _uiState.update { it.copy(telefono = telefono, mensajeError = null) }
    }

    fun actualizarCorreo(correo: String) {
        _uiState.update { it.copy(correo = correo, mensajeError = null) }
    }

    fun avanzarDesdeNombre() {
        val nombre = _uiState.value.nombreCliente.trim()
        if (nombre.isBlank()) {
            _uiState.update { it.copy(mensajeError = "El nombre es obligatorio.") }
            return
        }
        _uiState.update { it.copy(paso = PasoAgendarCita.TELEFONO, mensajeError = null) }
    }

    fun avanzarDesdeTelefono() {
        val telefono = _uiState.value.telefono.trim()
        if (telefono.isBlank()) {
            _uiState.update { it.copy(mensajeError = "El teléfono es obligatorio.") }
            return
        }
        _uiState.update { it.copy(paso = PasoAgendarCita.CORREO, mensajeError = null) }
    }

    fun avanzarDesdeCorreo() {
        val correo = _uiState.value.correo.trim()
        if (correo.isBlank()) {
            _uiState.update { it.copy(mensajeError = "El correo es obligatorio.") }
            return
        }
        if (!emailRegex.matches(correo)) {
            _uiState.update { it.copy(mensajeError = "El correo no es válido.") }
            return
        }
        if (_uiState.value.servicios.isEmpty()) {
            _uiState.update { it.copy(mensajeError = "No hay servicios disponibles.") }
            return
        }
        _uiState.update { it.copy(paso = PasoAgendarCita.SERVICIO, mensajeError = null) }
    }

    fun seleccionarServicio(servicio: Servicio) {
        _uiState.update {
            it.copy(
                servicioSeleccionado = servicio,
                paso = PasoAgendarCita.DIA,
                mensajeError = null,
            )
        }
    }

    fun seleccionarHorario(horario: HorarioDisponible) {
        val fechas = generarFechasParaDia(horario.diaSemana)
        _uiState.update {
            it.copy(
                horarioSeleccionado = horario,
                fechasDisponibles = fechas,
                fechaSeleccionada = null,
                horaSeleccionada = null,
                horasDisponibles = emptyList(),
                paso = PasoAgendarCita.FECHA,
                mensajeError = null,
            )
        }
    }

    fun seleccionarFecha(fecha: LocalDate) {
        val horario = _uiState.value.horarioSeleccionado ?: return
        val horas = generarHorasDisponibles(horario)
        _uiState.update {
            it.copy(
                fechaSeleccionada = fecha,
                horasDisponibles = horas,
                horaSeleccionada = null,
                paso = PasoAgendarCita.HORA,
                mensajeError = null,
            )
        }
    }

    fun seleccionarHora(hora: String) {
        _uiState.update {
            it.copy(
                horaSeleccionada = hora,
                paso = PasoAgendarCita.CONFIRMACION,
                mensajeError = null,
            )
        }
    }

    fun confirmarCita() {
        val state = _uiState.value
        val fecha = state.fechaSeleccionada ?: return
        val hora = state.horaSeleccionada ?: return
        val servicio = state.servicioSeleccionado ?: return

        viewModelScope.launch {
            _uiState.update { it.copy(cargando = true, mensajeError = null) }
            val request = CrearCitaRequest(
                nombreCliente = state.nombreCliente.trim(),
                telefono = state.telefono.trim(),
                correo = state.correo.trim(),
                servicioId = servicio.id.toInt(),
                fechaCita = fecha.format(fechaFormatter),
                horaCita = hora,
            )
            Endpoints.crearCita(request)
                .onSuccess { response ->
                    _uiState.update {
                        it.copy(
                            paso = PasoAgendarCita.EXITO,
                            cargando = false,
                            mensajeExito = response.mensaje,
                        )
                    }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            cargando = false,
                            mensajeError = error.message ?: "Error al crear la cita.",
                        )
                    }
                }
        }
    }

    fun retroceder() {
        _uiState.update { state ->
            val pasoAnterior = when (state.paso) {
                PasoAgendarCita.TELEFONO -> PasoAgendarCita.NOMBRE
                PasoAgendarCita.CORREO -> PasoAgendarCita.TELEFONO
                PasoAgendarCita.SERVICIO -> PasoAgendarCita.CORREO
                PasoAgendarCita.DIA -> PasoAgendarCita.SERVICIO
                PasoAgendarCita.FECHA -> PasoAgendarCita.DIA
                PasoAgendarCita.HORA -> PasoAgendarCita.FECHA
                PasoAgendarCita.CONFIRMACION -> PasoAgendarCita.HORA
                else -> state.paso
            }
            state.copy(paso = pasoAnterior, mensajeError = null)
        }
    }

    fun reiniciar() {
        _uiState.value = AgendarCitaUiState()
        cargarDatosIniciales()
    }

    fun formatearFecha(fecha: LocalDate): String = fecha.format(fechaMostrarFormatter)

    private fun generarFechasParaDia(diaSemana: String): List<LocalDate> {
        val dayOfWeek = diaSemanaADayOfWeek(diaSemana) ?: return emptyList()
        val hoy = LocalDate.now()
        val fechas = mutableListOf<LocalDate>()
        var fecha = hoy
        while (fechas.size < 4) {
            if (fecha.dayOfWeek == dayOfWeek && !fecha.isBefore(hoy)) {
                fechas.add(fecha)
            }
            fecha = fecha.plusDays(1)
            if (fecha.isAfter(hoy.plusWeeks(8))) break
        }
        return fechas
    }

    private fun generarHorasDisponibles(horario: HorarioDisponible): List<String> {
        val inicio = parseHora(horario.horaInicio) ?: return emptyList()
        val fin = parseHora(horario.horaFin) ?: return emptyList()
        val formatter = DateTimeFormatter.ofPattern("HH:mm")
        val horas = mutableListOf<String>()
        var hora = inicio
        while (hora.isBefore(fin)) {
            horas.add(hora.format(formatter))
            hora = hora.plusMinutes(30)
        }
        return horas
    }

    private fun parseHora(valor: String): LocalTime? {
        val limpio = valor.take(5)
        return runCatching { LocalTime.parse(limpio, DateTimeFormatter.ofPattern("HH:mm")) }.getOrNull()
    }

    private fun diaSemanaADayOfWeek(diaSemana: String): DayOfWeek? = when (diaSemana) {
        "Lunes" -> DayOfWeek.MONDAY
        "Martes" -> DayOfWeek.TUESDAY
        "Miércoles" -> DayOfWeek.WEDNESDAY
        "Jueves" -> DayOfWeek.THURSDAY
        "Viernes" -> DayOfWeek.FRIDAY
        "Sábado" -> DayOfWeek.SATURDAY
        "Domingo" -> DayOfWeek.SUNDAY
        else -> null
    }
}
