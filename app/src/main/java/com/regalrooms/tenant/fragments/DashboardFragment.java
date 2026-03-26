package com.regalrooms.tenant.fragments;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.google.gson.Gson;
import com.regalrooms.tenant.R;
import com.regalrooms.tenant.databinding.FragmentDashboardBinding;
import com.regalrooms.tenant.databinding.ItemDashboardTransactionBinding;
import com.regalrooms.tenant.models.Announcement;
import com.regalrooms.tenant.models.Invoice;
import com.regalrooms.tenant.models.MaintenanceRequest;
import com.regalrooms.tenant.models.Tenant;
import com.regalrooms.tenant.network.RetrofitClient;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Locale;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DashboardFragment extends Fragment {
    private FragmentDashboardBinding binding;
    private Tenant tenant;
    private SimpleDateFormat sdf = new SimpleDateFormat("MMM dd, yyyy", Locale.getDefault());
    private SimpleDateFormat sdfShort = new SimpleDateFormat("MMM dd", Locale.getDefault());

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentDashboardBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        SharedPreferences prefs = requireActivity().getSharedPreferences("TenantPrefs", Context.MODE_PRIVATE);
        String tenantJson = prefs.getString("tenantData", null);
        if (tenantJson != null) {
            tenant = new Gson().fromJson(tenantJson, Tenant.class);
            binding.tvWelcome.setText("Welcome back, " + tenant.getName().split(" ")[0] + "!");
            binding.tvRoom.setText("ROOM " + tenant.getRoomNumber());
            loadDashboardData();
        }
    }

    private void loadDashboardData() {
        // Load Invoices
        RetrofitClient.getApiService().getInvoices(tenant.getRoomNumber()).enqueue(new Callback<List<Invoice>>() {
            @Override
            public void onResponse(Call<List<Invoice>> call, Response<List<Invoice>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    updateInvoicesUI(response.body());
                }
            }
            @Override
            public void onFailure(Call<List<Invoice>> call, Throwable t) {}
        });

        // Load Maintenance
        RetrofitClient.getApiService().getMaintenanceRequests(tenant.getId()).enqueue(new Callback<List<MaintenanceRequest>>() {
            @Override
            public void onResponse(Call<List<MaintenanceRequest>> call, Response<List<MaintenanceRequest>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    List<MaintenanceRequest> requests = response.body();
                    int pendingCount = 0;
                    for (MaintenanceRequest r : requests) {
                        if ("Pending".equalsIgnoreCase(r.getStatus()) || "In Progress".equalsIgnoreCase(r.getStatus())) {
                            pendingCount++;
                        }
                    }
                    binding.tvActiveRequests.setText(String.valueOf(pendingCount));
                    binding.tvRequestsInfo.setText(pendingCount == 1 ? "1 active request" : pendingCount + " active requests");
                }
            }
            @Override
            public void onFailure(Call<List<MaintenanceRequest>> call, Throwable t) {}
        });

        // Load Announcements
        RetrofitClient.getApiService().getAnnouncements().enqueue(new Callback<List<Announcement>>() {
            @Override
            public void onResponse(Call<List<Announcement>> call, Response<List<Announcement>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    List<Announcement> announcements = response.body();
                    int unseen = 0;
                    for (Announcement a : announcements) {
                        boolean seen = false;
                        if (a.getSeenBy() != null) {
                            for (Announcement.SeenBy s : a.getSeenBy()) {
                                if (s.getTenantId() != null && s.getTenantId().equals(tenant.getId())) {
                                    seen = true;
                                    break;
                                }
                            }
                        }
                        if (!seen) unseen++;
                    }
                    binding.tvNoticeCount.setText(String.valueOf(unseen));
                    binding.tvNoticeText.setText(unseen == 1 ? "1 new notice" : unseen + " new notices");
                }
            }
            @Override
            public void onFailure(Call<List<Announcement>> call, Throwable t) {}
        });
    }

    private void updateInvoicesUI(List<Invoice> invoices) {
        Invoice unpaid = null;
        for (Invoice i : invoices) {
            if ("Pending".equalsIgnoreCase(i.getStatus())) {
                unpaid = i;
                break;
            }
        }

        if (unpaid != null) {
            binding.tvPaymentDue.setText("₱" + String.format(Locale.getDefault(), "%,.2f", unpaid.getAmount()));
            binding.tvPaymentDate.setText("Due on " + (unpaid.getDueDate() != null ? sdf.format(unpaid.getDueDate()) : "--"));
        } else {
            binding.tvPaymentDue.setText("₱0.00");
            binding.tvPaymentDate.setText("No pending payments");
        }

        // Fill table with custom item layout
        // Keep header and separator (first 2 children)
        while (binding.tableRecentActivity.getChildCount() > 2) {
            binding.tableRecentActivity.removeViewAt(2);
        }

        for (int i = 0; i < Math.min(invoices.size(), 5); i++) {
            Invoice inv = invoices.get(i);
            ItemDashboardTransactionBinding itemBinding = ItemDashboardTransactionBinding.inflate(
                    getLayoutInflater(), binding.tableRecentActivity, false);
            
            itemBinding.tvTransactionDesc.setText(inv.getDescription());
            itemBinding.tvTransactionDate.setText(inv.getDueDate() != null ? sdfShort.format(inv.getDueDate()) : "--");
            itemBinding.tvTransactionAmount.setText("₱" + String.format(Locale.getDefault(), "%,.0f", inv.getAmount()));
            
            // Highlight pending items in the table
            if ("Pending".equalsIgnoreCase(inv.getStatus())) {
                itemBinding.tvTransactionAmount.setTextColor(getResources().getColor(R.color.text_red));
            }

            binding.tableRecentActivity.addView(itemBinding.getRoot());
        }
    }
}
