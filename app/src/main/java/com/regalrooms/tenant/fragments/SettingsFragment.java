package com.regalrooms.tenant.fragments;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Patterns;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.google.gson.Gson;
import com.regalrooms.tenant.MainActivity;
import com.regalrooms.tenant.databinding.FragmentSettingsBinding;
import com.regalrooms.tenant.models.Tenant;
import com.regalrooms.tenant.network.RetrofitClient;
import java.util.HashMap;
import java.util.Map;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class SettingsFragment extends Fragment {
    private FragmentSettingsBinding binding;
    private Tenant tenant;
    private SharedPreferences prefs;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentSettingsBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        prefs = requireActivity().getSharedPreferences("TenantPrefs", Context.MODE_PRIVATE);
        
        // Initial load from local cache for speed
        loadLocalData();

        binding.btnSaveProfile.setOnClickListener(v -> saveProfile());
        binding.btnUpdatePassword.setOnClickListener(v -> updatePassword());
        
        // Immediate sync from server to ensure latest data from website
        refreshProfileFromServer();
    }

    private void loadLocalData() {
        String tenantJson = prefs.getString("tenantData", null);
        if (tenantJson != null) {
            tenant = new Gson().fromJson(tenantJson, Tenant.class);
            updateUIFields();
        }
    }

    private void updateUIFields() {
        if (tenant != null) {
            binding.etSettingsName.setText(tenant.getName());
            binding.etSettingsEmail.setText(tenant.getEmail());
            binding.etSettingsPhone.setText(tenant.getPhone());
        }
    }

    private void refreshProfileFromServer() {
        String tenantId = prefs.getString("tenantId", null);
        if (tenantId == null) return;

        RetrofitClient.getApiService().getTenant(tenantId).enqueue(new Callback<Tenant>() {
            @Override
            public void onResponse(Call<Tenant> call, Response<Tenant> response) {
                if (response.isSuccessful() && response.body() != null) {
                    tenant = response.body();
                    // Save to local cache
                    prefs.edit().putString("tenantData", new Gson().toJson(tenant)).apply();
                    // Update UI fields in SettingsFragment
                    updateUIFields();
                    
                    // NEW: Update the sidebar header in MainActivity
                    if (getActivity() instanceof MainActivity) {
                        ((MainActivity) getActivity()).updateSidebarHeader();
                    }
                }
            }
            @Override
            public void onFailure(Call<Tenant> call, Throwable t) {
                Toast.makeText(getContext(), "Sync failed", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void saveProfile() {
        String name = binding.etSettingsName.getText().toString().trim();
        String email = binding.etSettingsEmail.getText().toString().trim();
        String phone = binding.etSettingsPhone.getText().toString().trim();

        if (name.isEmpty() || email.isEmpty() || phone.isEmpty()) {
            Toast.makeText(getContext(), "Fill all fields", Toast.LENGTH_SHORT).show();
            return;
        }

        // VALIDATION (Matching Website Logic)
        if (!name.matches("^[A-Za-z\\s]+$")) {
            Toast.makeText(getContext(), "Name must contain only letters and spaces", Toast.LENGTH_SHORT).show();
            return;
        }

        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            Toast.makeText(getContext(), "Please enter a valid email address", Toast.LENGTH_SHORT).show();
            return;
        }

        if (!phone.matches("^\\d+$")) {
            Toast.makeText(getContext(), "Phone number must be numeric", Toast.LENGTH_SHORT).show();
            return;
        }

        Map<String, String> body = new HashMap<>();
        body.put("name", name);
        body.put("email", email);
        body.put("phone", phone);
        body.put("roomNumber", tenant.getRoomNumber());

        RetrofitClient.getApiService().updateProfile(tenant.getId(), body).enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                if (response.isSuccessful()) {
                    Toast.makeText(getContext(), "Profile Updated Successfully", Toast.LENGTH_SHORT).show();
                    // Refresh from server to ensure full sync and update sidebar
                    refreshProfileFromServer();
                } else {
                    Toast.makeText(getContext(), "Update failed", Toast.LENGTH_SHORT).show();
                }
            }
            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                Toast.makeText(getContext(), "Network error", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void updatePassword() {
        String current = binding.etCurrentPass.getText().toString();
        String newPass = binding.etNewPass.getText().toString();
        String confirm = binding.etConfirmPass.getText().toString();

        if (current.isEmpty() || newPass.isEmpty() || confirm.isEmpty()) {
            Toast.makeText(getContext(), "Fill all password fields", Toast.LENGTH_SHORT).show();
            return;
        }

        if (!newPass.equals(confirm)) {
            Toast.makeText(getContext(), "New passwords do not match", Toast.LENGTH_SHORT).show();
            return;
        }

        Map<String, String> body = new HashMap<>();
        body.put("currentPass", current);
        body.put("newPass", newPass);

        RetrofitClient.getApiService().changePassword(tenant.getId(), body).enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                if (response.isSuccessful()) {
                    binding.etCurrentPass.setText("");
                    binding.etNewPass.setText("");
                    binding.etConfirmPass.setText("");
                    Toast.makeText(getContext(), "Password Updated Successfully", Toast.LENGTH_SHORT).show();
                } else {
                    Toast.makeText(getContext(), "Failed to update password. Check current password.", Toast.LENGTH_SHORT).show();
                }
            }
            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                Toast.makeText(getContext(), "Network error", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
