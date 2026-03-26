package com.regalrooms.tenant.models;

import com.google.gson.annotations.SerializedName;
import java.util.Date;

public class MaintenanceRequest {
    @SerializedName("_id")
    private String id;
    private String tenantId;
    private String category;
    private String description;
    private String status;
    private Date createdAt;

    // Getters and Setters
    public String getId() { return id; }
    public String getTenantId() { return tenantId; }
    public String getCategory() { return category; }
    public String getDescription() { return description; }
    public String getStatus() { return status; }
    public Date getCreatedAt() { return createdAt; }
}