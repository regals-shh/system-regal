package com.regalrooms.tenant.fragments;

import android.app.AlertDialog;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import com.google.gson.Gson;
import com.regalrooms.tenant.R;
import com.regalrooms.tenant.adapters.VisitorAdapter;
import com.regalrooms.tenant.databinding.FragmentVisitorsBinding;
import com.regalrooms.tenant.models.Tenant;
import com.regalrooms.tenant.models.Visitor;
import com.regalrooms.tenant.network.RetrofitClient;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class VisitorsFragment extends Fragment implements VisitorAdapter.OnVisitorActionListener {
    private FragmentVisitorsBinding binding;
    private Tenant tenant;
    private List<Visitor> visitorList = new ArrayList<>();
    private VisitorAdapter adapter;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentVisitorsBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        SharedPreferences prefs = requireActivity().getSharedPreferences("TenantPrefs", Context.MODE_PRIVATE);
        String tenantJson = prefs.getString("tenantData", null);
        tenant = new Gson().fromJson(tenantJson, Tenant.class);

        binding.rvVisitors.setLayoutManager(new LinearLayoutManager(getContext()));
        adapter = new VisitorAdapter(visitorList, this);
        binding.rvVisitors.setAdapter(adapter);

        binding.btnRegisterVisitor.setOnClickListener(v -> addVisitor());

        loadVisitors();
    }

    private void loadVisitors() {
        RetrofitClient.getApiService().getVisitors(tenant.getId()).enqueue(new Callback<List<Visitor>>() {
            @Override
            public void onResponse(Call<List<Visitor>> call, Response<List<Visitor>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    visitorList.clear();
                    visitorList.addAll(response.body());
                    adapter.notifyDataSetChanged();
                    binding.tvVisitorHeader.setText("Active & Recent Visitors (" + visitorList.size() + ")");
                }
            }

            @Override
            public void onFailure(Call<List<Visitor>> call, Throwable t) {
                Toast.makeText(getContext(), "Failed to load visitors", Toast.LENGTH_SHORT).show();
            }
        });
    }

    /**
     * Validates if a string contains only letters and spaces.
     */
    private boolean isValidName(String name) {
        // Regex: Only letters (A-Z, a-z) and spaces allowed
        return name.matches("^[a-zA-Z\\s]+$");
    }

    private void addVisitor() {
        String first = binding.etVisitorFirstName.getText().toString().trim();
        String last = binding.etVisitorLastName.getText().toString().trim();

        if (first.isEmpty() || last.isEmpty()) {
            Toast.makeText(getContext(), "Fill all fields", Toast.LENGTH_SHORT).show();
            return;
        }

        if (!isValidName(first) || !isValidName(last)) {
            Toast.makeText(getContext(), "Names should only contain letters", Toast.LENGTH_SHORT).show();
            return;
        }

        Map<String, String> body = new HashMap<>();
        body.put("visitorName", first + " " + last);
        body.put("tenantId", tenant.getId());
        body.put("tenantName", tenant.getName());
        body.put("roomNumber", tenant.getRoomNumber());

        RetrofitClient.getApiService().addVisitor(body).enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                if (response.isSuccessful()) {
                    binding.etVisitorFirstName.setText("");
                    binding.etVisitorLastName.setText("");
                    loadVisitors();
                    Toast.makeText(getContext(), "Visitor Registered", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {}
        });
    }

    @Override
    public void onCheckout(Visitor visitor) {
        RetrofitClient.getApiService().checkoutVisitor(visitor.getId()).enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                if (response.isSuccessful()) {
                    loadVisitors();
                    Toast.makeText(getContext(), "Visitor Checked Out", Toast.LENGTH_SHORT).show();
                }
            }
            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {}
        });
    }

    @Override
    public void onEdit(Visitor visitor) {
        View editView = LayoutInflater.from(getContext()).inflate(R.layout.dialog_edit_visitor, null);
        EditText etName = editView.findViewById(R.id.etVisitorName);
        etName.setText(visitor.getVisitorName());
        etName.setSelection(etName.getText().length()); // Place cursor at end

        new AlertDialog.Builder(getContext())
                .setTitle("Edit Visitor Name")
                .setView(editView)
                .setPositiveButton("Update", (dialog, which) -> {
                    String newName = etName.getText().toString().trim();
                    if (!newName.isEmpty()) {
                        updateVisitorName(visitor.getId(), newName);
                    } else {
                        Toast.makeText(getContext(), "Name cannot be empty", Toast.LENGTH_SHORT).show();
                    }
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void updateVisitorName(String visitorId, String newName) {
        Map<String, String> body = new HashMap<>();
        body.put("visitorName", newName);

        RetrofitClient.getApiService().updateVisitor(visitorId, body).enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                if (response.isSuccessful()) {
                    loadVisitors();
                    Toast.makeText(getContext(), "Visitor name updated", Toast.LENGTH_SHORT).show();
                } else {
                    Toast.makeText(getContext(), "Failed to update visitor: " + response.code(), Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                Toast.makeText(getContext(), "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }
}
