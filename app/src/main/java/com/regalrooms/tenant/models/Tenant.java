package com.regalrooms.tenant.models;

import com.google.gson.annotations.SerializedName;

public class Tenant {
    @SerializedName(value = "id", alternate = {"_id"})
    private String id;
    private String name;
    private String email;
    private String phone;
    private String roomNumber;
    private String status;
    private String role;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}