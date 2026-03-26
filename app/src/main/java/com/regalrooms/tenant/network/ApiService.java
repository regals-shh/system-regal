package com.regalrooms.tenant.network;

import com.regalrooms.tenant.models.*;
import java.util.List;
import java.util.Map;
import okhttp3.MultipartBody;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.http.*;

public interface ApiService {
    @POST("api/tenant-login")
    Call<LoginResponse> login(@Body Map<String, String> credentials);

    @POST("api/auth/forgot-password-tenant")
    Call<ResponseBody> forgotPassword(@Body Map<String, String> body);

    @POST("api/auth/verify-reset-code")
    Call<ResponseBody> verifyResetCode(@Body Map<String, String> body);

    @POST("api/auth/reset-password")
    Call<ResponseBody> resetPassword(@Body Map<String, String> body);

    @GET("api/tenants/{id}")
    Call<Tenant> getTenant(@Path("id") String id);

    @GET("api/tenant-invoices/{roomNumber}")
    Call<List<Invoice>> getInvoices(@Path("roomNumber") String roomNumber);

    @GET("api/tenant-requests/{tenantId}")
    Call<List<MaintenanceRequest>> getMaintenanceRequests(@Path("tenantId") String tenantId);

    @GET("api/announcements")
    Call<List<Announcement>> getAnnouncements();

    @POST("api/announcement-seen/{id}")
    Call<ResponseBody> markAnnouncementSeen(@Path("id") String id, @Body Map<String, String> body);

    @POST("api/create-request")
    Call<ResponseBody> createMaintenanceRequest(@Body Map<String, String> body);

    @DELETE("api/delete-request/{id}")
    Call<ResponseBody> deleteMaintenanceRequest(@Path("id") String id);

    @PUT("api/update-request/{id}")
    Call<ResponseBody> updateMaintenanceRequest(@Path("id") String id, @Body Map<String, String> body);

    @GET("api/tenant-visitors")
    Call<List<Visitor>> getVisitors(@Query("tenantId") String tenantId);

    @POST("api/add-visitor")
    Call<ResponseBody> addVisitor(@Body Map<String, String> body);

    @PUT("api/checkout-visitor/{id}")
    Call<ResponseBody> checkoutVisitor(@Path("id") String id);

    @PUT("api/update-visitor/{id}")
    Call<ResponseBody> updateVisitor(@Path("id") String id, @Body Map<String, String> body);

    @GET("api/my-services/{name}")
    Call<List<ServiceRequest>> getServiceRequests(@Path("name") String name);

    @POST("api/request-service")
    Call<ResponseBody> requestService(@Body Map<String, Object> body);

    @PUT("api/service/{id}")
    Call<ResponseBody> updateService(@Path("id") String id, @Body Map<String, Object> body);

    @DELETE("api/service/{id}")
    Call<ResponseBody> deleteService(@Path("id") String id);

    @PUT("api/update-tenant/{id}")
    Call<ResponseBody> updateProfile(@Path("id") String id, @Body Map<String, String> body);

    @PUT("api/change-password/{id}")
    Call<ResponseBody> changePassword(@Path("id") String id, @Body Map<String, String> body);

    @Multipart
    @POST("api/upload-payment/{id}")
    Call<ResponseBody> uploadPayment(@Path("id") String id, @Part MultipartBody.Part proof);

    @DELETE("api/delete-proof/{id}")
    Call<ResponseBody> deleteProof(@Path("id") String id);
}