package com.nailsstudio.wear.data.model

import com.google.gson.annotations.SerializedName

data class HorarioDisponible(
    val id: Long,
    @SerializedName("dia_semana") val diaSemana: String,
    @SerializedName("hora_inicio") val horaInicio: String,
    @SerializedName("hora_fin") val horaFin: String,
    val activo: Boolean,
)

data class HorariosDisponiblesResponse(
    @SerializedName("horarios_disponibles") val horariosDisponibles: List<HorarioDisponible>,
)
