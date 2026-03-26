package com.regalrooms.tenant.models;

import com.google.gson.annotations.SerializedName;
import java.util.Date;
import java.util.List;

public class Announcement {
    @SerializedName("_id")
    private String id;
    private String title;
    private String message;
    private String priority;
    private Date createdAt;
    private List<SeenBy> seenBy;

    public static class SeenBy {
        private String tenantId;
        private String name;
        private Date seenAt;

        public String getTenantId() { return tenantId; }
        public String getName() { return name; }
        public Date getSeenAt() { return seenAt; }
    }

    // Getters and Setters
    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    public String getPriority() { return priority; }
    public Date getCreatedAt() { return createdAt; }
    public List<SeenBy> getSeenBy() { return seenBy; }
}