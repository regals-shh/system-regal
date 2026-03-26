package com.regalrooms.tenant.models;

import com.google.gson.annotations.SerializedName;
import java.util.Date;

public class Visitor {
    @SerializedName("_id")
    private String id;
    private String visitorName;
    private String tenantId;
    private String tenantName;
    private String roomNumber;
    private Date checkInTime;
    private Date checkOutTime;

    // Getters and Setters
    public String getId() { return id; }
    public String getVisitorName() { return visitorName; }
    public String getTenantId() { return tenantId; }
    public String getTenantName() { return tenantName; }
    public String getRoomNumber() { return roomNumber; }
    public Date getCheckInTime() { return checkInTime; }
    public Date getCheckOutTime() { return checkOutTime; }
}