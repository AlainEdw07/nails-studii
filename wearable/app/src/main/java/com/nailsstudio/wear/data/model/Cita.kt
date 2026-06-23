package com.nailsstudio.wear.data.model

import com.google.gson.annotations.SerializedName

data class CrearCitaRequest(
    @SerializedName("nombre_cliente") val nombreCliente: String,
    val telefono: String? = null,
    val correo: String? = null,
    @SerializedName("servicio_id") val servicioId: Int? = null,
    @SerializedName("fecha_cita") val fechaCita: String,
    @SerializedName("hora_cita") val horaCita: String,
    @SerializedName("notas_adicionales") val notasAdicionales: String? = null,
)

data class CrearCitaResponse(
    val mensaje: String,
    val cita: Cita?,
)

data class Cita(
    val id: Long,
    @SerializedName("nombre_cliente") val nombreCliente: String,
    @SerializedName("fecha_cita") val fechaCita: String,
    @SerializedName("hora_cita") val horaCita: String,
    val estado: String,
)

data class ApiErrorResponse(
    val mensaje: String?,
    val errores: Map<String, List<String>>?,
)
