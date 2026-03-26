package com.regalrooms.tenant.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.button.MaterialButton;
import com.regalrooms.tenant.R;
import com.regalrooms.tenant.models.ServiceRequest;
import java.util.List;

public class ServiceAdapter extends RecyclerView.Adapter<ServiceAdapter.ViewHolder> {
    private List<ServiceRequest> requests;
    private OnServiceActionListener listener;

    public interface OnServiceActionListener {
        void onEdit(ServiceRequest request);
        void onCancel(ServiceRequest request);
    }

    public ServiceAdapter(List<ServiceRequest> requests, OnServiceActionListener listener) {
        this.requests = requests;
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_service_request, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        ServiceRequest r = requests.get(position);
        holder.tvType.setText(r.getType());
        holder.tvStatus.setText(r.getStatus());

        StringBuilder info = new StringBuilder();
        if ("Parking".equalsIgnoreCase(r.getType())) {
            info.append("Vehicle: ").append(r.getVehicle()).append("\n")
                .append("Plate: ").append(r.getPlateNumber()).append("\n")
                .append("Date: ").append(r.getSchedule().getDate()).append("\n")
                .append("Time: ").append(r.getSchedule().getTime());
        } else {
            info.append("Date: ").append(r.getSchedule().getDate()).append("\n")
                .append("Time: ").append(r.getSchedule().getTime()).append("\n")
                .append("Purpose: ").append(r.getDetails());
        }
        holder.tvDetails.setText(info.toString());

        if ("Pending".equalsIgnoreCase(r.getStatus())) {
            holder.layoutActions.setVisibility(View.VISIBLE);
        } else if ("Approved".equalsIgnoreCase(r.getStatus())) {
            holder.layoutActions.setVisibility(View.VISIBLE);
            holder.btnEdit.setVisibility(View.GONE);
        } else {
            holder.layoutActions.setVisibility(View.GONE);
        }

        holder.btnEdit.setOnClickListener(v -> listener.onEdit(r));
        holder.btnCancel.setOnClickListener(v -> listener.onCancel(r));
    }

    @Override
    public int getItemCount() {
        return requests.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvType, tvStatus, tvDetails;
        View layoutActions;
        MaterialButton btnEdit, btnCancel;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvType = itemView.findViewById(R.id.tvServiceType);
            tvStatus = itemView.findViewById(R.id.tvServiceStatus);
            tvDetails = itemView.findViewById(R.id.tvServiceDetails);
            layoutActions = itemView.findViewById(R.id.layoutServiceActions);
            btnEdit = itemView.findViewById(R.id.btnEditService);
            btnCancel = itemView.findViewById(R.id.btnCancelService);
        }
    }
}