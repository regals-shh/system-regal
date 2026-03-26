package com.regalrooms.tenant.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.button.MaterialButton;
import com.regalrooms.tenant.R;
import com.regalrooms.tenant.models.Invoice;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Locale;

public class InvoiceAdapter extends RecyclerView.Adapter<InvoiceAdapter.ViewHolder> {
    private List<Invoice> invoices;
    private OnInvoiceActionListener listener;
    private SimpleDateFormat sdf = new SimpleDateFormat("MM/dd/yyyy", Locale.getDefault());

    public interface OnInvoiceActionListener {
        void onChangeProof(Invoice invoice);
        void onDeleteProof(Invoice invoice);
    }

    public InvoiceAdapter(List<Invoice> invoices, OnInvoiceActionListener listener) {
        this.invoices = invoices;
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_invoice, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Invoice inv = invoices.get(position);
        holder.tvId.setText("#INV-" + inv.getId().substring(inv.getId().length() - 4));
        holder.tvDesc.setText(inv.getDescription());
        holder.tvDueDate.setText("Due: " + (inv.getDueDate() != null ? sdf.format(inv.getDueDate()) : "--"));
        holder.tvAmount.setText("₱" + String.format(Locale.getDefault(), "%,.0f", inv.getAmount()));
        holder.tvStatus.setText(inv.getStatus());

        // Status Colors
        if ("Paid".equalsIgnoreCase(inv.getStatus())) {
            holder.tvStatus.setBackgroundResource(R.drawable.status_paid_bg);
            holder.tvStatus.setTextColor(holder.itemView.getContext().getColor(R.color.status_paid_text));
            holder.layoutActions.setVisibility(View.GONE);
        } else {
            holder.tvStatus.setBackgroundResource(R.drawable.status_pending_bg);
            holder.tvStatus.setTextColor(holder.itemView.getContext().getColor(R.color.status_pending_text));
            holder.layoutActions.setVisibility(View.VISIBLE);
        }

        holder.btnChange.setOnClickListener(v -> listener.onChangeProof(inv));
        holder.btnDelete.setOnClickListener(v -> listener.onDeleteProof(inv));
    }

    @Override
    public int getItemCount() {
        return invoices.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvId, tvDesc, tvDueDate, tvAmount, tvStatus;
        View layoutActions;
        MaterialButton btnChange, btnDelete;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvId = itemView.findViewById(R.id.tvInvoiceId);
            tvDesc = itemView.findViewById(R.id.tvInvoiceDesc);
            tvDueDate = itemView.findViewById(R.id.tvInvoiceDueDate);
            tvAmount = itemView.findViewById(R.id.tvInvoiceAmount);
            tvStatus = itemView.findViewById(R.id.tvInvoiceStatus);
            layoutActions = itemView.findViewById(R.id.layoutInvoiceActions);
            btnChange = itemView.findViewById(R.id.btnChangeProof);
            btnDelete = itemView.findViewById(R.id.btnDeleteProof);
        }
    }
}