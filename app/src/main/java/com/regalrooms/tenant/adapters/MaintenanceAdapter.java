package com.regalrooms.tenant.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.button.MaterialButton;
import com.regalrooms.tenant.R;
import com.regalrooms.tenant.models.MaintenanceRequest;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Locale;

public class MaintenanceAdapter extends RecyclerView.Adapter<MaintenanceAdapter.ViewHolder> {
    private List<MaintenanceRequest> requests;
    private OnMaintenanceActionListener listener;
    private SimpleDateFormat sdf = new SimpleDateFormat("MM/dd/yyyy", Locale.getDefault());

    public interface OnMaintenanceActionListener {
        void onEdit(MaintenanceRequest request);
        void onDelete(MaintenanceRequest request);
    }

    public MaintenanceAdapter(List<MaintenanceRequest> requests, OnMaintenanceActionListener listener) {
        this.requests = requests;
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_maintenance, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        MaintenanceRequest r = requests.get(position);
        holder.tvCategory.setText(r.getCategory());
        holder.tvDesc.setText(r.getDescription());
        holder.tvDate.setText(r.getCreatedAt() != null ? sdf.format(r.getCreatedAt()) : "--");
        holder.tvStatus.setText(r.getStatus());

        boolean locked = "In Progress".equalsIgnoreCase(r.getStatus()) || "Resolved".equalsIgnoreCase(r.getStatus());

        if (locked) {
            holder.btnEdit.setVisibility(View.GONE);
            holder.btnDelete.setVisibility(View.GONE);
            holder.tvLocked.setVisibility(View.VISIBLE);
            holder.tvLocked.setText("Locked (" + r.getStatus() + ")");
        } else {
            holder.btnEdit.setVisibility(View.VISIBLE);
            holder.btnDelete.setVisibility(View.VISIBLE);
            holder.tvLocked.setVisibility(View.GONE);
        }

        holder.btnEdit.setOnClickListener(v -> listener.onEdit(r));
        holder.btnDelete.setOnClickListener(v -> listener.onDelete(r));
    }

    @Override
    public int getItemCount() {
        return requests.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvCategory, tvStatus, tvDesc, tvDate, tvLocked;
        MaterialButton btnEdit, btnDelete;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvCategory = itemView.findViewById(R.id.tvMaintCategory);
            tvStatus = itemView.findViewById(R.id.tvMaintStatus);
            tvDesc = itemView.findViewById(R.id.tvMaintDesc);
            tvDate = itemView.findViewById(R.id.tvMaintDate);
            tvLocked = itemView.findViewById(R.id.tvMaintLocked);
            btnEdit = itemView.findViewById(R.id.btnEditMaint);
            btnDelete = itemView.findViewById(R.id.btnDeleteMaint);
        }
    }
}