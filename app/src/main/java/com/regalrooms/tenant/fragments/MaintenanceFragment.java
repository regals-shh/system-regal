package com.regalrooms.tenant.fragments;

import android.app.AlertDialog;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import com.google.gson.Gson;
import com.regalrooms.tenant.R;
import com.regalrooms.tenant.adapters.MaintenanceAdapter;
import com.regalrooms.tenant.databinding.FragmentMaintenanceBinding;
import com.regalrooms.tenant.models.MaintenanceRequest;
import com.regalrooms.tenant.models.Tenant;
import com.regalrooms.tenant.network.RetrofitClient;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class MaintenanceFragment extends Fragment implements MaintenanceAdapter.OnMaintenanceActionListener {
    private FragmentMaintenanceBinding binding;
    private Tenant tenant;
    private List<MaintenanceRequest> requestList = new ArrayList<>();
    private MaintenanceAdapter adapter;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentMaintenanceBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        SharedPreferences prefs = requireActivity().getSharedPreferences("TenantPrefs", Context.MODE_PRIVATE);
        tenant = new Gson().fromJson(prefs.getString("tenantData", null), Tenant.class);

        setupSpinner();

        binding.rvMaintenance.setLayoutManager(new LinearLayoutManager(getContext()));
        adapter = new MaintenanceAdapter(requestList, this);
        binding.rvMaintenance.setAdapter(adapter);

        binding.btnSubmitRequest.setOnClickListener(v -> submitRequest());

        loadRequests();
    }

    private void setupSpinner() {
        String[] categories = {"Plumbing", "Electrical", "Aircon", "Carpentry", "Painting", "Appliance Repair", "Pest Control", "Other"};
        ArrayAdapter<String> adapter = new ArrayAdapter<>(requireContext(), android.R.layout.simple_spinner_item, categories);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        binding.spinnerIssueCategory.setAdapter(adapter);
    }

    private void loadRequests() {
        RetrofitClient.getApiService().getMaintenanceRequests(tenant.getId()).enqueue(new Callback<List<MaintenanceRequest>>() {
            @Override
            public void onResponse(Call<List<MaintenanceRequest>> call, Response<List<MaintenanceRequest>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    requestList.clear();
                    requestList.addAll(response.body());
                    Collections.sort(requestList, (a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
                    adapter.notifyDataSetChanged();
                    binding.tvMaintenanceHeader.setText("Your Requests (" + requestList.size() + ")");
                } else {
                    // Show error message for debugging
                    Toast.makeText(getContext(), "Failed to load requests: " + response.code(), Toast.LENGTH_SHORT).show();
                }
            }
            @Override
            public void onFailure(Call<List<MaintenanceRequest>> call, Throwable t) {
                // Show error message for debugging
                Toast.makeText(getContext(), "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void submitRequest() {
        String category = binding.spinnerIssueCategory.getSelectedItem().toString();
        String desc = binding.etIssueDesc.getText().toString().trim();

        if (desc.isEmpty()) {
            Toast.makeText(getContext(), "Please enter description", Toast.LENGTH_SHORT).show();
            return;
        }

        Map<String, String> body = new HashMap<>();
        body.put("tenantId", tenant.getId());
        body.put("category", category);
        body.put("description", desc);

        RetrofitClient.getApiService().createMaintenanceRequest(body).enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                if (response.isSuccessful()) {
                    binding.etIssueDesc.setText("");
                    loadRequests();
                    Toast.makeText(getContext(), "Request Submitted", Toast.LENGTH_SHORT).show();
                } else {
                    Toast.makeText(getContext(), "Failed to submit request: " + response.code(), Toast.LENGTH_SHORT).show();
                }
            }
            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                Toast.makeText(getContext(), "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    @Override
    public void onEdit(MaintenanceRequest request) {
        View dialogView = LayoutInflater.from(getContext()).inflate(R.layout.dialog_edit_maintenance, null);
        Spinner sp = dialogView.findViewById(R.id.spEditCategory);
        EditText et = dialogView.findViewById(R.id.etEditDesc);

        String[] categories = {"Plumbing", "Electrical", "Aircon", "Carpentry", "Painting", "Appliance Repair", "Pest Control", "Other"};
        ArrayAdapter<String> adapter = new ArrayAdapter<>(requireContext(), android.R.layout.simple_spinner_item, categories);
        sp.setAdapter(adapter);
        for(int i=0; i<categories.length; i++) if(categories[i].equals(request.getCategory())) sp.setSelection(i);
        et.setText(request.getDescription());

        new AlertDialog.Builder(getContext())
                .setTitle("Edit Maintenance Request")
                .setView(dialogView)
                .setPositiveButton("Update", (dialog, which) -> {
                    Map<String, String> body = new HashMap<>();
                    body.put("category", sp.getSelectedItem().toString());
                    body.put("description", et.getText().toString().trim());
                    RetrofitClient.getApiService().updateMaintenanceRequest(request.getId(), body).enqueue(new Callback<ResponseBody>() {
                        @Override
                        public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                            if (response.isSuccessful()) loadRequests();
                        }
                        @Override
                        public void onFailure(Call<ResponseBody> call, Throwable t) {}
                    });
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    @Override
    public void onDelete(MaintenanceRequest request) {
        new AlertDialog.Builder(getContext())
                .setTitle("Delete Request")
                .setMessage("Are you sure you want to delete this request?")
                .setPositiveButton("Yes", (dialog, which) -> {
                    RetrofitClient.getApiService().deleteMaintenanceRequest(request.getId()).enqueue(new Callback<ResponseBody>() {
                        @Override
                        public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                            if (response.isSuccessful()) loadRequests();
                        }
                        @Override
                        public void onFailure(Call<ResponseBody> call, Throwable t) {}
                    });
                })
                .setNegativeButton("No", null)
                .show();
    }
}