package com.nailsstudio.wear.data.model

import com.google.gson.annotations.SerializedName

data class Servicio(
    val id: Long,
    val nombre: String,
    val descripcion: String?,
    val precio: String,
    @SerializedName("duracion_estimada") val duracionEstimada: Int,
    @SerializedName("imagen_principal") val imagenPrincipal: String?,
    val estado: String,
)

data class ServiciosResponse(
    val servicios: List<Servicio>,
)
