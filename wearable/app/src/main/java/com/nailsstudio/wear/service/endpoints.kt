package com.nailsstudio.wear.service

import com.google.gson.Gson
import com.nailsstudio.wear.BuildConfig
import com.nailsstudio.wear.data.model.ApiErrorResponse
import com.nailsstudio.wear.data.model.CrearCitaRequest
import com.nailsstudio.wear.data.model.CrearCitaResponse
import com.nailsstudio.wear.data.model.HorarioDisponible
import com.nailsstudio.wear.data.model.HorariosDisponiblesResponse
import com.nailsstudio.wear.data.model.Servicio
import com.nailsstudio.wear.data.model.ServiciosResponse
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import java.util.concurrent.TimeUnit

private interface NailsApi {
    @GET("servicios")
    suspend fun getServicios(): ServiciosResponse

    @GET("horarios/disponibles")
    suspend fun getHorariosDisponibles(): HorariosDisponiblesResponse

    @POST("citas")
    suspend fun crearCita(@Body request: CrearCitaRequest): Response<CrearCitaResponse>
}

object Endpoints {
    private val gson = Gson()

    private val client: OkHttpClient by lazy {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
        OkHttpClient.Builder()
            .addInterceptor(logging)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    private val api: NailsApi by lazy {
        Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
            .create(NailsApi::class.java)
    }

    suspend fun obtenerServicios(): Result<List<Servicio>> = runCatching {
        api.getServicios().servicios
    }

    suspend fun obtenerHorariosDisponibles(): Result<List<HorarioDisponible>> = runCatching {
        api.getHorariosDisponibles()
            .horariosDisponibles
            .filter { it.activo }
    }

    suspend fun crearCita(request: CrearCitaRequest): Result<CrearCitaResponse> = runCatching {
        val response = api.crearCita(request)
        if (response.isSuccessful) {
            response.body() ?: throw ApiException("Respuesta vacía del servidor.")
        } else {
            val errorBody = response.errorBody()?.string()
            val error = errorBody?.let { gson.fromJson(it, ApiErrorResponse::class.java) }
            val detalle = error?.errores?.values?.flatten()?.firstOrNull()
            throw ApiException(detalle ?: error?.mensaje ?: "No se pudo crear la cita.")
        }
    }
}

class ApiException(message: String) : Exception(message)
