package com.regalrooms.tenant.models;

public class LoginResponse {
    private String message;
    private Tenant tenant;

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Tenant getTenant() { return tenant; }
    public void setTenant(Tenant tenant) { this.tenant = tenant; }
}