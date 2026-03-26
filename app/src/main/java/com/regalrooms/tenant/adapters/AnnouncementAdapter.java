package com.regalrooms.tenant.adapters;

import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.button.MaterialButton;
import com.regalrooms.tenant.R;
import com.regalrooms.tenant.models.Announcement;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Locale;

public class AnnouncementAdapter extends RecyclerView.Adapter<AnnouncementAdapter.ViewHolder> {
    private List<Announcement> announcements;
    private String currentTenantId;
    private OnAnnouncementActionListener listener;
    private SimpleDateFormat sdf = new SimpleDateFormat("MM/dd/yyyy", Locale.getDefault());

    public interface OnAnnouncementActionListener {
        void onMarkSeen(Announcement announcement);
    }

    public AnnouncementAdapter(List<Announcement> announcements, String tenantId, OnAnnouncementActionListener listener) {
        this.announcements = announcements;
        this.currentTenantId = tenantId;
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_announcement, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Announcement a = announcements.get(position);
        if (a == null) return;

        holder.tvTitle.setText(a.getTitle() != null ? a.getTitle() : "No Title");
        holder.tvMessage.setText(a.getMessage() != null ? a.getMessage() : "");
        holder.tvDate.setText(a.getCreatedAt() != null ? sdf.format(a.getCreatedAt()) : "--");
        
        String priority = (a.getPriority() != null ? a.getPriority() : "normal").toUpperCase();
        holder.tvPriority.setText(priority);
        
        // Safe resource loading
        try {
            if ("URGENT".equalsIgnoreCase(priority)) {
                holder.tvPriority.setBackgroundResource(R.drawable.priority_urgent_bg);
                holder.layout.setBackgroundColor(Color.parseColor("#FEF2F2"));
            } else if ("IMPORTANT".equalsIgnoreCase(priority)) {
                holder.tvPriority.setBackgroundResource(R.drawable.priority_important_bg);
                holder.layout.setBackgroundColor(Color.parseColor("#FFFBEB"));
            } else {
                holder.tvPriority.setBackgroundResource(R.drawable.priority_normal_bg);
                holder.layout.setBackgroundColor(Color.parseColor("#F8FAFC"));
            }
        } catch (Exception e) {
            holder.tvPriority.setBackgroundColor(Color.GRAY);
        }

        boolean seen = false;
        if (a.getSeenBy() != null && currentTenantId != null) {
            for (Announcement.SeenBy s : a.getSeenBy()) {
                if (currentTenantId.equals(s.getTenantId())) {
                    seen = true;
                    break;
                }
            }
        }

        if (seen) {
            holder.btnSeen.setText("Already Seen");
            holder.btnSeen.setEnabled(false);
            holder.btnSeen.setTextColor(Color.GRAY);
            holder.btnSeen.setIconResource(0); // Remove icon if already seen
        } else {
            holder.btnSeen.setText("Mark as Seen");
            holder.btnSeen.setEnabled(true);
            holder.btnSeen.setTextColor(ContextCompat.getColor(holder.itemView.getContext(), R.color.primary));
            holder.btnSeen.setOnClickListener(v -> {
                if (listener != null) listener.onMarkSeen(a);
            });
        }
    }

    @Override
    public int getItemCount() {
        return announcements != null ? announcements.size() : 0;
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvTitle, tvMessage, tvDate, tvPriority;
        MaterialButton btnSeen;
        View layout;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvTitle = itemView.findViewById(R.id.tvAnnTitle);
            tvMessage = itemView.findViewById(R.id.tvAnnMessage);
            tvDate = itemView.findViewById(R.id.tvAnnDate);
            tvPriority = itemView.findViewById(R.id.tvAnnPriority);
            btnSeen = itemView.findViewById(R.id.btnMarkSeen);
            layout = itemView.findViewById(R.id.layoutAnnouncement);
        }
    }
}
