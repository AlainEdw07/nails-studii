package com.nailsstudio.wear.presentation.cita

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.material.Button
import androidx.wear.compose.material.Chip
import androidx.wear.compose.material.CircularProgressIndicator
import androidx.wear.compose.material.ListHeader
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Text
import androidx.wear.compose.material.TimeText
import com.nailsstudio.wear.R
import com.nailsstudio.wear.data.model.HorarioDisponible
import com.nailsstudio.wear.data.model.Servicio
import com.nailsstudio.wear.presentation.theme.NailsWearTheme
import java.time.LocalDate

@Composable
fun AgendarCitaScreen(viewModel: AgendarCitaViewModel = viewModel()) {
    val uiState by viewModel.uiState.collectAsState()

    NailsWearTheme {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colors.background),
        ) {
            TimeText()
            when (uiState.paso) {
                PasoAgendarCita.CARGANDO -> CargandoContenido()
                PasoAgendarCita.NOMBRE -> PasoTexto(
                    titulo = stringResource(R.string.agendar_cita),
                    etiqueta = stringResource(R.string.nombre_cliente),
                    valor = uiState.nombreCliente,
                    error = uiState.mensajeError,
                    onValorChange = viewModel::actualizarNombre,
                    onContinuar = viewModel::avanzarDesdeNombre,
                )
                PasoAgendarCita.TELEFONO -> PasoTexto(
                    titulo = stringResource(R.string.telefono_cliente),
                    etiqueta = stringResource(R.string.telefono_cliente),
                    valor = uiState.telefono,
                    error = uiState.mensajeError,
                    teclado = KeyboardType.Phone,
                    onValorChange = viewModel::actualizarTelefono,
                    onContinuar = viewModel::avanzarDesdeTelefono,
                    onRetroceder = viewModel::retroceder,
                )
                PasoAgendarCita.CORREO -> PasoTexto(
                    titulo = stringResource(R.string.correo_cliente),
                    etiqueta = stringResource(R.string.correo_cliente),
                    valor = uiState.correo,
                    error = uiState.mensajeError,
                    teclado = KeyboardType.Email,
                    onValorChange = viewModel::actualizarCorreo,
                    onContinuar = viewModel::avanzarDesdeCorreo,
                    onRetroceder = viewModel::retroceder,
                )
                PasoAgendarCita.SERVICIO -> PasoServicio(
                    servicios = uiState.servicios,
                    onSeleccionar = viewModel::seleccionarServicio,
                    onRetroceder = viewModel::retroceder,
                )
                PasoAgendarCita.DIA -> PasoDia(
                    horarios = uiState.horarios,
                    onSeleccionar = viewModel::seleccionarHorario,
                    onRetroceder = viewModel::retroceder,
                )
                PasoAgendarCita.FECHA -> PasoFecha(
                    diaSemana = uiState.horarioSeleccionado?.diaSemana.orEmpty(),
                    fechas = uiState.fechasDisponibles,
                    formatearFecha = viewModel::formatearFecha,
                    onSeleccionar = viewModel::seleccionarFecha,
                    onRetroceder = viewModel::retroceder,
                )
                PasoAgendarCita.HORA -> PasoHora(
                    horas = uiState.horasDisponibles,
                    onSeleccionar = viewModel::seleccionarHora,
                    onRetroceder = viewModel::retroceder,
                )
                PasoAgendarCita.CONFIRMACION -> PasoConfirmacion(
                    nombre = uiState.nombreCliente,
                    telefono = uiState.telefono,
                    correo = uiState.correo,
                    servicio = uiState.servicioSeleccionado?.nombre.orEmpty(),
                    diaSemana = uiState.horarioSeleccionado?.diaSemana.orEmpty(),
                    fecha = uiState.fechaSeleccionada?.let(viewModel::formatearFecha).orEmpty(),
                    hora = uiState.horaSeleccionada.orEmpty(),
                    cargando = uiState.cargando,
                    error = uiState.mensajeError,
                    onConfirmar = viewModel::confirmarCita,
                    onRetroceder = viewModel::retroceder,
                )
                PasoAgendarCita.EXITO -> PasoExito(
                    mensaje = uiState.mensajeExito.orEmpty(),
                    onNuevaCita = viewModel::reiniciar,
                )
            }
        }
    }
}

@Composable
private fun CargandoContenido() {
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        CircularProgressIndicator()
        Text(
            text = stringResource(R.string.cargando_datos),
            modifier = Modifier.padding(top = 8.dp),
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun PasoTexto(
    titulo: String,
    etiqueta: String,
    valor: String,
    error: String?,
    teclado: KeyboardType = KeyboardType.Text,
    onValorChange: (String) -> Unit,
    onContinuar: () -> Unit,
    onRetroceder: (() -> Unit)? = null,
) {
    ScalingLazyColumn(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        item { ListHeader { Text(titulo) } }
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp),
            ) {
                Text(
                    text = etiqueta,
                    style = MaterialTheme.typography.caption1,
                )
                BasicTextField(
                    value = valor,
                    onValueChange = onValorChange,
                    textStyle = MaterialTheme.typography.body1.copy(
                        color = MaterialTheme.colors.onBackground,
                        textAlign = TextAlign.Center,
                    ),
                    keyboardOptions = KeyboardOptions(keyboardType = teclado),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    singleLine = true,
                )
            }
        }
        if (error != null) {
            item {
                Text(
                    text = error,
                    color = MaterialTheme.colors.error,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 8.dp),
                )
            }
        }
        item {
            Button(onClick = onContinuar, modifier = Modifier.padding(top = 4.dp)) {
                Text(stringResource(R.string.continuar))
            }
        }
        if (onRetroceder != null) {
            item {
                Button(onClick = onRetroceder) {
                    Text(stringResource(R.string.atras))
                }
            }
        }
    }
}

@Composable
private fun PasoServicio(
    servicios: List<Servicio>,
    onSeleccionar: (Servicio) -> Unit,
    onRetroceder: () -> Unit,
) {
    ScalingLazyColumn(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        item { ListHeader { Text(stringResource(R.string.selecciona_servicio)) } }
        items(servicios) { servicio ->
            Chip(
                onClick = { onSeleccionar(servicio) },
                label = {
                    Text(
                        text = "${servicio.nombre}\n$${servicio.precio}",
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth(),
                    )
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp),
            )
        }
        item {
            Button(onClick = onRetroceder) {
                Text(stringResource(R.string.atras))
            }
        }
    }
}

@Composable
private fun PasoDia(
    horarios: List<HorarioDisponible>,
    onSeleccionar: (HorarioDisponible) -> Unit,
    onRetroceder: () -> Unit,
) {
    ScalingLazyColumn(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        item { ListHeader { Text(stringResource(R.string.selecciona_dia)) } }
        items(horarios) { horario ->
            Chip(
                onClick = { onSeleccionar(horario) },
                label = {
                    Text(
                        text = "${horario.diaSemana}\n${formatearRangoHorario(horario)}",
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth(),
                    )
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp),
            )
        }
        item {
            Button(onClick = onRetroceder) {
                Text(stringResource(R.string.atras))
            }
        }
    }
}

@Composable
private fun PasoFecha(
    diaSemana: String,
    fechas: List<LocalDate>,
    formatearFecha: (LocalDate) -> String,
    onSeleccionar: (LocalDate) -> Unit,
    onRetroceder: () -> Unit,
) {
    ScalingLazyColumn(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        item { ListHeader { Text(stringResource(R.string.selecciona_fecha, diaSemana)) } }
        items(fechas) { fecha ->
            Chip(
                onClick = { onSeleccionar(fecha) },
                label = {
                    Text(
                        text = formatearFecha(fecha),
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth(),
                    )
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp),
            )
        }
        item {
            Button(onClick = onRetroceder) {
                Text(stringResource(R.string.atras))
            }
        }
    }
}

@Composable
private fun PasoHora(
    horas: List<String>,
    onSeleccionar: (String) -> Unit,
    onRetroceder: () -> Unit,
) {
    ScalingLazyColumn(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        item { ListHeader { Text(stringResource(R.string.selecciona_hora)) } }
        items(horas) { hora ->
            Chip(
                onClick = { onSeleccionar(hora) },
                label = {
                    Text(
                        text = hora,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth(),
                    )
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp),
            )
        }
        item {
            Button(onClick = onRetroceder) {
                Text(stringResource(R.string.atras))
            }
        }
    }
}

@Composable
private fun PasoConfirmacion(
    nombre: String,
    telefono: String,
    correo: String,
    servicio: String,
    diaSemana: String,
    fecha: String,
    hora: String,
    cargando: Boolean,
    error: String?,
    onConfirmar: () -> Unit,
    onRetroceder: () -> Unit,
) {
    ScalingLazyColumn(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        item { ListHeader { Text(stringResource(R.string.confirmar_cita)) } }
        item {
            Text(
                text = stringResource(
                    R.string.resumen_cita,
                    nombre,
                    telefono,
                    correo,
                    servicio,
                    diaSemana,
                    fecha,
                    hora,
                ),
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 12.dp),
            )
        }
        if (error != null) {
            item {
                Text(
                    text = error,
                    color = MaterialTheme.colors.error,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 8.dp),
                )
            }
        }
        item {
            Button(
                onClick = onConfirmar,
                enabled = !cargando,
                modifier = Modifier.padding(top = 4.dp),
            ) {
                if (cargando) {
                    CircularProgressIndicator()
                } else {
                    Text(stringResource(R.string.confirmar))
                }
            }
        }
        item {
            Button(onClick = onRetroceder, enabled = !cargando) {
                Text(stringResource(R.string.atras))
            }
        }
    }
}

@Composable
private fun PasoExito(mensaje: String, onNuevaCita: () -> Unit) {
    ScalingLazyColumn(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        item { ListHeader { Text(stringResource(R.string.cita_agendada)) } }
        item {
            Text(
                text = mensaje,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 12.dp),
            )
        }
        item {
            Button(onClick = onNuevaCita, modifier = Modifier.padding(top = 4.dp)) {
                Text(stringResource(R.string.nueva_cita))
            }
        }
    }
}

private fun formatearRangoHorario(horario: HorarioDisponible): String {
    val inicio = horario.horaInicio.take(5)
    val fin = horario.horaFin.take(5)
    return "$inicio - $fin"
}
