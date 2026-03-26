package com.regalrooms.tenant.network;

import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;
import java.util.concurrent.TimeUnit;

public class RetrofitClient {
    // Production server URL - Render deployment
    private static final String PRODUCTION_BASE_URL = "https://regals-backend.onrender.com/";
    
    // Development server URL (for emulator testing - use 10.0.2.2 for localhost)
    private static final String DEVELOPMENT_BASE_URL = "http://10.0.2.2:5000/";
    
    // Set to true for production, false for development
    private static final boolean IS_PRODUCTION = true;
    
    private static final String BASE_URL = IS_PRODUCTION ? PRODUCTION_BASE_URL : DEVELOPMENT_BASE_URL;
    private static Retrofit retrofit = null;

    public static ApiService getApiService() {
        if (retrofit == null) {
            HttpLoggingInterceptor interceptor = new HttpLoggingInterceptor();
            interceptor.setLevel(HttpLoggingInterceptor.Level.BODY);
            
            // Add timeout settings for mobile networks and emulator
            OkHttpClient client = new OkHttpClient.Builder()
                .addInterceptor(interceptor)
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .retryOnConnectionFailure(true)
                .build();

            retrofit = new Retrofit.Builder()
                    .baseUrl(BASE_URL)
                    .addConverterFactory(GsonConverterFactory.create())
                    .client(client)
                    .build();
        }
        return retrofit.create(ApiService.class);
    }
    
    // Method to get current base URL for debugging
    public static String getBaseUrl() {
        return BASE_URL;
    }
    
    // Method to switch between production and development
    public static void setProductionMode(boolean isProduction) {
        // This will require app restart to take effect
        // Consider using SharedPreferences for persistent setting
        retrofit = null; // Reset retrofit to force recreation with new URL
    }
}