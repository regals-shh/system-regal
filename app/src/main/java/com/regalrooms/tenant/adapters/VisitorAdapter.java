package com.regalrooms.tenant.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.button.MaterialButton;
import com.regalrooms.tenant.R;
import com.regalrooms.tenant.models.Visitor;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Locale;

public class VisitorAdapter extends RecyclerView.Adapter<VisitorAdapter.ViewHolder> {
    private List<Visitor> visitors;
    private OnVisitorActionListener listener;
    private SimpleDateFormat timeSdf = new SimpleDateFormat("hh:mm a", Locale.getDefault());
    private SimpleDateFormat dateSdf = new SimpleDateFormat("MM/dd/yyyy", Locale.getDefault());

    public interface OnVisitorActionListener {
        void onCheckout(Visitor visitor);
        void onEdit(Visitor visitor);
    }

    public VisitorAdapter(List<Visitor> visitors, OnVisitorActionListener listener) {
        this.visitors = visitors;
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_visitor, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Visitor v = visitors.get(position);
        holder.tvName.setText(v.getVisitorName());
        holder.tvDate.setText("Date: " + (v.getCheckInTime() != null ? dateSdf.format(v.getCheckInTime()) : "--"));
        
        String inTime = v.getCheckInTime() != null ? timeSdf.format(v.getCheckInTime()) : "--";
        String outTime = v.getCheckOutTime() != null ? timeSdf.format(v.getCheckOutTime()) : "---";
        holder.tvTimes.setText("In: " + inTime + " | Out: " + outTime);

        if (v.getCheckOutTime() == null) {
            holder.btnCheckout.setVisibility(View.VISIBLE);
        } else {
            holder.btnCheckout.setVisibility(View.GONE);
        }

        holder.btnCheckout.setOnClickListener(view -> listener.onCheckout(v));
        holder.btnEdit.setOnClickListener(view -> listener.onEdit(v));
    }

    @Override
    public int getItemCount() {
        return visitors.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvName, tvDate, tvTimes;
        MaterialButton btnCheckout, btnEdit;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvName = itemView.findViewById(R.id.tvVisitorName);
            tvDate = itemView.findViewById(R.id.tvVisitorDate);
            tvTimes = itemView.findViewById(R.id.tvVisitorTimes);
            btnCheckout = itemView.findViewById(R.id.btnCheckout);
            btnEdit = itemView.findViewById(R.id.btnEditVisitor);
        }
    }
}