package com.regalrooms.tenant.models;

import com.google.gson.annotations.SerializedName;
import java.util.Date;

public class ServiceRequest {
    @SerializedName("_id")
    private String id;
    private String tenantName;
    private String unit;
    private String type;
    private String vehicle;
    private String plateNumber;
    private Schedule schedule;
    private String details;
    private String status;
    private String denialReason;

    public static class Schedule {
        private String date;
        private String time;

        public String getDate() { return date; }
        public String getTime() { return time; }
    }

    // Getters and Setters
    public String getId() { return id; }
    public String getTenantName() { return tenantName; }
    public String getUnit() { return unit; }
    public String getType() { return type; }
    public String getVehicle() { return vehicle; }
    public String getPlateNumber() { return plateNumber; }
    public Schedule getSchedule() { return schedule; }
    public String getDetails() { return details; }
    public String getStatus() { return status; }
    public String getDenialReason() { return denialReason; }
}